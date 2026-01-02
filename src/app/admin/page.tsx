'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminSearchBar } from '@/components/AdminSearchBar';
import { DeviceSelector } from '@/components/DeviceSelector';
import { SpotifyConnection } from '@/components/SpotifyConnection';
import { FilterManagement } from '@/components/FilterManagement';
import { PendingRequests } from '@/components/PendingRequests';
import { SentimentAnalysis } from '@/components/SentimentAnalysis';
import { adminApi } from '@/lib/api';
import { useJukeboxStore } from '@/store/useJukeboxStore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueEnabled, setQueueEnabled] = useState(true);
  const router = useRouter();
  
  const { queue, currentSong, fetchQueue } = useJukeboxStore();

  const fetchAdminStatus = useCallback(async () => {
    try {
      const response = await adminApi.getStatus();
      setAdminStatus(response.data);
      setIsPlaying(response.data.is_playing);
      setQueueEnabled(response.data.queue_enabled);
    } catch (error) {
      console.error('Error fetching admin status:', error);
    }
  }, []);

  useEffect(() => {
    // Check if admin token exists
    const token = localStorage.getItem('admin_token');
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchAdminStatus();
    fetchQueue();
    // Poll for updates
    const interval = setInterval(() => {
      fetchAdminStatus();
      fetchQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchAdminStatus, fetchQueue]);

  const checkAuth = async () => {
    try {
      await adminApi.getStatus();
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('admin_token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    try {
      await adminApi.play();
      await fetchAdminStatus();
      await fetchQueue();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start playback');
    }
  };

  const handlePause = async () => {
    try {
      await adminApi.pause();
      await fetchAdminStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to pause playback');
    }
  };

  const handleSkip = async () => {
    try {
      await adminApi.skip();
      await fetchAdminStatus();
      await fetchQueue();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to skip song');
    }
  };

  const handleToggleQueue = async (enabled: boolean) => {
    try {
      await adminApi.toggleQueue(enabled);
      await fetchAdminStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to toggle queue');
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Are you sure you want to clear the entire queue?')) return;
    try {
      await adminApi.clearQueue();
      await fetchQueue();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to clear queue');
    }
  };

  const handleRemoveSong = async (songId: string) => {
    try {
      await adminApi.removeSong(songId);
      await fetchQueue();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove song');
    }
  };

  const handleMoveSong = async (songId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = queue.findIndex(s => s.id === songId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= queue.length) return;

      // Calculate base priorities: higher number = appears first
      // Use 1000 as base to leave room for adjustments
      const basePriority = 1000;
      
      // Create new queue order by swapping
      const newQueue = [...queue];
      [newQueue[currentIndex], newQueue[newIndex]] = [newQueue[newIndex], newQueue[currentIndex]];

      // Assign priorities based on new order (higher priority = first)
      const priorities = newQueue.map((song, idx) => ({
        song_id: song.id,
        priority: basePriority - idx,
      }));

      await adminApi.reorderQueue(priorities);
      await fetchQueue();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to move song');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  const currentSongData = adminStatus?.current_song || currentSong;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="flex-1 relative z-10 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
          {/* Admin Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 
                    className="text-3xl md:text-4xl font-bold text-white"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Staff Control Panel
                  </h1>
                  <p className="text-gray-400">Manage the Rand Jukebox queue</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  router.push('/');
                }}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                Logout
              </button>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Left Column - Now Playing & Controls */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 overflow-x-hidden">
              {/* Now Playing Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-3xl p-4 md:p-6 lg:p-8"
              >
                <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <div className="sound-wave">
                    {isPlaying && (
                      <>
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </>
                    )}
                  </div>
                  Now Playing
                </h2>

                {currentSongData ? (
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                    {/* Album Art */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold-400/30 flex-shrink-0">
                      <Image
                        src={currentSongData.album_art_url || currentSongData.albumArt || '/placeholder-album.png'}
                        alt={currentSongData.album}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 text-center md:text-left min-w-0 w-full md:w-auto">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {currentSongData.title}
                      </h3>
                      <p className="text-base sm:text-lg text-gold-400 mb-1 truncate">{currentSongData.artist}</p>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{currentSongData.album}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-400">
                    No song is currently playing
                  </div>
                )}

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkip}
                    className="p-4 rounded-full bg-midnight-700/50 text-gray-300 hover:bg-midnight-600 hover:text-white transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="p-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-900 shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all"
                  >
                    {isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkip}
                    className="p-4 rounded-full bg-midnight-700/50 text-gray-300 hover:bg-midnight-600 hover:text-white transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>

              {/* Admin Search Bar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="glass rounded-3xl p-4 md:p-6 relative z-20 overflow-visible"
              >
                <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Add Song to Queue</h2>
                <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">Search and add songs directly to the queue (bypasses daily limit)</p>
                <AdminSearchBar onSongAdded={fetchQueue} />
              </motion.div>

              {/* Queue Control Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-3xl p-4 md:p-6 relative z-10"
              >
                <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">Quick Actions</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggleQueue(!queueEnabled)}
                    className={`p-3 md:p-4 rounded-xl flex items-center gap-3 md:gap-4 transition-all ${
                      queueEnabled 
                        ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${queueEnabled ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {queueEnabled ? (
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className={`text-sm md:text-base font-semibold ${queueEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {queueEnabled ? 'Requests Enabled' : 'Requests Paused'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-400">
                        {queueEnabled ? 'Students can add songs' : 'Queue is locked'}
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearQueue}
                    className="p-3 md:p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center gap-3 md:gap-4 hover:bg-amber-500/30 transition-all"
                  >
                    <div className="p-2 md:p-3 rounded-lg bg-amber-500/30 flex-shrink-0">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm md:text-base font-semibold text-amber-400">Clear Queue</div>
                      <div className="text-xs md:text-sm text-gray-400">Remove all pending songs</div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Spotify Connection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SpotifyConnection />
              </motion.div>

              {/* Device Selector */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DeviceSelector />
              </motion.div>

              {/* Filter Management */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <FilterManagement />
              </motion.div>

              {/* Pending Requests */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PendingRequests />
              </motion.div>

              {/* Sentiment Analysis */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <SentimentAnalysis />
              </motion.div>
            </div>

            {/* Right Column - Queue Management */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-4 md:p-6 h-fit order-3 lg:order-none lg:sticky lg:top-4"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-white">Queue Management</h2>
                <span className="px-2 md:px-3 py-1 rounded-full bg-gold-400/20 text-gold-400 text-xs md:text-sm font-medium">
                  {queue.length} songs
                </span>
              </div>

              <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {queue.length > 0 ? (
                    queue.map((song, index) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-midnight-800/50 hover:bg-midnight-700/50 transition-all group"
                      >
                        {/* Move Up/Down Buttons */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMoveSong(song.id, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveSong(song.id, 'down')}
                            disabled={index === queue.length - 1}
                            className="p-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <span className="text-lg font-bold text-gold-400 w-6">{index + 1}</span>
                        
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={song.album_art_url || song.albumArt || '/placeholder-album.png'}
                            alt={song.album}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{song.title}</h4>
                          <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRemoveSong(song.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="text-sm text-gold-400 font-medium">{song.votes}</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <p>Queue is empty</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* System Stats */}
          {adminStatus?.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Songs Played Today', value: adminStatus.stats.songs_played_today, icon: '🎵', color: 'gold' },
                { label: 'Active Users', value: adminStatus.stats.active_users, icon: '👥', color: 'blue' },
                { label: 'Total Votes', value: adminStatus.stats.total_votes, icon: '⬆️', color: 'green' },
                { label: 'Queue Length', value: queue.length, icon: '⏱️', color: 'purple' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <div>
                      <div className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
