import axios from 'axios';
import { getVenueSlug } from './venue';

// Ensure API_URL is always an absolute URL with protocol
function normalizeApiUrl(url: string | undefined): string {
  if (!url) {
    return 'http://localhost:3001';
  }
  
  // Remove trailing slashes
  url = url.trim().replace(/\/+$/, '');
  
  // If it doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//)) {
    // If it's localhost, use http, otherwise use https
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  
  return url;
}

// Get API URL with runtime validation
function getApiUrl(): string {
  // Always normalize at runtime to catch any misconfigurations
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const normalized = normalizeApiUrl(envUrl);
  
  // Double-check: if normalized URL doesn't start with http/https, something is wrong
  if (!normalized.match(/^https?:\/\//)) {
    console.error('Invalid API URL configuration:', envUrl, '-> normalized to:', normalized);
    // Fallback to localhost in development, or show error in production
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error('API URL is misconfigured. Please set NEXT_PUBLIC_API_URL in Vercel environment variables.');
    }
    return 'http://localhost:3001';
  }
  
  return normalized;
}

const API_URL = getApiUrl();

// Log API URL in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user identifier and venue slug to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Ensure baseURL is always absolute (runtime check)
    if (config.baseURL && !config.baseURL.match(/^https?:\/\//)) {
      console.error('Invalid baseURL detected:', config.baseURL);
      // Normalize it on the fly
      config.baseURL = normalizeApiUrl(config.baseURL);
    }
    
    const userIdentifier = localStorage.getItem('user_identifier');
    if (userIdentifier) {
      config.headers['X-User-Identifier'] = userIdentifier;
    }
    
    // Add venue slug header
    const venueSlug = getVenueSlug();
    config.headers['X-Venue-Slug'] = venueSlug;
  }
  return config;
});

// Response interceptor to catch configuration errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config) {
      const url = error.config.url || '';
      const baseURL = error.config.baseURL || '';
      const fullUrl = baseURL + url;
      
      // Check if URL is malformed (contains Vercel domain + Railway domain)
      if (fullUrl.includes('.vercel.app') && fullUrl.includes('.railway.app') && !fullUrl.startsWith('http')) {
        console.error('❌ API URL Configuration Error!');
        console.error('Current API URL:', baseURL);
        console.error('Full request URL:', fullUrl);
        console.error('This usually means NEXT_PUBLIC_API_URL in Vercel is missing https:// protocol');
        console.error('Please check Vercel → Settings → Environment Variables');
        console.error('NEXT_PUBLIC_API_URL should be: https://rand-jukebox-production.up.railway.app');
      }
      
      // Check for 405 errors which often indicate wrong URL
      if (error.response?.status === 405) {
        console.error('405 Method Not Allowed - This usually means the API URL is incorrect');
        console.error('Request URL:', fullUrl);
        console.error('Expected format: https://your-backend.railway.app/api/...');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const queueApi = {
  getQueue: () => api.get('/api/queue'),
};

export const songsApi = {
  search: (query: string) => api.post('/api/songs/search', { query }),
  request: (spotifyId: string) => api.post('/api/songs/request', { spotify_id: spotifyId }),
};

export const votesApi = {
  upvote: (songId: string) => api.post('/api/votes/upvote', { song_id: songId }),
  downvote: (songId: string) => api.post('/api/votes/downvote', { song_id: songId }),
  remove: (songId: string) => api.post('/api/votes/remove', { song_id: songId }),
};

export const userApi = {
  getStatus: () => api.get('/api/user/status'),
};

export const adminApi = {
  login: (password: string) => api.post('/api/admin/login', { password }),
  getStatus: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  play: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/playback/play', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  pause: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/playback/pause', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  skip: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/playback/skip', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  toggleQueue: (enabled: boolean) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/queue/toggle', { enabled }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  clearQueue: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/queue/clear', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  setPlaylist: (playlistId: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/playlist/set', { playlist_id: playlistId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  removeSong: (songId: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.delete(`/api/admin/songs/${songId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addSong: (spotifyId: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/songs/add', { spotify_id: spotifyId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  reorderQueue: (songOrders: Array<{ song_id: string; priority: number }>) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/queue/reorder', { song_orders: songOrders }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getDevices: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/devices', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  selectDevice: (deviceId: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/devices/select', { device_id: deviceId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getSpotifyStatus: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/spotify/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getSpotifyAuthUrl: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/spotify/auth', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  disconnectSpotify: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/spotify/disconnect', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getPendingRequests: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/pending-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  approveSong: (songId: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/songs/approve', { song_id: songId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  denySong: (songId: string, reason?: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/songs/deny', { song_id: songId, reason }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  bulkApproveSong: (songIds: string[]) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/songs/bulk-approve', { song_ids: songIds }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getFilters: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/filters', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateFilters: (filterConfig: {
    filter_mode?: 'free' | 'tailored';
    ban_explicit?: boolean;
    genre_filter?: string[];
    playlist_url?: string;
  }) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/filters', filterConfig, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  importPlaylist: (playlistUrl: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.post('/api/admin/filters/playlist/import', { playlist_url: playlistUrl }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const feedbackApi = {
  add: (songId: string, comment: string) => api.post('/api/feedback', { song_id: songId, comment }),
  get: (songId: string) => api.get(`/api/feedback/${songId}`),
  update: (id: string, comment: string) => api.put(`/api/feedback/${id}`, { comment }),
  delete: (id: string) => api.delete(`/api/feedback/${id}`),
};

export const sentimentApi = {
  getQueueRatings: () => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/sentiment/queue', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getTopSongs: (limit?: number) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get('/api/admin/sentiment/top-songs', {
      params: limit ? { limit } : {},
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getSongFeedback: (songId: string) => {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    const token = localStorage.getItem('admin_token');
    return api.get(`/api/admin/sentiment/song/${songId}/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

