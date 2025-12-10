import { create } from 'zustand';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // in seconds
  votes: number;
  addedBy: string;
  addedAt: Date;
  isExplicit: boolean;
}

interface JukeboxState {
  // Queue
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number; // 0-100
  
  // Search
  searchQuery: string;
  searchResults: Song[];
  isSearching: boolean;
  
  // User
  userSongCount: number;
  maxSongsPerUser: number;
  
  // Admin
  isAdminMode: boolean;
  queueEnabled: boolean;
  
  // Actions
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  upvoteSong: (songId: string) => void;
  downvoteSong: (songId: string) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  skipSong: () => void;
  setProgress: (progress: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  toggleAdminMode: () => void;
  toggleQueueEnabled: () => void;
  clearQueue: () => void;
}

// Mock songs for demo
const mockCurrentSong: Song = {
  id: 'current-1',
  title: 'Levitating',
  artist: 'Dua Lipa',
  album: 'Future Nostalgia',
  albumArt: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
  duration: 203,
  votes: 24,
  addedBy: 'Sarah M.',
  addedAt: new Date(),
  isExplicit: false,
};

const mockQueue: Song[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: 200,
    votes: 18,
    addedBy: 'Alex T.',
    addedAt: new Date(Date.now() - 300000),
    isExplicit: false,
  },
  {
    id: '2',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    album: 'Uptown Special',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273e419ccba0baa8bd3f3d7abf2',
    duration: 270,
    votes: 15,
    addedBy: 'Jordan K.',
    addedAt: new Date(Date.now() - 600000),
    isExplicit: false,
  },
  {
    id: '3',
    title: 'good 4 u',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    duration: 178,
    votes: 12,
    addedBy: 'Emily R.',
    addedAt: new Date(Date.now() - 900000),
    isExplicit: false,
  },
  {
    id: '4',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273712701c5e263efc8726b1464',
    duration: 239,
    votes: 10,
    addedBy: 'Michael C.',
    addedAt: new Date(Date.now() - 1200000),
    isExplicit: false,
  },
  {
    id: '5',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
    duration: 200,
    votes: 8,
    addedBy: 'Chris B.',
    addedAt: new Date(Date.now() - 1500000),
    isExplicit: false,
  },
];

const mockSearchResults: Song[] = [
  {
    id: 'search-1',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273f429549123dbe8552764ba1d',
    duration: 200,
    votes: 0,
    addedBy: '',
    addedAt: new Date(),
    isExplicit: false,
  },
  {
    id: 'search-2',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
    duration: 167,
    votes: 0,
    addedBy: '',
    addedAt: new Date(),
    isExplicit: false,
  },
  {
    id: 'search-3',
    title: 'Shake It Off',
    artist: 'Taylor Swift',
    album: '1989',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273904445d70d04eb24d6bb79ac',
    duration: 219,
    votes: 0,
    addedBy: '',
    addedAt: new Date(),
    isExplicit: false,
  },
  {
    id: 'search-4',
    title: 'Happy',
    artist: 'Pharrell Williams',
    album: 'G I R L',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b27330fc79e6f09a9d55eff3a200',
    duration: 233,
    votes: 0,
    addedBy: '',
    addedAt: new Date(),
    isExplicit: false,
  },
  {
    id: 'search-5',
    title: 'Dynamite',
    artist: 'BTS',
    album: 'Dynamite (DayTime Version)',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2731384d423722fb74b678a56a6',
    duration: 199,
    votes: 0,
    addedBy: '',
    addedAt: new Date(),
    isExplicit: false,
  },
];

export const useJukeboxStore = create<JukeboxState>((set, get) => ({
  // Initial state
  queue: mockQueue,
  currentSong: mockCurrentSong,
  isPlaying: true,
  progress: 45,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  userSongCount: 0,
  maxSongsPerUser: 1,
  isAdminMode: false,
  queueEnabled: true,

  // Actions
  setQueue: (queue) => set({ queue }),
  
  addToQueue: (song) => {
    const state = get();
    if (state.userSongCount >= state.maxSongsPerUser) return;
    
    const newSong = {
      ...song,
      id: `queue-${Date.now()}`,
      votes: 0,
      addedBy: 'You',
      addedAt: new Date(),
    };
    
    set((state) => ({
      queue: [...state.queue, newSong],
      userSongCount: state.userSongCount + 1,
      searchQuery: '',
      searchResults: [],
    }));
  },
  
  removeFromQueue: (songId) => set((state) => ({
    queue: state.queue.filter((song) => song.id !== songId),
  })),
  
  upvoteSong: (songId) => set((state) => ({
    queue: state.queue
      .map((song) => song.id === songId ? { ...song, votes: song.votes + 1 } : song)
      .sort((a, b) => b.votes - a.votes),
  })),
  
  downvoteSong: (songId) => set((state) => ({
    queue: state.queue
      .map((song) => song.id === songId ? { ...song, votes: Math.max(0, song.votes - 1) } : song)
      .sort((a, b) => b.votes - a.votes),
  })),
  
  setCurrentSong: (song) => set({ currentSong: song, progress: 0 }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  skipSong: () => {
    const state = get();
    if (state.queue.length > 0) {
      const [nextSong, ...remainingQueue] = state.queue;
      set({
        currentSong: nextSong,
        queue: remainingQueue,
        progress: 0,
      });
    }
  },
  
  setProgress: (progress) => set({ progress }),
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (query.length > 0) {
      // Simulate search - in real app, this would call Spotify API
      set({ isSearching: true });
      setTimeout(() => {
        const filtered = mockSearchResults.filter(
          (song) =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase())
        );
        set({ searchResults: filtered.length > 0 ? filtered : mockSearchResults, isSearching: false });
      }, 300);
    } else {
      set({ searchResults: [], isSearching: false });
    }
  },
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setIsSearching: (isSearching) => set({ isSearching }),
  
  toggleAdminMode: () => set((state) => ({ isAdminMode: !state.isAdminMode })),
  
  toggleQueueEnabled: () => set((state) => ({ queueEnabled: !state.queueEnabled })),
  
  clearQueue: () => set({ queue: [] }),
}));

