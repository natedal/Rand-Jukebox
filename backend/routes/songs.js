import express from 'express';
import { getPool } from '../db/index.js';
import { getVenueId } from '../utils/queue.js';
import { getUserIdentifier, getUsername } from '../utils/userIdentifier.js';
import { searchSpotify, getSpotifyAccessToken, getAudioFeatures } from '../services/spotify.js';

const router = express.Router();

/**
 * POST /api/songs/search
 * Search for songs on Spotify (with filter support)
 */
router.post('/search', async (req, res) => {
  try {
    // Ensure venue middleware attached venue to request
    if (!req.venue || !req.venue.id) {
      console.error('Venue middleware failed - venue not attached to request');
      return res.status(500).json({ error: 'Venue configuration error. Please check backend logs.' });
    }

    const { query } = req.body;
    const searchQuery = (query || '').trim().toLowerCase();

    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const pool = getPool();

    // Get filter settings
    const settingsResult = await pool.query(
      `SELECT filter_mode, ban_explicit, genre_filter, playlist_id 
       FROM admin_settings 
       WHERE venue_id = $1`,
      [venueId]
    );

    const settings = settingsResult.rows[0] || {
      filter_mode: 'free',
      ban_explicit: false,
      genre_filter: [],
      playlist_id: null,
    };

    let results = [];

    // Playlist-only mode: fetch from playlist tracks instead of Spotify search
    if (settings.filter_mode === 'tailored' && settings.playlist_id) {
      // Get all allowed tracks from the playlist
      const allowedTracksResult = await pool.query(
        `SELECT spotify_id FROM allowed_playlist_tracks 
         WHERE venue_id = $1 AND playlist_id = $2`,
        [venueId, settings.playlist_id]
      );
      
      if (allowedTracksResult.rows.length === 0) {
        return res.json({ results: [] });
      }

      const allowedSpotifyIds = allowedTracksResult.rows.map(row => row.spotify_id);
      
      // Fetch track details from Spotify in batches (Spotify allows up to 50 IDs per request)
      const accessToken = await getSpotifyAccessToken();
      const axios = (await import('axios')).default;
      
      const batches = [];
      for (let i = 0; i < allowedSpotifyIds.length; i += 50) {
        batches.push(allowedSpotifyIds.slice(i, i + 50));
      }

      const allTracks = [];
      for (const batch of batches) {
        try {
          const response = await axios.get('https://api.spotify.com/v1/tracks', {
            params: { ids: batch.join(',') },
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          
          const tracks = (response.data.tracks || []).map(track => ({
            spotify_id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || 'Unknown',
            album: track.album?.name || 'Unknown',
            album_art_url: track.album?.images[0]?.url || null,
            duration_ms: track.duration_ms,
            is_explicit: track.explicit || false,
          }));
          
          allTracks.push(...tracks);
        } catch (error) {
          console.error('Error fetching track batch:', error);
        }
      }

      // Filter by search query if provided
      if (searchQuery.length > 0) {
        results = allTracks.filter(track => {
          const titleMatch = track.title.toLowerCase().includes(searchQuery);
          const artistMatch = track.artist.toLowerCase().includes(searchQuery);
          const albumMatch = track.album.toLowerCase().includes(searchQuery);
          return titleMatch || artistMatch || albumMatch;
        });
      } else {
        // No query: return all playlist tracks
        results = allTracks;
      }

      // Apply explicit ban filter
      if (settings.ban_explicit) {
        results = results.filter(track => !track.is_explicit);
      }

      // Limit results to 100 for performance
      results = results.slice(0, 100);
    } else {
      // Free mode: use Spotify search
      if (!searchQuery || searchQuery.length === 0) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Build search query with genre filter if applicable
      let spotifySearchQuery = searchQuery;
      if (settings.genre_filter && settings.genre_filter.length > 0) {
        const genreKeywords = settings.genre_filter.join(' ');
        spotifySearchQuery = `${searchQuery} ${genreKeywords}`;
      }

      const accessToken = await getSpotifyAccessToken();
      results = await searchSpotify(spotifySearchQuery, accessToken);

      // Apply filters
      // 1. Ban explicit songs if enabled
      if (settings.ban_explicit) {
        results = results.filter(track => !track.is_explicit);
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error searching songs:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      venueId: req.venue?.id,
      venueSlug: req.venue?.slug,
      query: req.body?.query,
    });
    
    // Provide more specific error messages
    if (error.message && error.message.includes('Spotify')) {
      return res.status(500).json({ 
        error: 'Spotify service unavailable. Please try again later.' 
      });
    }
    
    if (error.message && (error.message.includes('database') || error.message.includes('query'))) {
      return res.status(500).json({ 
        error: 'Database error. Please check backend logs.' 
      });
    }
    
    // Log full error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error object:', error);
    }
    
    res.status(500).json({ 
      error: 'Failed to search songs. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/songs/request
 * Request a song to be added to queue
 */
router.post('/request', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { spotify_id } = req.body;
    const userIdentifier = getUserIdentifier(req);
    const username = getUsername(req) || userIdentifier.substring(0, 20); // Use username if provided, else fallback to truncated identifier
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!spotify_id) {
      return res.status(400).json({ error: 'spotify_id is required' });
    }

    await client.query('BEGIN');

    // Get admin settings (including filters)
    const settingsResult = await client.query(
      `SELECT is_queue_enabled, filter_mode, ban_explicit, playlist_id 
       FROM admin_settings WHERE venue_id = $1`,
      [venueId]
    );
    
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].is_queue_enabled) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Queue is currently disabled' });
    }

    const settings = settingsResult.rows[0];

    // Check daily request limit (configurable via MAX_REQUESTS_PER_DAY, default 3)
    const maxRequestsPerDay = parseInt(process.env.MAX_REQUESTS_PER_DAY || '3');
    const today = new Date().toISOString().split('T')[0];
    const requestsResult = await client.query(
      `SELECT COUNT(*) as count 
       FROM user_requests 
       WHERE venue_id = $1 AND user_identifier = $2 AND date = $3`,
      [venueId, userIdentifier, today]
    );

    const requestsToday = parseInt(requestsResult.rows[0].count);
    if (requestsToday >= maxRequestsPerDay) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Daily limit reached',
        requests_remaining: 0,
      });
    }

    // Check if user already requested this song today
    const existingRequest = await client.query(
      `SELECT id FROM user_requests 
       WHERE venue_id = $1 AND user_identifier = $2 AND date = $3 
       AND song_id IN (SELECT id FROM songs WHERE spotify_id = $4)`,
      [venueId, userIdentifier, today, spotify_id]
    );

    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You already requested this song today' });
    }

    // Get song details from Spotify
    const accessToken = await getSpotifyAccessToken();
    const spotifyTrack = await getSpotifyTrackDetails(spotify_id, accessToken);

    // Check filters before allowing request
    // 1. Ban explicit songs if enabled
    if (settings.ban_explicit && spotifyTrack.explicit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Explicit songs are not allowed' });
    }

    // 2. Playlist-only mode: check if track is in allowed playlist
    if (settings.filter_mode === 'tailored' && settings.playlist_id) {
      const allowedTrackResult = await client.query(
        `SELECT spotify_id FROM allowed_playlist_tracks 
         WHERE venue_id = $1 AND playlist_id = $2 AND spotify_id = $3`,
        [venueId, settings.playlist_id, spotify_id]
      );

      if (allowedTrackResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This song is not in the allowed playlist' });
      }
    }

    // Fetch audio features for tag generation
    // Try premium token first (has better permissions), fallback to client credentials
    let audioFeatures = null;
    try {
      const { getSpotifyPremiumAccessToken } = await import('../services/spotify.js');
      try {
        const premiumToken = await getSpotifyPremiumAccessToken(venueId);
        audioFeatures = await getAudioFeatures(spotify_id, premiumToken);
      } catch (premiumError) {
        // Fallback to client credentials token
        audioFeatures = await getAudioFeatures(spotify_id, accessToken);
      }
    } catch (error) {
      console.warn('Could not fetch audio features:', error.message);
      // Continue without audio features - not critical
    }

    // Insert song with pending approval status
    const songResult = await client.query(
      `INSERT INTO songs (
        venue_id, spotify_id, title, artist, album, 
        album_art_url, duration_ms, is_explicit, requested_by, 
        status, approval_status, audio_features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending', $10)
      RETURNING *`,
      [
        venueId,
        spotify_id,
        spotifyTrack.name,
        spotifyTrack.artists[0].name,
        spotifyTrack.album.name,
        spotifyTrack.album.images[0]?.url || null,
        spotifyTrack.duration_ms,
        spotifyTrack.explicit,
        username, // Use username instead of truncated identifier
        audioFeatures ? JSON.stringify(audioFeatures) : null,
      ]
    );

    const song = songResult.rows[0];

    // Record user request
    await client.query(
      `INSERT INTO user_requests (venue_id, user_identifier, song_id, date)
       VALUES ($1, $2, $3, $4)`,
      [venueId, userIdentifier, song.id, today]
    );

    await client.query('COMMIT');

    // Emit socket event for pending song (admin will see it in pending requests)
    const io = req.app.get('io');
    if (io) {
      io.to(`venue:${venueSlug}`).emit('song:pending', {
        song: {
          id: song.id,
          spotify_id: song.spotify_id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          album_art_url: song.album_art_url,
          duration_ms: song.duration_ms,
          votes: 0,
          requested_at: song.requested_at,
          requested_by: song.requested_by,
          approval_status: 'pending',
          audio_features: song.audio_features,
        },
      });
    }

    res.json({
      success: true,
      song: {
        id: song.id,
        spotify_id: song.spotify_id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        album_art_url: song.album_art_url,
        duration_ms: song.duration_ms,
        votes: 0,
        requested_at: song.requested_at,
        requested_by: song.requested_by,
        approval_status: 'pending',
      },
      requests_remaining: maxRequestsPerDay - (requestsToday + 1),
      message: 'Song requested successfully. Waiting for admin approval.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error requesting song:', error);
    res.status(500).json({ error: 'Failed to request song' });
  } finally {
    client.release();
  }
});

/**
 * Helper: Get track details from Spotify
 */
async function getSpotifyTrackDetails(trackId, accessToken) {
  const axios = (await import('axios')).default;
  const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export default router;

