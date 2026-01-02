import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { getPool } from '../db/index.js';
import { getVenueId, getQueue, getCurrentSong } from '../utils/queue.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { playSpotifyTrack, pauseSpotifyPlayback, skipSpotifyTrack, getSpotifyDevices, getSpotifyPremiumAccessToken, getPlaylistInfo } from '../services/spotify.js';
import { addDefaultPlaylistSongs } from '../services/playlist.js';

const router = express.Router();

/**
 * POST /api/admin/login
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT admin_password_hash FROM admin_settings WHERE venue_id = $1',
      [venueId]
    );

    if (result.rows.length === 0) {
      console.error('Admin settings not found for venue:', venueSlug, 'venueId:', venueId);
      return res.status(404).json({ error: 'Admin settings not found' });
    }

    const passwordHash = result.rows[0].admin_password_hash;
    const trimmedPassword = password.trim();
    const isValid = await bcrypt.compare(trimmedPassword, passwordHash);

    if (!isValid) {
      console.error('Password mismatch:', {
        receivedLength: password.length,
        receivedValue: password,
        hashPrefix: passwordHash?.substring(0, 20)
      });
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { admin: true, venue: venueSlug, venue_id: venueId },
      process.env.JWT_SECRET || 'change_this_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/admin/status
 * Get admin dashboard status
 */
router.get('/status', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const pool = getPool();

    const [queue, currentSong, settingsResult] = await Promise.all([
      getQueue(venueId),
      getCurrentSong(venueId),
      pool.query(
        'SELECT * FROM admin_settings WHERE venue_id = $1',
        [venueId]
      ),
    ]);

    const settings = settingsResult.rows[0];

    // Get stats
    const today = new Date().toISOString().split('T')[0];
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM playback_history WHERE venue_id = $1 AND DATE(played_at) = $2) as songs_played_today,
        (SELECT COUNT(DISTINCT user_identifier) FROM user_requests WHERE venue_id = $1 AND date = $2) as active_users,
        (SELECT COUNT(*) FROM votes v JOIN songs s ON v.song_id = s.id WHERE s.venue_id = $1) as total_votes
    `, [venueId, today]);

    const stats = statsResult.rows[0];

    res.json({
      is_playing: settings.is_playing,
      queue_enabled: settings.is_queue_enabled,
      current_song: currentSong,
      default_playlist_id: settings.default_playlist_id,
      selected_device_id: settings.selected_device_id,
      queue_length: queue.length,
      stats: {
        songs_played_today: parseInt(stats.songs_played_today) || 0,
        active_users: parseInt(stats.active_users) || 0,
        total_votes: parseInt(stats.total_votes) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching admin status:', error);
    res.status(500).json({ error: 'Failed to fetch admin status' });
  }
});

/**
 * GET /api/admin/devices
 * Get available Spotify devices
 */
router.get('/devices', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const devices = await getSpotifyDevices(venueId);
    res.json({ devices });
  } catch (error) {
    // If Spotify not connected, return empty array instead of error
    if (error.message && (
      error.message.includes('not configured') || 
      error.message.includes('refresh') ||
      error.message.includes('Premium credentials')
    )) {
      return res.json({ devices: [] });
    }
    console.error('Error getting devices:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

/**
 * POST /api/admin/devices/select
 * Select a device for playback
 */
router.post('/devices/select', authenticateAdmin, async (req, res) => {
  try {
    const { device_id } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    
    const pool = getPool();
    await pool.query(
      'UPDATE admin_settings SET selected_device_id = $1 WHERE venue_id = $2',
      [device_id, venueId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error selecting device:', error);
    res.status(500).json({ error: 'Failed to select device' });
  }
});

/**
 * GET /api/admin/spotify/status
 * Check if Spotify is connected for this venue
 */
router.get('/spotify/status', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const pool = getPool();
    
    const result = await pool.query(
      'SELECT spotify_refresh_token FROM admin_settings WHERE venue_id = $1',
      [venueId]
    );
    
    res.json({ 
      connected: !!result.rows[0]?.spotify_refresh_token 
    });
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    res.status(500).json({ error: 'Failed to check Spotify status' });
  }
});

/**
 * GET /api/admin/spotify/auth
 * Get Spotify OAuth authorization URL
 */
router.get('/spotify/auth', authenticateAdmin, async (req, res) => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ 
        error: 'Spotify Client ID not configured. Please set SPOTIFY_CLIENT_ID environment variable.' 
      });
    }
    
    // Use frontend URL for callback - Spotify requires exact match
    const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
    
    // Remove trailing slashes
    const cleanFrontendUrl = frontendUrl.replace(/\/+$/, '');
    const redirectUri = `${cleanFrontendUrl}/api/spotify/callback`;
    
    // Validate redirect URI format
    if (!redirectUri.match(/^https?:\/\/.+\/api\/spotify\/callback$/)) {
      console.error('Invalid redirect URI format:', redirectUri);
      return res.status(500).json({ 
        error: 'Invalid FRONTEND_URL configuration. Must be a valid URL (e.g., https://rand-jukebox.vercel.app)' 
      });
    }
    
    const scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
    const state = req.user.venue; // Use venue slug as state for verification
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${encodeURIComponent(state)}&` +
      `show_dialog=true`;
    
    res.json({ auth_url: authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * POST /api/admin/spotify/disconnect
 * Disconnect Spotify account (clear refresh token and selected device)
 */
router.post('/spotify/disconnect', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const pool = getPool();
    
    // Clear refresh token and selected device
    await pool.query(
      'UPDATE admin_settings SET spotify_refresh_token = NULL, selected_device_id = NULL WHERE venue_id = $1',
      [venueId]
    );
    
    res.json({ 
      success: true,
      message: 'Spotify account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Spotify:', error);
    res.status(500).json({ error: 'Failed to disconnect Spotify account' });
  }
});

/**
 * GET /api/admin/spotify/callback
 * Handle Spotify OAuth callback (public route - uses state parameter for venue identification)
 */
router.get('/spotify/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?spotify_error=no_code`);
    }
    
    if (!state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?spotify_error=no_state`);
    }
    
    // Use state as venue slug
    const venueSlug = state;
    const venueId = await getVenueId(venueSlug);
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    // Use frontend URL for callback - must match the redirect_uri in the auth request
    const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
    const redirectUri = `${frontendUrl}/api/spotify/callback`;
    
    // Exchange code for refresh token
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // Store refresh token
    const pool = getPool();
    await pool.query(
      'UPDATE admin_settings SET spotify_refresh_token = $1 WHERE venue_id = $2',
      [response.data.refresh_token, venueId]
    );
    
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?spotify_connected=true`);
  } catch (error) {
    console.error('Spotify OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?spotify_error=oauth_failed`);
  }
});

/**
 * POST /api/admin/playback/play
 * Start playback
 */
router.post('/playback/play', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    await client.query('BEGIN');

    // Get current song or next in queue
    let currentSong = await getCurrentSong(venueId);
    
    if (!currentSong) {
      // Get next song from queue
      const queue = await getQueue(venueId);
      if (queue.length === 0) {
        // Auto-add default playlist songs
        await addDefaultPlaylistSongs(venueId, client);
        const newQueue = await getQueue(venueId);
        if (newQueue.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'No songs in queue and no default playlist set' });
        }
        currentSong = newQueue[0];
      } else {
        currentSong = queue[0];
      }
    }

    // Update song status
    await client.query(
      'UPDATE songs SET status = $1, played_at = NOW() WHERE id = $2',
      ['playing', currentSong.id]
    );

    // Update admin settings
    await client.query(
      'UPDATE admin_settings SET is_playing = $1, current_song_id = $2 WHERE venue_id = $3',
      [true, currentSong.id, venueId]
    );

    await client.query('COMMIT');

    // Play on Spotify
    try {
      await playSpotifyTrack(currentSong.spotify_id, null, venueId);
    } catch (error) {
      console.error('Error playing on Spotify:', error);
      // Continue anyway - playback state is updated
    }

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('playback:started', {
      song: currentSong,
    });

    res.json({
      success: true,
      is_playing: true,
      current_song: currentSong,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error starting playback:', error);
    res.status(500).json({ error: 'Failed to start playback' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/playback/pause
 * Pause playback
 */
router.post('/playback/pause', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    await client.query('BEGIN');

    await client.query(
      'UPDATE admin_settings SET is_playing = $1 WHERE venue_id = $2',
      [false, venueId]
    );

    await client.query('COMMIT');

    // Pause on Spotify
    try {
      await pauseSpotifyPlayback(null, venueId);
    } catch (error) {
      console.error('Error pausing Spotify:', error);
    }

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('playback:paused');

    res.json({
      success: true,
      is_playing: false,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error pausing playback:', error);
    res.status(500).json({ error: 'Failed to pause playback' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/playback/skip
 * Skip current song, play next
 */
router.post('/playback/skip', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    await client.query('BEGIN');

    // Mark current song as skipped
    const currentSong = await getCurrentSong(venueId);
    if (currentSong) {
      await client.query(
        'UPDATE songs SET status = $1 WHERE id = $2',
        ['skipped', currentSong.id]
      );

      // Record in history
      await client.query(
        `INSERT INTO playback_history (venue_id, song_id, was_skipped)
         VALUES ($1, $2, $3)`,
        [venueId, currentSong.id, true]
      );
    }

    // Get next song
    let nextSong = null;
    const queue = await getQueue(venueId);
    
    if (queue.length > 0) {
      nextSong = queue[0];
      await client.query(
        'UPDATE songs SET status = $1, played_at = NOW() WHERE id = $2',
        ['playing', nextSong.id]
      );
      await client.query(
        'UPDATE admin_settings SET current_song_id = $1 WHERE venue_id = $2',
        [nextSong.id, venueId]
      );
    } else {
      // Auto-add default playlist songs
      await addDefaultPlaylistSongs(venueId, client);
      const newQueue = await getQueue(venueId);
      if (newQueue.length > 0) {
        nextSong = newQueue[0];
        await client.query(
          'UPDATE songs SET status = $1, played_at = NOW() WHERE id = $2',
          ['playing', nextSong.id]
        );
        await client.query(
          'UPDATE admin_settings SET current_song_id = $1 WHERE venue_id = $2',
          [nextSong.id, venueId]
        );
      } else {
        // No songs available
        await client.query(
          'UPDATE admin_settings SET is_playing = $1, current_song_id = NULL WHERE venue_id = $2',
          [false, venueId]
        );
      }
    }

    await client.query('COMMIT');

    // Skip on Spotify
    if (nextSong) {
      try {
        await skipSpotifyTrack(null, venueId);
        // Small delay, then play next
        setTimeout(async () => {
          await playSpotifyTrack(nextSong.spotify_id, null, venueId);
        }, 500);
      } catch (error) {
        console.error('Error skipping on Spotify:', error);
      }
    }

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('playback:skipped', {
      next_song: nextSong,
    });

    res.json({
      success: true,
      next_song: nextSong,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error skipping song:', error);
    res.status(500).json({ error: 'Failed to skip song' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/queue/toggle
 * Enable/disable queue requests
 */
router.post('/queue/toggle', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { enabled } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    await client.query('BEGIN');

    await client.query(
      'UPDATE admin_settings SET is_queue_enabled = $1 WHERE venue_id = $2',
      [enabled, venueId]
    );

    // When re-enabling, clear admin_priority to restore vote-based ordering
    // This ensures the queue returns to natural vote order
    if (enabled) {
      await client.query(
        'UPDATE songs SET admin_priority = NULL WHERE venue_id = $1 AND status = $2',
        [venueId, 'queued']
      );
    }

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:toggled', { enabled });
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:updated'); // Refresh queue

    res.json({
      success: true,
      queue_enabled: enabled,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error toggling queue:', error);
    res.status(500).json({ error: 'Failed to toggle queue' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/queue/clear
 * Clear all queued songs
 */
router.post('/queue/clear', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    await client.query('BEGIN');

    // Delete all queued songs (not currently playing)
    await client.query(
      'DELETE FROM songs WHERE venue_id = $1 AND status = $2',
      [venueId, 'queued']
    );

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:cleared');

    res.json({
      success: true,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error clearing queue:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/playlist/set
 * Set default playlist
 */
router.post('/playlist/set', authenticateAdmin, async (req, res) => {
  try {
    const { playlist_id } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!playlist_id) {
      return res.status(400).json({ error: 'playlist_id is required' });
    }

    const pool = getPool();
    await pool.query(
      'UPDATE admin_settings SET default_playlist_id = $1 WHERE venue_id = $2',
      [playlist_id, venueId]
    );

    res.json({
      success: true,
      default_playlist_id: playlist_id,
    });
  } catch (error) {
    console.error('Error setting playlist:', error);
    res.status(500).json({ error: 'Failed to set playlist' });
  }
});

/**
 * DELETE /api/admin/songs/:id
 * Remove a song from queue
 */
router.delete('/songs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    const pool = getPool();
    
    // Verify song belongs to venue
    const songResult = await pool.query(
      'SELECT id FROM songs WHERE id = $1 AND venue_id = $2',
      [id, venueId]
    );

    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Delete song (cascades to votes and user_requests)
    await pool.query('DELETE FROM songs WHERE id = $1', [id]);

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('song:removed', { song_id: id });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Error removing song:', error);
    res.status(500).json({ error: 'Failed to remove song' });
  }
});

/**
 * POST /api/admin/songs/add
 * Admin add song to queue (bypasses daily limit)
 */
router.post('/songs/add', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { spotify_id } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!spotify_id) {
      return res.status(400).json({ error: 'spotify_id is required' });
    }

    await client.query('BEGIN');

    // Get song details from Spotify
    const { getSpotifyAccessToken, searchSpotify } = await import('../services/spotify.js');
    const accessToken = await getSpotifyAccessToken();
    
    // Get track details
    const axios = (await import('axios')).default;
    const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotify_id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const track = trackResponse.data;

    // Insert song as admin-requested (bypasses approval)
    const songResult = await client.query(
      `INSERT INTO songs (
        venue_id, spotify_id, title, artist, album, 
        album_art_url, duration_ms, is_explicit, requested_by, status, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', 'approved')
      RETURNING *`,
      [
        venueId,
        spotify_id,
        track.name,
        track.artists[0].name,
        track.album.name,
        track.album.images[0]?.url || null,
        track.duration_ms,
        track.explicit,
        'admin',
      ]
    );

    const song = songResult.rows[0];

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('song:added', {
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
        status: 'queued',
      },
    });

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
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding song:', error);
    res.status(500).json({ error: 'Failed to add song' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/queue/reorder
 * Reorder songs in queue by setting admin priority
 */
router.post('/queue/reorder', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_orders } = req.body; // Array of { song_id, priority }
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!Array.isArray(song_orders)) {
      return res.status(400).json({ error: 'song_orders must be an array' });
    }

    await client.query('BEGIN');

    // Update priorities for each song
    for (const { song_id, priority } of song_orders) {
      // Verify song belongs to venue
      const songResult = await client.query(
        'SELECT id FROM songs WHERE id = $1 AND venue_id = $2',
        [song_id, venueId]
      );

      if (songResult.rows.length > 0) {
        await client.query(
          'UPDATE songs SET admin_priority = $1 WHERE id = $2',
          [priority, song_id]
        );
      }
    }

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:updated');

    res.json({
      success: true,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reordering queue:', error);
    res.status(500).json({ error: 'Failed to reorder queue' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/pending-requests
 * Get all songs pending approval
 */
router.get('/pending-requests', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
        s.*,
        COUNT(v.id) as votes
      FROM songs s
      LEFT JOIN votes v ON s.id = v.song_id
      WHERE s.venue_id = $1 AND s.approval_status = 'pending'
      GROUP BY s.id
      ORDER BY s.requested_at ASC`,
      [venueId]
    );

    // Import generateTags dynamically
    const { generateTags } = await import('../utils/tags.js');

    const pendingSongs = result.rows.map(row => {
      const audioFeatures = row.audio_features 
        ? (typeof row.audio_features === 'string' 
            ? JSON.parse(row.audio_features) 
            : row.audio_features)
        : null;
      
      const tags = audioFeatures ? generateTags(audioFeatures) : [];

      return {
        id: row.id,
        spotify_id: row.spotify_id,
        title: row.title,
        artist: row.artist,
        album: row.album,
        album_art_url: row.album_art_url,
        duration_ms: row.duration_ms,
        is_explicit: row.is_explicit,
        requested_at: row.requested_at,
        requested_by: row.requested_by,
        votes: parseInt(row.votes) || 0,
        audio_features: audioFeatures,
        tags,
      };
    });

    res.json({ songs: pendingSongs });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
});

/**
 * POST /api/admin/songs/approve
 * Approve a song and add it to queue
 */
router.post('/songs/approve', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_id } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!song_id) {
      return res.status(400).json({ error: 'song_id is required' });
    }

    await client.query('BEGIN');

    // Verify song belongs to venue and is pending
    const songResult = await client.query(
      `SELECT id, spotify_id, title, artist, album, album_art_url, 
              duration_ms, requested_at, requested_by, approval_status
       FROM songs 
       WHERE id = $1 AND venue_id = $2 AND approval_status = 'pending'`,
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Song not found or already processed' });
    }

    const song = songResult.rows[0];

    // Update approval status and add to queue
    await client.query(
      `UPDATE songs 
       SET approval_status = 'approved', status = 'queued' 
       WHERE id = $1`,
      [song_id]
    );

    await client.query('COMMIT');

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`venue:${venueSlug}`).emit('song:approved', {
        song: {
          id: song.id,
          spotify_id: song.spotify_id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          album_art_url: song.album_art_url,
          duration_ms: song.duration_ms,
          requested_at: song.requested_at,
          requested_by: song.requested_by,
        },
      });
      io.to(`venue:${venueSlug}`).emit('queue:updated');
    }

    res.json({ success: true, message: 'Song approved and added to queue' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving song:', error);
    res.status(500).json({ error: 'Failed to approve song' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/songs/deny
 * Deny a song request
 */
router.post('/songs/deny', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_id, reason } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!song_id) {
      return res.status(400).json({ error: 'song_id is required' });
    }

    await client.query('BEGIN');

    // Verify song belongs to venue and is pending
    const songResult = await client.query(
      `SELECT id FROM songs 
       WHERE id = $1 AND venue_id = $2 AND approval_status = 'pending'`,
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Song not found or already processed' });
    }

    // Update approval status to denied
    await client.query(
      `UPDATE songs 
       SET approval_status = 'denied', denied_at = NOW(), denied_reason = $1 
       WHERE id = $2`,
      [reason || null, song_id]
    );

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`venue:${venueSlug}`).emit('song:denied', { song_id });
    }

    res.json({ success: true, message: 'Song request denied' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error denying song:', error);
    res.status(500).json({ error: 'Failed to deny song' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/songs/bulk-approve
 * Approve multiple songs at once
 */
router.post('/songs/bulk-approve', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_ids } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!Array.isArray(song_ids) || song_ids.length === 0) {
      return res.status(400).json({ error: 'song_ids must be a non-empty array' });
    }

    await client.query('BEGIN');

    // Verify all songs belong to venue and are pending
    const placeholders = song_ids.map((_, i) => `$${i + 2}`).join(',');
    const songResult = await client.query(
      `SELECT id FROM songs 
       WHERE id IN (${placeholders}) 
       AND venue_id = $1 
       AND approval_status = 'pending'`,
      [venueId, ...song_ids]
    );

    const validSongIds = songResult.rows.map(row => row.id);

    if (validSongIds.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No valid pending songs found' });
    }

    // Update approval status for all valid songs
    const updatePlaceholders = validSongIds.map((_, i) => `$${i + 2}`).join(',');
    await client.query(
      `UPDATE songs 
       SET approval_status = 'approved', status = 'queued' 
       WHERE id IN (${updatePlaceholders}) AND venue_id = $1`,
      [venueId, ...validSongIds]
    );

    await client.query('COMMIT');

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`venue:${venueSlug}`).emit('songs:bulk-approved', { 
        song_ids: validSongIds,
        count: validSongIds.length,
      });
      io.to(`venue:${venueSlug}`).emit('queue:updated');
    }

    res.json({ 
      success: true, 
      message: `Approved ${validSongIds.length} song(s)`,
      approved_count: validSongIds.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk approving songs:', error);
    res.status(500).json({ error: 'Failed to bulk approve songs' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/filters
 * Get current filter settings
 */
router.get('/filters', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    const pool = getPool();

    const result = await pool.query(
      `SELECT filter_mode, ban_explicit, genre_filter, playlist_id, playlist_name
       FROM admin_settings 
       WHERE venue_id = $1`,
      [venueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin settings not found' });
    }

    const settings = result.rows[0];

    // Get count of allowed tracks if in playlist mode
    let allowedTracksCount = 0;
    if (settings.filter_mode === 'tailored' && settings.playlist_id) {
      const countResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM allowed_playlist_tracks 
         WHERE venue_id = $1 AND playlist_id = $2`,
        [venueId, settings.playlist_id]
      );
      allowedTracksCount = parseInt(countResult.rows[0].count) || 0;
    }

    res.json({
      filter_mode: settings.filter_mode || 'free',
      ban_explicit: settings.ban_explicit || false,
      genre_filter: settings.genre_filter || [],
      playlist_id: settings.playlist_id || null,
      playlist_name: settings.playlist_name || null,
      allowed_tracks_count: allowedTracksCount,
    });
  } catch (error) {
    console.error('Error getting filters:', error);
    res.status(500).json({ error: 'Failed to get filter settings' });
  }
});

/**
 * POST /api/admin/filters
 * Update filter settings
 */
router.post('/filters', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { filter_mode, ban_explicit, genre_filter, playlist_url } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    await client.query('BEGIN');

    // Validate filter_mode
    if (filter_mode && !['free', 'tailored'].includes(filter_mode)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'filter_mode must be "free" or "tailored"' });
    }

    // If switching to tailored mode and playlist_url is provided, import playlist
    let playlistId = null;
    let playlistName = null;
    
    if (filter_mode === 'tailored' && playlist_url) {
      try {
        const accessToken = await getSpotifyPremiumAccessToken(venueId);
        const playlistInfo = await getPlaylistInfo(playlist_url, accessToken);
        
        playlistId = playlistInfo.playlist_id;
        playlistName = playlistInfo.playlist_name;

        // Clear old allowed tracks for this venue and playlist
        await client.query(
          `DELETE FROM allowed_playlist_tracks 
           WHERE venue_id = $1 AND playlist_id = $2`,
          [venueId, playlistId]
        );

        // Insert new allowed tracks (ignore duplicates)
        if (playlistInfo.tracks.length > 0) {
          const values = playlistInfo.tracks.map((track, index) => {
            const baseIndex = index * 3;
            return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
          }).join(', ');

          const insertValues = playlistInfo.tracks.flatMap(track => [
            venueId,
            track.spotify_id,
            playlistId,
          ]);

          await client.query(
            `INSERT INTO allowed_playlist_tracks (venue_id, spotify_id, playlist_id)
             VALUES ${values}
             ON CONFLICT (venue_id, spotify_id, playlist_id) DO NOTHING`,
            insertValues
          );
        }
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error importing playlist:', error);
        return res.status(400).json({ 
          error: 'Failed to import playlist. Please check the playlist URL and ensure your Spotify account is connected.',
        });
      }
    } else if (filter_mode === 'free') {
      // Clear playlist when switching to free mode
      playlistId = null;
      playlistName = null;
    } else {
      // Keep existing playlist if not changing mode or not providing new playlist
      const existingResult = await client.query(
        `SELECT playlist_id, playlist_name 
         FROM admin_settings 
         WHERE venue_id = $1`,
        [venueId]
      );
      if (existingResult.rows.length > 0) {
        playlistId = existingResult.rows[0].playlist_id;
        playlistName = existingResult.rows[0].playlist_name;
      }
    }

    // Update admin_settings
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (filter_mode !== undefined) {
      updateFields.push(`filter_mode = $${paramIndex++}`);
      updateValues.push(filter_mode);
    }
    if (ban_explicit !== undefined) {
      updateFields.push(`ban_explicit = $${paramIndex++}`);
      updateValues.push(ban_explicit);
    }
    if (genre_filter !== undefined) {
      updateFields.push(`genre_filter = $${paramIndex++}`);
      updateValues.push(Array.isArray(genre_filter) ? genre_filter : []);
    }
    if (playlistId !== undefined) {
      updateFields.push(`playlist_id = $${paramIndex++}`);
      updateValues.push(playlistId);
    }
    if (playlistName !== undefined) {
      updateFields.push(`playlist_name = $${paramIndex++}`);
      updateValues.push(playlistName);
    }

    if (updateFields.length > 0) {
      updateValues.push(venueId);
      await client.query(
        `UPDATE admin_settings 
         SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE venue_id = $${paramIndex}`,
        updateValues
      );
    }

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`venue:${venueSlug}`).emit('filters:updated');
    }

    res.json({
      success: true,
      message: 'Filter settings updated',
      filter_mode: filter_mode || 'free',
      ban_explicit: ban_explicit !== undefined ? ban_explicit : false,
      genre_filter: genre_filter || [],
      playlist_id: playlistId,
      playlist_name: playlistName,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating filters:', error);
    res.status(500).json({ error: 'Failed to update filter settings' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/filters/playlist/import
 * Import a playlist for tailored mode
 */
router.post('/filters/playlist/import', authenticateAdmin, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { playlist_url } = req.body;
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!playlist_url) {
      return res.status(400).json({ error: 'playlist_url is required' });
    }

    await client.query('BEGIN');

    // Get playlist info and tracks
    const accessToken = await getSpotifyPremiumAccessToken(venueId);
    const playlistInfo = await getPlaylistInfo(playlist_url, accessToken);

    // Clear old allowed tracks for this venue and playlist
    await client.query(
      `DELETE FROM allowed_playlist_tracks 
       WHERE venue_id = $1 AND playlist_id = $2`,
      [venueId, playlistInfo.playlist_id]
    );

    // Insert new allowed tracks (ignore duplicates)
    if (playlistInfo.tracks.length > 0) {
      const values = playlistInfo.tracks.map((track, index) => {
        const baseIndex = index * 3;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
      }).join(', ');

      const insertValues = playlistInfo.tracks.flatMap(track => [
        venueId,
        track.spotify_id,
        playlistInfo.playlist_id,
      ]);

      await client.query(
        `INSERT INTO allowed_playlist_tracks (venue_id, spotify_id, playlist_id)
         VALUES ${values}
         ON CONFLICT (venue_id, spotify_id, playlist_id) DO NOTHING`,
        insertValues
      );
    }

    // Update admin_settings
    await client.query(
      `UPDATE admin_settings 
       SET playlist_id = $1, playlist_name = $2, filter_mode = 'tailored', updated_at = NOW()
       WHERE venue_id = $3`,
      [playlistInfo.playlist_id, playlistInfo.playlist_name, venueId]
    );

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`venue:${venueSlug}`).emit('filters:updated');
    }

    res.json({
      success: true,
      message: `Playlist imported successfully. ${playlistInfo.tracks.length} tracks added.`,
      playlist_id: playlistInfo.playlist_id,
      playlist_name: playlistInfo.playlist_name,
      tracks_count: playlistInfo.tracks.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing playlist:', error);
    res.status(500).json({ 
      error: 'Failed to import playlist. Please check the playlist URL and ensure your Spotify account is connected.',
    });
  } finally {
    client.release();
  }
});

export default router;

