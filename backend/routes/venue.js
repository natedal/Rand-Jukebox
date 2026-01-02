import express from 'express';
import { getPool } from '../db/index.js';

const router = express.Router();

/**
 * GET /api/venue/:slug
 * Get venue information by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const pool = getPool();
    
    const result = await pool.query(
      'SELECT id, slug, name, created_at FROM venues WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({
      success: true,
      venue: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

export default router;

