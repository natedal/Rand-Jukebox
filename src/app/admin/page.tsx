'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useJukeboxStore } from '@/store/useJukeboxStore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const {
    queue,
    currentSong,
    isPlaying,
    progress,
    togglePlay,
    skipSong,
    removeFromQueue,
    clearQueue,
    queueEnabled,
    toggleQueueEnabled,
    setProgress,
  } = useJukeboxStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = currentSong ? Math.floor((progress / 100) * currentSong.duration) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Admin Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
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
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Now Playing & Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Now Playing Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-3xl p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
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

                {currentSong ? (
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Album Art */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold-400/30">
                      <Image
                        src={currentSong.albumArt}
                        alt={currentSong.album}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {currentSong.title}
                      </h3>
                      <p className="text-lg text-gold-400 mb-1">{currentSong.artist}</p>
                      <p className="text-sm text-gray-400">{currentSong.album}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Requested by <span className="text-gold-400">{currentSong.addedBy}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No song is currently playing
                  </div>
                )}

                {/* Progress Bar */}
                {currentSong && (
                  <div className="mt-6">
                    <div 
                      className="relative h-3 bg-midnight-700 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = (x / rect.width) * 100;
                        setProgress(Math.max(0, Math.min(100, percentage)));
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-100"
                        style={{ left: `calc(${progress}% - 8px)` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-400 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(currentSong.duration)}</span>
                    </div>
                  </div>
                )}

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={skipSong}
                    className="p-4 rounded-full bg-midnight-700/50 text-gray-300 hover:bg-midnight-600 hover:text-white transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
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
                    onClick={skipSong}
                    className="p-4 rounded-full bg-midnight-700/50 text-gray-300 hover:bg-midnight-600 hover:text-white transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>

              {/* Queue Control Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-3xl p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleQueueEnabled}
                    className={`p-4 rounded-xl flex items-center gap-4 transition-all ${
                      queueEnabled 
                        ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${queueEnabled ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {queueEnabled ? (
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${queueEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {queueEnabled ? 'Requests Enabled' : 'Requests Paused'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {queueEnabled ? 'Students can add songs' : 'Queue is locked'}
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearQueue}
                    className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center gap-4 hover:bg-amber-500/30 transition-all"
                  >
                    <div className="p-3 rounded-lg bg-amber-500/30">
                      <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-amber-400">Clear Queue</div>
                      <div className="text-sm text-gray-400">Remove all pending songs</div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={skipSong}
                    className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center gap-4 hover:bg-blue-500/30 transition-all"
                  >
                    <div className="p-3 rounded-lg bg-blue-500/30">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-blue-400">Skip Song</div>
                      <div className="text-sm text-gray-400">Play next song in queue</div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-4 hover:bg-purple-500/30 transition-all"
                  >
                    <div className="p-3 rounded-lg bg-purple-500/30">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-purple-400">Volume Control</div>
                      <div className="text-sm text-gray-400">Adjust playback volume</div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Queue Management */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-6 h-fit"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Queue Management</h2>
                <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-400 text-sm font-medium">
                  {queue.length} songs
                </span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
                        <span className="text-lg font-bold text-gold-400 w-6">{index + 1}</span>
                        
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={song.albumArt}
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
                            onClick={() => removeFromQueue(song.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Songs Played Today', value: '156', icon: '🎵', color: 'gold' },
              { label: 'Active Users', value: '89', icon: '👥', color: 'blue' },
              { label: 'Total Votes', value: '432', icon: '⬆️', color: 'green' },
              { label: 'Queue Time', value: '~45min', icon: '⏱️', color: 'purple' },
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

