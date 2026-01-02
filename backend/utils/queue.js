import { getPool } from '../db/index.js';

/**
 * Sort queue by votes DESC, then requested_at DESC (newest first)
 */
export function sortQueue(songs) {
  return songs
    .filter(song => song.status === 'queued')
    .sort((a, b) => {
      // PRIMARY: Vote count DESC
      if (b.votes !== a.votes) {
        return b.votes - a.votes;
      }
      // SECONDARY: Newest first (tie-breaker)
      return new Date(b.requested_at) - new Date(a.requested_at);
    });
}

/**
 * Get current queue for venue
 */
export async function getQueue(venueId) {
  const pool = getPool();
  
  const result = await pool.query(`
    SELECT 
      s.*,
      COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) as upvotes,
      COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END) as downvotes,
      COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END) as net_score
    FROM songs s
    LEFT JOIN votes v ON s.id = v.song_id
    WHERE s.venue_id = $1 
      AND s.status = 'queued' 
      AND (s.approval_status = 'approved' OR s.approval_status IS NULL)
    GROUP BY s.id
    ORDER BY 
      net_score DESC,
      CASE WHEN s.admin_priority IS NOT NULL THEN 0 ELSE 1 END,
      COALESCE(s.admin_priority, 0) DESC,
      s.requested_at DESC
  `, [venueId]);

  return result.rows.map(row => ({
    ...row,
    upvotes: parseInt(row.upvotes) || 0,
    downvotes: parseInt(row.downvotes) || 0,
    votes: parseInt(row.net_score) || 0, // Keep 'votes' for backward compatibility (net score)
    net_score: parseInt(row.net_score) || 0,
  }));
}

/**
 * Get current playing song
 */
export async function getCurrentSong(venueId) {
  const pool = getPool();
  
  const result = await pool.query(`
    SELECT 
      s.*,
      COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) as upvotes,
      COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END) as downvotes,
      COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END) as net_score
    FROM songs s
    LEFT JOIN votes v ON s.id = v.song_id
    WHERE s.venue_id = $1 AND s.status = 'playing'
    GROUP BY s.id
    LIMIT 1
  `, [venueId]);

  if (result.rows.length === 0) {
    return null;
  }

  const song = result.rows[0];
  return {
    ...song,
    upvotes: parseInt(song.upvotes) || 0,
    downvotes: parseInt(song.downvotes) || 0,
    votes: parseInt(song.net_score) || 0, // Keep 'votes' for backward compatibility (net score)
    net_score: parseInt(song.net_score) || 0,
  };
}

/**
 * Get venue ID from slug
 */
export async function getVenueId(slug) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id FROM venues WHERE slug = $1',
    [slug]
  );
  
  if (result.rows.length === 0) {
    throw new Error(`Venue not found: ${slug}`);
  }
  
  return result.rows[0].id;
}

