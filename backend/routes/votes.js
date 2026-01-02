import express from 'express';
import { getPool } from '../db/index.js';
import { getUserIdentifier } from '../utils/userIdentifier.js';
import { atomicVote, atomicUnvote } from '../db/redis.js';
import { getVenueId } from '../utils/queue.js';

const router = express.Router();

/**
 * POST /api/votes/upvote
 * Upvote a song
 */
router.post('/upvote', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_id } = req.body;
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!song_id) {
      return res.status(400).json({ error: 'song_id is required' });
    }

    await client.query('BEGIN');

    // Verify song exists and belongs to venue
    const songResult = await client.query(
      'SELECT id, status FROM songs WHERE id = $1 AND venue_id = $2',
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if already voted
    const existingVote = await client.query(
      'SELECT id, vote_type FROM votes WHERE song_id = $1 AND user_identifier = $2',
      [song_id, userIdentifier]
    );

    // Atomic vote operation (Redis + Database)
    try {
      await atomicVote(song_id, userIdentifier, venueId, 'upvote');
    } catch (error) {
      if (error.message === 'Already voted on this song') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Already voted on this song' });
      }
      throw error;
    }

    // Insert or update vote in database
    if (existingVote.rows.length > 0) {
      // Update existing vote
      await client.query(
        'UPDATE votes SET vote_type = $1 WHERE song_id = $2 AND user_identifier = $3',
        ['upvote', song_id, userIdentifier]
      );
    } else {
      // Insert new vote
      await client.query(
        'INSERT INTO votes (song_id, user_identifier, vote_type) VALUES ($1, $2, $3)',
        [song_id, userIdentifier, 'upvote']
      );
    }

    // Get updated vote counts
    const voteCountResult = await client.query(`
      SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as net_score
      FROM votes WHERE song_id = $1
    `, [song_id]);
    
    const counts = voteCountResult.rows[0];

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:updated');

    res.json({
      success: true,
      upvotes: parseInt(counts.upvotes) || 0,
      downvotes: parseInt(counts.downvotes) || 0,
      net_score: parseInt(counts.net_score) || 0,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error upvoting:', error);
    res.status(500).json({ error: 'Failed to upvote' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/votes/downvote
 * Downvote a song (true downvote, not removal)
 */
router.post('/downvote', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_id } = req.body;
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!song_id) {
      return res.status(400).json({ error: 'song_id is required' });
    }

    await client.query('BEGIN');

    // Verify song exists and belongs to venue
    const songResult = await client.query(
      'SELECT id, status FROM songs WHERE id = $1 AND venue_id = $2',
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if already voted
    const existingVote = await client.query(
      'SELECT id, vote_type FROM votes WHERE song_id = $1 AND user_identifier = $2',
      [song_id, userIdentifier]
    );

    // Atomic vote operation (Redis + Database)
    try {
      await atomicVote(song_id, userIdentifier, venueId, 'downvote');
    } catch (error) {
      if (error.message === 'Already voted on this song') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Already voted on this song' });
      }
      throw error;
    }

    // Insert or update vote in database
    if (existingVote.rows.length > 0) {
      // Update existing vote
      await client.query(
        'UPDATE votes SET vote_type = $1 WHERE song_id = $2 AND user_identifier = $3',
        ['downvote', song_id, userIdentifier]
      );
    } else {
      // Insert new vote
      await client.query(
        'INSERT INTO votes (song_id, user_identifier, vote_type) VALUES ($1, $2, $3)',
        [song_id, userIdentifier, 'downvote']
      );
    }

    // Get updated vote counts
    const voteCountResult = await client.query(`
      SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as net_score
      FROM votes WHERE song_id = $1
    `, [song_id]);
    
    const counts = voteCountResult.rows[0];

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:updated');

    res.json({
      success: true,
      upvotes: parseInt(counts.upvotes) || 0,
      downvotes: parseInt(counts.downvotes) || 0,
      net_score: parseInt(counts.net_score) || 0,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error downvoting:', error);
    res.status(500).json({ error: 'Failed to downvote' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/votes/remove
 * Remove vote entirely (undo vote)
 */
router.post('/remove', async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { song_id } = req.body;
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    if (!song_id) {
      return res.status(400).json({ error: 'song_id is required' });
    }

    await client.query('BEGIN');

    // Verify song exists
    const songResult = await client.query(
      'SELECT id FROM songs WHERE id = $1 AND venue_id = $2',
      [song_id, venueId]
    );

    if (songResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Song not found' });
    }

    // Remove vote atomically
    try {
      await atomicUnvote(song_id, userIdentifier, venueId);
    } catch (error) {
      if (error.message === 'No vote to remove') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No vote to remove' });
      }
      throw error;
    }

    // Delete vote from database
    const deleteResult = await client.query(
      'DELETE FROM votes WHERE song_id = $1 AND user_identifier = $2 RETURNING id',
      [song_id, userIdentifier]
    );

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No vote to remove' });
    }

    // Get updated vote counts
    const voteCountResult = await client.query(`
      SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as net_score
      FROM votes WHERE song_id = $1
    `, [song_id]);
    
    const counts = voteCountResult.rows[0];

    await client.query('COMMIT');

    // Emit socket event
    req.app.get('io').to(`venue:${venueSlug}`).emit('queue:updated');

    res.json({
      success: true,
      upvotes: parseInt(counts.upvotes) || 0,
      downvotes: parseInt(counts.downvotes) || 0,
      net_score: parseInt(counts.net_score) || 0,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  } finally {
    client.release();
  }
});

export default router;

