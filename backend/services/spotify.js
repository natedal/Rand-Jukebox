import axios from 'axios';
import { getPool } from '../db/index.js';
import { getVenueId } from '../utils/queue.js';

let accessTokenCache = null;
let accessTokenExpiry = null;

/**
 * Get Spotify access token (client credentials flow for search)
 */
export async function getSpotifyAccessToken() {
  // Return cached token if still valid
  if (accessTokenCache && accessTokenExpiry && Date.now() < accessTokenExpiry) {
    return accessTokenCache;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessTokenCache = response.data.access_token;
    accessTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

    return accessTokenCache;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.response?.data || error.message);
    throw new Error('Failed to get Spotify access token');
  }
}

/**
 * Get Spotify access token for Premium account (refresh token flow)
 * @param {string|null} venueId - Optional venue ID. If provided, uses venue-specific refresh token
 */
export async function getSpotifyPremiumAccessToken(venueId = null) {
  let refreshToken;
  
  // Try to get venue-specific refresh token from database
  if (venueId) {
    try {
      const pool = getPool();
      const result = await pool.query(
        'SELECT spotify_refresh_token FROM admin_settings WHERE venue_id = $1',
        [venueId]
      );
      
      if (result.rows.length > 0 && result.rows[0].spotify_refresh_token) {
        refreshToken = result.rows[0].spotify_refresh_token;
      }
    } catch (error) {
      console.warn('Could not get venue-specific Spotify token:', error.message);
    }
  }
  
  // Fallback to environment variable (backward compatibility)
  if (!refreshToken) {
    refreshToken = process.env.SPOTIFY_PREMIUM_REFRESH_TOKEN;
  }
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Spotify Premium credentials not configured. Please connect your Spotify account in the admin panel.');
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      `grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing Spotify Premium token:', error.response?.data || error.message);
    throw new Error('Failed to refresh Spotify Premium token');
  }
}

/**
 * Search for tracks on Spotify
 */
export async function searchSpotify(query, accessToken) {
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit: 20,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data.tracks.items.map(track => ({
      spotify_id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      album_art_url: track.album.images[0]?.url || null,
      duration_ms: track.duration_ms,
      is_explicit: track.explicit,
    }));
  } catch (error) {
    console.error('Error searching Spotify:', error.response?.data || error.message);
    throw new Error('Failed to search Spotify');
  }
}

/**
 * Get available Spotify devices
 * @param {string|null} venueId - Optional venue ID for venue-specific token
 */
export async function getSpotifyDevices(venueId = null) {
  const accessToken = await getSpotifyPremiumAccessToken(venueId);

  try {
    const response = await axios.get(
      'https://api.spotify.com/v1/me/player/devices',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data.devices || [];
  } catch (error) {
    console.error('Error getting devices:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Play a track on Spotify (Premium account)
 * @param {string} trackId - Spotify track ID
 * @param {string|null} deviceId - Optional device ID
 * @param {string|null} venueId - Optional venue ID for venue-specific token
 */
export async function playSpotifyTrack(trackId, deviceId = null, venueId = null) {
  const accessToken = await getSpotifyPremiumAccessToken(venueId);

  try {
    // If no device specified, check for stored device preference
    if (!deviceId && venueId) {
      try {
        const pool = getPool();
        const result = await pool.query(
          'SELECT selected_device_id FROM admin_settings WHERE venue_id = $1',
          [venueId]
        );
        if (result.rows[0]?.selected_device_id) {
          deviceId = result.rows[0].selected_device_id;
          console.log(`✅ Using stored device preference: ${deviceId}`);
        }
      } catch (error) {
        console.warn('Could not get stored device preference:', error.message);
      }
    }

    // If still no device, try to get active device or first available device
    if (!deviceId) {
      const devices = await getSpotifyDevices(venueId);
      const activeDevice = devices.find(d => d.is_active) || devices.find(d => d.type === 'Computer');
      
      if (activeDevice) {
        deviceId = activeDevice.id;
      } else if (devices.length > 0) {
        // Use first available device
        deviceId = devices[0].id;
        console.log(`⚠️  No active device found. Using device: ${devices[0].name}`);
      } else {
        throw new Error('No Spotify devices found. Please open Spotify on a device (desktop app, web player, or phone) and make sure it\'s active.');
      }
    }

    await axios.put(
      `https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`,
      {
        uris: [`spotify:track:${trackId}`],
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`✅ Playing track ${trackId} on device ${deviceId}`);
  } catch (error) {
    const errorData = error.response?.data;
    if (errorData?.error?.reason === 'NO_ACTIVE_DEVICE') {
      console.error('❌ No active Spotify device found.');
      console.error('💡 Please open Spotify on a device (desktop app, web player, or phone) and make sure it\'s active.');
      throw new Error('No active Spotify device. Please open Spotify on a device and try again.');
    }
    console.error('Error playing track:', errorData || error.message);
    throw new Error('Failed to play track on Spotify');
  }
}

/**
 * Pause playback on Spotify
 * @param {string|null} deviceId - Optional device ID
 * @param {string|null} venueId - Optional venue ID for venue-specific token
 */
export async function pauseSpotifyPlayback(deviceId = null, venueId = null) {
  const accessToken = await getSpotifyPremiumAccessToken(venueId);

  try {
    // If no device specified, check for stored device preference
    if (!deviceId && venueId) {
      try {
        const pool = getPool();
        const result = await pool.query(
          'SELECT selected_device_id FROM admin_settings WHERE venue_id = $1',
          [venueId]
        );
        if (result.rows[0]?.selected_device_id) {
          deviceId = result.rows[0].selected_device_id;
        }
      } catch (error) {
        // Ignore error - will use default behavior
      }
    }

    const url = `https://api.spotify.com/v1/me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`;
    await axios.put(
      url,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    const errorData = error.response?.data;
    if (errorData?.error?.reason === 'NO_ACTIVE_DEVICE') {
      console.warn('⚠️  No active device to pause');
      return; // Don't throw - pausing when nothing is playing is fine
    }
    console.error('Error pausing playback:', errorData || error.message);
    throw new Error('Failed to pause playback');
  }
}

/**
 * Skip to next track on Spotify
 * @param {string|null} deviceId - Optional device ID
 * @param {string|null} venueId - Optional venue ID for venue-specific token
 */
export async function skipSpotifyTrack(deviceId = null, venueId = null) {
  const accessToken = await getSpotifyPremiumAccessToken(venueId);

  try {
    // If no device specified, check for stored device preference
    if (!deviceId && venueId) {
      try {
        const pool = getPool();
        const result = await pool.query(
          'SELECT selected_device_id FROM admin_settings WHERE venue_id = $1',
          [venueId]
        );
        if (result.rows[0]?.selected_device_id) {
          deviceId = result.rows[0].selected_device_id;
        }
      } catch (error) {
        // Ignore error - will use default behavior
      }
    }

    const url = `https://api.spotify.com/v1/me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`;
    await axios.post(
      url,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    const errorData = error.response?.data;
    if (errorData?.error?.reason === 'NO_ACTIVE_DEVICE') {
      console.warn('⚠️  No active device to skip');
      throw new Error('No active Spotify device. Please open Spotify on a device and try again.');
    }
    console.error('Error skipping track:', errorData || error.message);
    throw new Error('Failed to skip track');
  }
}

/**
 * Get audio features for tracks
 * @param {string|string[]} trackIds - Single track ID or array of track IDs
 * @param {string} accessToken - Spotify access token
 * @returns {Object|Object[]} Audio features object or array of objects
 */
export async function getAudioFeatures(trackIds, accessToken) {
  try {
    const ids = Array.isArray(trackIds) ? trackIds : [trackIds];
    
    // Spotify API allows up to 100 IDs per request
    const chunks = [];
    for (let i = 0; i < ids.length; i += 100) {
      chunks.push(ids.slice(i, i + 100));
    }

    const allFeatures = [];
    for (const chunk of chunks) {
      const response = await axios.get(
        'https://api.spotify.com/v1/audio-features',
        {
          params: {
            ids: chunk.join(','),
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      allFeatures.push(...(response.data.audio_features || []));
    }

    return Array.isArray(trackIds) ? allFeatures : allFeatures[0];
  } catch (error) {
    console.error('Error getting audio features:', error.response?.data || error.message);
    throw new Error('Failed to get audio features');
  }
}

/**
 * Extract playlist ID from Spotify URL
 * @param {string} playlistUrl - Spotify playlist URL
 * @returns {string} Playlist ID
 */
export function extractPlaylistId(playlistUrl) {
  // Handle various Spotify URL formats:
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // https://spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  // 37i9dQZF1DXcBWIGoYBM5M (just the ID)
  
  if (!playlistUrl) {
    throw new Error('Playlist URL is required');
  }

  // If it's already just an ID (no special characters except alphanumeric)
  if (/^[a-zA-Z0-9]+$/.test(playlistUrl.trim())) {
    return playlistUrl.trim();
  }

  // Try to extract from URL
  const urlPattern = /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/;
  const match = playlistUrl.match(urlPattern);
  
  if (match && match[1]) {
    return match[1];
  }

  throw new Error('Invalid Spotify playlist URL format');
}

/**
 * Get playlist info and all tracks from a playlist
 * @param {string} playlistIdOrUrl - Playlist ID or Spotify URL
 * @param {string} accessToken - Spotify access token
 * @returns {Object} Object with playlist info and tracks array
 */
export async function getPlaylistInfo(playlistIdOrUrl, accessToken) {
  try {
    const playlistId = extractPlaylistId(playlistIdOrUrl);
    
    // Get playlist info
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const playlist = playlistResponse.data;
    const tracks = [];

    // Fetch all tracks (handle pagination)
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    
    while (nextUrl) {
      const tracksResponse = await axios.get(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const items = tracksResponse.data.items
        .filter(item => item.track && !item.track.is_local && item.track.id)
        .map(item => ({
          spotify_id: item.track.id,
          title: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown',
          album: item.track.album?.name || 'Unknown',
          album_art_url: item.track.album?.images[0]?.url || null,
          duration_ms: item.track.duration_ms,
          is_explicit: item.track.explicit || false,
        }));

      tracks.push(...items);
      nextUrl = tracksResponse.data.next;
    }

    return {
      playlist_id: playlistId,
      playlist_name: playlist.name,
      tracks,
    };
  } catch (error) {
    console.error('Error getting playlist info:', error.response?.data || error.message);
    throw new Error('Failed to get playlist info');
  }
}

/**
 * Get tracks from a playlist (legacy function - kept for backward compatibility)
 */
export async function getPlaylistTracks(playlistId, accessToken) {
  const result = await getPlaylistInfo(playlistId, accessToken);
  return result.tracks;
}

