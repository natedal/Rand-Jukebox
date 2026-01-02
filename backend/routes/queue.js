import express from 'express';
import { getQueue, getCurrentSong, getVenueId } from '../utils/queue.js';
import { getPool } from '../db/index.js';

const router = express.Router();

/**
 * GET /api/queue
 * Get current queue and now playing
 */
router.get('/', async (req, res) => {
  try {
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;
    
    const [queue, currentSong] = await Promise.all([
      getQueue(venueId),
      getCurrentSong(venueId),
    ]);

    // Get admin settings
    const pool = getPool();
    const settingsResult = await pool.query(
      'SELECT is_playing, is_queue_enabled FROM admin_settings WHERE venue_id = $1',
      [venueId]
    );
    
    const settings = settingsResult.rows[0] || {
      is_playing: false,
      is_queue_enabled: true,
    };

    // Get stats
    const today = new Date().toISOString().split('T')[0];
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM playback_history WHERE venue_id = $1 AND DATE(played_at) = $2) as songs_played_today,
        (SELECT COUNT(DISTINCT user_identifier) FROM user_requests WHERE venue_id = $1 AND date = $2) as active_users
    `, [venueId, today]);

    const stats = statsResult.rows[0];

    res.json({
      queue: queue.map(song => ({
        id: song.id,
        spotify_id: song.spotify_id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        album_art_url: song.album_art_url,
        duration_ms: song.duration_ms,
        votes: song.votes, // net_score for backward compatibility
        upvotes: song.upvotes,
        downvotes: song.downvotes,
        net_score: song.net_score,
        requested_at: song.requested_at,
        requested_by: song.requested_by,
        status: song.status,
      })),
      current_song: currentSong ? {
        id: currentSong.id,
        spotify_id: currentSong.spotify_id,
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        album_art_url: currentSong.album_art_url,
        duration_ms: currentSong.duration_ms,
        votes: currentSong.votes, // net_score for backward compatibility
        upvotes: currentSong.upvotes,
        downvotes: currentSong.downvotes,
        net_score: currentSong.net_score,
        requested_at: currentSong.requested_at,
        requested_by: currentSong.requested_by,
      } : null,
      is_playing: settings.is_playing,
      queue_enabled: settings.is_queue_enabled,
      stats: {
        songs_played_today: parseInt(stats.songs_played_today) || 0,
        active_users: parseInt(stats.active_users) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

export default router;

