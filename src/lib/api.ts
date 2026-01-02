import axios from 'axios';
import { getVenueSlug } from './venue';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user identifier and venue slug to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
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

