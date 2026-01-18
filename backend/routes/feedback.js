import express from 'express';
import { getPool } from '../db/index.js';
import { getUserIdentifier } from '../utils/userIdentifier.js';

const router = express.Router();

/**
 * POST /api/feedback
 * Add comment to currently playing song
 */
router.post('/', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_id, comment } = req.body;
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;

    if (!song_id) {
      return res.status(400).json({ error: 'song_id is required' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'comment is required' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'comment must be 1000 characters or less' });
    }

    await client.query('BEGIN');

    // Verify song exists, belongs to venue, and is currently playing
    const songResult = await client.query(
      'SELECT id, status FROM songs WHERE id = $1 AND venue_id = $2',
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Song not found' });
    }

    if (songResult.rows[0].status !== 'playing') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Feedback can only be added to currently playing songs' });
    }

    // Insert feedback
    const result = await client.query(
      `INSERT INTO song_feedback (song_id, venue_id, user_identifier, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, comment, created_at`,
      [song_id, venueId, userIdentifier, comment.trim()]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      feedback: {
        id: result.rows[0].id,
        comment: result.rows[0].comment,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/feedback/:song_id
 * Get feedback for a song
 */
router.get('/:song_id', async (req, res) => {
  try {
    const { song_id } = req.params;
    const venueId = req.venue.id;
    const userIdentifier = getUserIdentifier(req);

    const pool = getPool();
    
    // Verify song exists and belongs to venue
    const songResult = await pool.query(
      'SELECT id FROM songs WHERE id = $1 AND venue_id = $2',
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Get feedback (without user_identifier visible to admins, but include it for users to identify their own)
    const feedbackResult = await pool.query(
      `SELECT id, comment, created_at, updated_at,
              CASE WHEN user_identifier = $3 THEN user_identifier ELSE NULL END as user_identifier
       FROM song_feedback
       WHERE song_id = $1 AND venue_id = $2
       ORDER BY created_at DESC`,
      [song_id, venueId, userIdentifier]
    );

    res.json({
      success: true,
      feedback: feedbackResult.rows.map(row => ({
        id: row.id,
        comment: row.comment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_own: row.user_identifier !== null,
      })),
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/**
 * PUT /api/feedback/:id
 * Update own comment
 */
router.put('/:id', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'comment is required' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'comment must be 1000 characters or less' });
    }

    await client.query('BEGIN');

    // Verify feedback exists, belongs to venue, and user owns it
    const feedbackResult = await client.query(
      `SELECT id FROM song_feedback 
       WHERE id = $1 AND venue_id = $2 AND user_identifier = $3`,
      [id, venueId, userIdentifier]
    );

    if (feedbackResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Feedback not found or you do not have permission to edit it' });
    }

    // Update feedback
    const result = await client.query(
      `UPDATE song_feedback 
       SET comment = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, comment, created_at, updated_at`,
      [comment.trim(), id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      feedback: {
        id: result.rows[0].id,
        comment: result.rows[0].comment,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete own comment
 */
router.delete('/:id', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;

    await client.query('BEGIN');

    // Verify feedback exists, belongs to venue, and user owns it
    const feedbackResult = await client.query(
      `SELECT id FROM song_feedback 
       WHERE id = $1 AND venue_id = $2 AND user_identifier = $3`,
      [id, venueId, userIdentifier]
    );

    if (feedbackResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Feedback not found or you do not have permission to delete it' });
    }

    // Delete feedback
    await client.query('DELETE FROM song_feedback WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  } finally {
    client.release();
  }
});

export default router;



