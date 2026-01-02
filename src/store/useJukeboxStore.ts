import { create } from 'zustand';
import { queueApi, songsApi, votesApi, userApi, feedbackApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getUserIdentifier } from '@/lib/fingerprint';
import { getVenueSlug } from '@/lib/venue';

export interface Song {
  id: string;
  spotify_id?: string;
  title: string;
  artist: string;
  album: string;
  album_art_url?: string;
  albumArt?: string; // For backward compatibility
  duration_ms?: number;
  duration?: number; // in seconds, for backward compatibility
  votes: number; // net_score for backward compatibility
  upvotes?: number;
  downvotes?: number;
  net_score?: number;
  requested_by?: string;
  addedBy?: string; // For backward compatibility
  requested_at?: string;
  addedAt?: Date; // For backward compatibility
  status?: string;
  is_explicit?: boolean;
  isExplicit?: boolean; // For backward compatibility
}

export interface Feedback {
  id: string;
  comment: string;
  created_at: string;
  updated_at?: string;
  is_own?: boolean;
}

interface JukeboxState {
  // Queue
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number; // 0-100
  queueEnabled: boolean;
  
  // Search
  searchQuery: string;
  searchResults: Song[];
  isSearching: boolean;
  
  // User
  requestsRemaining: number;
  requestsToday: number;
  maxRequestsPerDay: number;
  votesCast: number;
  
  // Venue
  venueSlug: string;
  venueName: string;
  
  // Feedback
  feedback: Record<string, Feedback[]>; // song_id -> feedback array
  
  // Stats
  songsPlayedToday: number;
  activeUsers: number;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchQueue: () => Promise<void>;
  searchSongs: (query: string) => Promise<void>;
  requestSong: (spotifyId: string) => Promise<{ success: boolean; error?: string }>;
  upvoteSong: (songId: string) => Promise<void>;
  downvoteSong: (songId: string) => Promise<void>;
  removeVote: (songId: string) => Promise<void>;
  addFeedback: (songId: string, comment: string) => Promise<void>;
  getFeedback: (songId: string) => Promise<void>;
  updateFeedback: (id: string, comment: string) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  fetchUserStatus: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setProgress: (progress: number) => void;
  initializeSocket: () => void;
}

// Normalize song data for compatibility
function normalizeSong(song: any): Song {
  return {
    ...song,
    albumArt: song.album_art_url || song.albumArt,
    duration: song.duration_ms ? Math.floor(song.duration_ms / 1000) : song.duration,
    addedBy: song.requested_by || song.addedBy,
    addedAt: song.requested_at ? new Date(song.requested_at) : song.addedAt,
    isExplicit: song.is_explicit !== undefined ? song.is_explicit : song.isExplicit,
    votes: song.net_score !== undefined ? song.net_score : song.votes, // Use net_score if available
    upvotes: song.upvotes || 0,
    downvotes: song.downvotes || 0,
    net_score: song.net_score !== undefined ? song.net_score : (song.votes || 0),
  };
}

export const useJukeboxStore = create<JukeboxState>((set, get) => ({
  // Initial state
  queue: [],
  currentSong: null,
  isPlaying: false,
  progress: 0,
  queueEnabled: true,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  requestsRemaining: 3,
  requestsToday: 0,
  maxRequestsPerDay: 3,
  votesCast: 0,
  venueSlug: typeof window !== 'undefined' ? getVenueSlug() : 'rand',
  venueName: '',
  feedback: {},
  songsPlayedToday: 0,
  activeUsers: 0,
  isLoading: false,
  error: null,

  // Fetch queue from API
  fetchQueue: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await queueApi.getQueue();
      const data = response.data;
      
      set({
        queue: data.queue.map(normalizeSong),
        currentSong: data.current_song ? normalizeSong(data.current_song) : null,
        isPlaying: data.is_playing,
        queueEnabled: data.queue_enabled,
        songsPlayedToday: data.stats?.songs_played_today || 0,
        activeUsers: data.stats?.active_users || 0,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error fetching queue:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to fetch queue',
        isLoading: false,
      });
    }
  },

  // Search songs
  searchSongs: async (query: string) => {
    // Allow empty query - backend will handle playlist mode differently
    try {
      set({ isSearching: true });
      const response = await songsApi.search(query || '');
      const results = response.data.results.map((song: any) => ({
        ...song,
        id: song.spotify_id, // Use spotify_id as temporary ID
        albumArt: song.album_art_url,
        duration: Math.floor(song.duration_ms / 1000),
        votes: 0,
        isExplicit: song.is_explicit,
      }));
      
      set({ searchResults: results, isSearching: false });
    } catch (error: any) {
      // If error is "Query is required", that's fine - just clear results
      if (error.response?.status === 400 && error.response?.data?.error === 'Query is required') {
        set({ searchResults: [], isSearching: false });
        return;
      }
      console.error('Error searching songs:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to search songs',
        isSearching: false,
      });
    }
  },

  // Request a song
  requestSong: async (spotifyId: string) => {
    try {
      const response = await songsApi.request(spotifyId);
      const data = response.data;
      
      // Refresh queue and user status
      await Promise.all([
        get().fetchQueue(),
        get().fetchUserStatus(),
      ]);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to request song';
      return { success: false, error: errorMessage };
    }
  },

  // Upvote a song
  upvoteSong: async (songId: string) => {
    try {
      await votesApi.upvote(songId);
      // Refresh queue to get updated vote counts
      await get().fetchQueue();
    } catch (error: any) {
      console.error('Error upvoting:', error);
      // Handle 400 error (already voted) gracefully
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Already voted on this song';
        // Don't throw - just show a message or do nothing
        console.warn(errorMsg);
        return;
      }
      throw error;
    }
  },

  // Downvote a song (true downvote)
  downvoteSong: async (songId: string) => {
    try {
      await votesApi.downvote(songId);
      // Refresh queue to get updated vote counts
      await get().fetchQueue();
    } catch (error: any) {
      console.error('Error downvoting:', error);
      // Handle 400 error gracefully
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Failed to downvote';
        console.warn(errorMsg);
        return;
      }
      throw error;
    }
  },

  // Remove vote entirely
  removeVote: async (songId: string) => {
    try {
      await votesApi.remove(songId);
      // Refresh queue to get updated vote counts
      await get().fetchQueue();
    } catch (error: any) {
      console.error('Error removing vote:', error);
      // Handle 400 error gracefully
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'No vote to remove';
        console.warn(errorMsg);
        return;
      }
      throw error;
    }
  },

  // Add feedback to currently playing song
  addFeedback: async (songId: string, comment: string) => {
    try {
      await feedbackApi.add(songId, comment);
      // Refresh feedback for this song
      await get().getFeedback(songId);
    } catch (error: any) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  },

  // Get feedback for a song
  getFeedback: async (songId: string) => {
    try {
      const response = await feedbackApi.get(songId);
      const feedback = response.data.feedback || [];
      set((state) => ({
        feedback: {
          ...state.feedback,
          [songId]: feedback,
        },
      }));
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  // Update feedback
  updateFeedback: async (id: string, comment: string) => {
    try {
      await feedbackApi.update(id, comment);
      // Refresh feedback for all songs (we don't know which song this belongs to)
      // In practice, this would be called from a component that knows the songId
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  // Delete feedback
  deleteFeedback: async (id: string) => {
    try {
      await feedbackApi.delete(id);
      // Refresh feedback - need to find which song this belongs to
      // In practice, this would be called from a component that knows the songId
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

  // Fetch user status
  fetchUserStatus: async () => {
    try {
      const response = await userApi.getStatus();
      const data = response.data;
      
      set({
        requestsRemaining: data.requests_remaining,
        requestsToday: data.requests_today,
        maxRequestsPerDay: data.max_requests_per_day || 3,
        votesCast: data.votes_cast,
      });
    } catch (error: any) {
      console.error('Error fetching user status:', error);
    }
  },

  // Set search query (triggers search)
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    // Always trigger search - backend will handle empty queries for playlist mode
    get().searchSongs(query);
  },

  // Set progress (for admin playback)
  setProgress: (progress: number) => {
    set({ progress });
  },

  // Initialize Socket.io connection
  initializeSocket: () => {
    const socket = getSocket();
    
    // Listen for queue updates
    socket.on('queue:updated', async () => {
      await get().fetchQueue();
    });

    socket.on('song:added', async () => {
      await get().fetchQueue();
      await get().fetchUserStatus(); // Update request count when song is added
    });

    socket.on('song:removed', async () => {
      await get().fetchQueue();
    });

    socket.on('playback:started', (data: { song: any }) => {
      set({
        currentSong: normalizeSong(data.song),
        isPlaying: true,
        progress: 0,
      });
    });

    socket.on('playback:paused', () => {
      set({ isPlaying: false });
    });

    socket.on('playback:skipped', (data: { next_song: any }) => {
      set({
        currentSong: data.next_song ? normalizeSong(data.next_song) : null,
        isPlaying: data.next_song !== null,
        progress: 0,
      });
    });

    socket.on('queue:toggled', (data: { enabled: boolean }) => {
      set({ queueEnabled: data.enabled });
    });

    // Initial fetch
    get().fetchQueue();
    get().fetchUserStatus(); // Fetch user status on initialization
  },
}));
