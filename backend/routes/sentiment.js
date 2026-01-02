import express from 'express';
import { getPool } from '../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { getQueue } from '../utils/queue.js';

const router = express.Router();

/**
 * GET /api/admin/sentiment/queue
 * Get ratings for songs in queue with historical approval ratings
 */
router.get('/queue', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const pool = getPool();

    // Get current queue
    const queue = await getQueue(venueId);

    // For each song in queue, calculate historical approval rating
    const queueWithRatings = await Promise.all(
      queue.map(async (song) => {
        // Aggregate votes across all instances of this spotify_id at this venue
        const historicalResult = await pool.query(`
          SELECT 
            COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) as total_upvotes,
            COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END) as total_downvotes,
            COUNT(v.id) as total_votes,
            COUNT(DISTINCT s.id) as total_plays
          FROM songs s
          LEFT JOIN votes v ON s.id = v.song_id
          WHERE s.venue_id = $1 AND s.spotify_id = $2
        `, [venueId, song.spotify_id]);

        const historical = historicalResult.rows[0];
        const totalUpvotes = parseInt(historical.total_upvotes) || 0;
        const totalDownvotes = parseInt(historical.total_downvotes) || 0;
        const totalVotes = parseInt(historical.total_votes) || 0;
        const totalPlays = parseInt(historical.total_plays) || 0;

        // Calculate approval rating: (upvotes - downvotes) / total_votes * 100
        let approvalRating = null;
        if (totalVotes > 0) {
          approvalRating = ((totalUpvotes - totalDownvotes) / totalVotes) * 100;
        }

        return {
          song_id: song.id,
          spotify_id: song.spotify_id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          album_art_url: song.album_art_url,
          current_upvotes: song.upvotes,
          current_downvotes: song.downvotes,
          current_net_score: song.net_score,
          approval_rating: approvalRating !== null ? Math.round(approvalRating * 100) / 100 : null,
          total_plays: totalPlays,
          total_votes: totalVotes,
        };
      })
    );

    res.json({
      success: true,
      queue: queueWithRatings,
    });
  } catch (error) {
    console.error('Error fetching queue ratings:', error);
    res.status(500).json({ error: 'Failed to fetch queue ratings' });
  }
});

/**
 * GET /api/admin/sentiment/top-songs
 * Get most loved songs ranked by approval rating
 */
router.get('/top-songs', authenticateAdmin, async (req, res) => {
  try {
    const venueId = req.venue.id;
    const pool = getPool();
    const limit = parseInt(req.query.limit) || 50;

    // Aggregate by spotify_id across all time at venue
    const result = await pool.query(`
      SELECT 
        s.spotify_id,
        MAX(s.title) as title,
        MAX(s.artist) as artist,
        MAX(s.album) as album,
        MAX(s.album_art_url) as album_art_url,
        COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) as total_upvotes,
        COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END) as total_downvotes,
        COUNT(v.id) as total_votes,
        COUNT(DISTINCT s.id) as total_plays
      FROM songs s
      LEFT JOIN votes v ON s.id = v.song_id
      WHERE s.venue_id = $1
      GROUP BY s.spotify_id
      HAVING COUNT(v.id) > 0
      ORDER BY 
        (COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END))::FLOAT / 
        NULLIF(COUNT(v.id), 0) DESC,
        COUNT(v.id) DESC
      LIMIT $2
    `, [venueId, limit]);

    const topSongs = result.rows.map((row) => {
      const totalUpvotes = parseInt(row.total_upvotes) || 0;
      const totalDownvotes = parseInt(row.total_downvotes) || 0;
      const totalVotes = parseInt(row.total_votes) || 0;
      const totalPlays = parseInt(row.total_plays) || 0;

      // Calculate approval rating: (upvotes - downvotes) / total_votes * 100
      const approvalRating = totalVotes > 0 
        ? ((totalUpvotes - totalDownvotes) / totalVotes) * 100 
        : null;

      return {
        spotify_id: row.spotify_id,
        title: row.title,
        artist: row.artist,
        album: row.album,
        album_art_url: row.album_art_url,
        approval_rating: approvalRating !== null ? Math.round(approvalRating * 100) / 100 : null,
        total_plays: totalPlays,
        total_votes: totalVotes,
        total_upvotes: totalUpvotes,
        total_downvotes: totalDownvotes,
      };
    });

    res.json({
      success: true,
      top_songs: topSongs,
    });
  } catch (error) {
    console.error('Error fetching top songs:', error);
    res.status(500).json({ error: 'Failed to fetch top songs' });
  }
});

/**
 * GET /api/admin/sentiment/song/:song_id/feedback
 * Get feedback comments for a specific song
 */
router.get('/song/:song_id/feedback', authenticateAdmin, async (req, res) => {
  try {
    const { song_id } = req.params;
    const venueId = req.venue.id;
    const pool = getPool();

    // Validate song_id format (should be UUID or spotify_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const spotifyIdRegex = /^[a-zA-Z0-9]{22}$/;
    
    if (!uuidRegex.test(song_id) && !spotifyIdRegex.test(song_id)) {
      return res.status(400).json({ error: 'Invalid song ID format. Please use a valid song ID from the queue.' });
    }

    // Try to find song by UUID first, then by spotify_id
    let songResult;
    if (uuidRegex.test(song_id)) {
      songResult = await pool.query(
        'SELECT id, spotify_id, title, artist FROM songs WHERE id = $1 AND venue_id = $2',
        [song_id, venueId]
      );
    } else {
      // Try spotify_id lookup - get the most recent song with this spotify_id
      songResult = await pool.query(
        'SELECT id, spotify_id, title, artist FROM songs WHERE spotify_id = $1 AND venue_id = $2 ORDER BY created_at DESC LIMIT 1',
        [song_id, venueId]
      );
    }

    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = songResult.rows[0];

    // Get all feedback for this song (without user_identifier for privacy)
    const feedbackResult = await pool.query(
      `SELECT id, comment, created_at, updated_at
       FROM song_feedback
       WHERE song_id = $1 AND venue_id = $2
       ORDER BY created_at DESC`,
      [song_id, venueId]
    );

    res.json({
      success: true,
      song: {
        id: song.id,
        spotify_id: song.spotify_id,
        title: song.title,
        artist: song.artist,
      },
      feedback: feedbackResult.rows.map(row => ({
        id: row.id,
        comment: row.comment,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching song feedback:', error);
    res.status(500).json({ error: 'Failed to fetch song feedback' });
  }
});

export default router;

