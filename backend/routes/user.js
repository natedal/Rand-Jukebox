import express from 'express';
import { getPool } from '../db/index.js';
import { getUserIdentifier } from '../utils/userIdentifier.js';
import { getVenueId } from '../utils/queue.js';

const router = express.Router();

/**
 * GET /api/user/status
 * Get user's current status (requests remaining, votes cast)
 */
router.get('/status', async (req, res) => {
  try {
    const userIdentifier = getUserIdentifier(req);
    const venueId = req.venue.id;
    const venueSlug = req.venue.slug;

    const today = new Date().toISOString().split('T')[0];
    const pool = getPool();

    // Get requests today
    const requestsResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM user_requests 
       WHERE venue_id = $1 AND user_identifier = $2 AND date = $3`,
      [venueId, userIdentifier, today]
    );

    const requestsToday = parseInt(requestsResult.rows[0].count);
    const maxRequestsPerDay = parseInt(process.env.MAX_REQUESTS_PER_DAY || '3');
    const requestsRemaining = Math.max(0, maxRequestsPerDay - requestsToday);

    // Get votes cast today
    const votesResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM votes v
       JOIN songs s ON v.song_id = s.id
       WHERE s.venue_id = $1 AND v.user_identifier = $2 
       AND DATE(v.created_at) = $3`,
      [venueId, userIdentifier, today]
    );

    const votesCast = parseInt(votesResult.rows[0].count);

    res.json({
      requests_remaining: requestsRemaining,
      requests_today: requestsToday,
      max_requests_per_day: maxRequestsPerDay,
      votes_cast: votesCast,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    res.status(500).json({ error: 'Failed to fetch user status' });
  }
});

export default router;

