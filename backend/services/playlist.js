import { getPool } from '../db/index.js';
import { getSpotifyAccessToken, getPlaylistTracks } from './spotify.js';

/**
 * Add 5 random songs from default playlist to queue
 */
export async function addDefaultPlaylistSongs(venueId, dbClient = null) {
  const pool = dbClient || getPool();
  
  // Get default playlist ID
  const settingsResult = await pool.query(
    'SELECT default_playlist_id FROM admin_settings WHERE venue_id = $1',
    [venueId]
  );

  if (settingsResult.rows.length === 0 || !settingsResult.rows[0].default_playlist_id) {
    return []; // No default playlist set
  }

  const playlistId = settingsResult.rows[0].default_playlist_id;

  // Get access token
  const accessToken = await getSpotifyAccessToken();

  // Get all tracks from playlist
  const tracks = await getPlaylistTracks(playlistId, accessToken);

  if (tracks.length === 0) {
    return [];
  }

  // Select 5 random tracks
  const shuffled = tracks.sort(() => 0.5 - Math.random());
  const selectedTracks = shuffled.slice(0, 5);

  // Add to queue
  const insertedSongs = [];
  for (const track of selectedTracks) {
    // Check if song already exists in queue
    const existingResult = await pool.query(
      'SELECT id FROM songs WHERE venue_id = $1 AND spotify_id = $2 AND status = $3',
      [venueId, track.spotify_id, 'queued']
    );

    if (existingResult.rows.length > 0) {
      continue; // Skip duplicates
    }

    const songResult = await pool.query(
      `INSERT INTO songs (
        venue_id, spotify_id, title, artist, album, 
        album_art_url, duration_ms, is_explicit, requested_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued')
      RETURNING *`,
      [
        venueId,
        track.spotify_id,
        track.title,
        track.artist,
        track.album,
        track.album_art_url,
        track.duration_ms,
        track.is_explicit,
        'system', // System-requested songs
      ]
    );

    insertedSongs.push(songResult.rows[0]);
  }

  return insertedSongs;
}

