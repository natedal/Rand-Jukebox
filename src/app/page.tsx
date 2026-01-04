'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { NowPlaying } from '@/components/NowPlaying';
import { SearchBar } from '@/components/SearchBar';
import { QueueList } from '@/components/QueueList';
import { Footer } from '@/components/Footer';
import { UsernameModal } from '@/components/UsernameModal';
import { motion } from 'framer-motion';
import { useJukeboxStore } from '@/store/useJukeboxStore';
import { getUserIdentifier, hasUsername } from '@/lib/fingerprint';

export default function Home() {
  const initializeSocket = useJukeboxStore((state) => state.initializeSocket);
  const songsPlayedToday = useJukeboxStore((state) => state.songsPlayedToday);
  const activeUsers = useJukeboxStore((state) => state.activeUsers);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if username is set
    if (!hasUsername()) {
      setShowUsernameModal(true);
      return;
    }

    // Initialize user identifier
    getUserIdentifier();
    
    // Initialize socket connection and fetch data
    initializeSocket();
    setIsInitialized(true);
  }, [initializeSocket]);

  const handleUsernameSet = (username: string) => {
    setShowUsernameModal(false);
    // Initialize user identifier
    getUserIdentifier();
    // Initialize socket connection and fetch data
    initializeSocket();
    setIsInitialized(true);
  };

  // Don't render main app until username is set
  if (!isInitialized) {
    return (
      <>
        <UsernameModal isOpen={showUsernameModal} onClose={handleUsernameSet} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
        </div>
      </>
    );
  }
  return (
    <>
      <UsernameModal isOpen={showUsernameModal} onClose={handleUsernameSet} />
      <div className="min-h-screen flex flex-col">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-midnight-600/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 md:mb-12"
          >
            <h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-4"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Shape the Soundtrack
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Request songs, vote on the queue, and enjoy the music at Rand. 
              <span className="text-gold-400"> Your dining experience, your playlist.</span>
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 md:mb-12"
          >
            <SearchBar />
          </motion.section>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-5 gap-4 md:gap-8">
            {/* Now Playing - Takes up 2 columns on large screens, full width on mobile */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 order-1"
            >
              <NowPlaying />
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-2xl p-3 md:p-4 text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>{songsPlayedToday}</div>
                  <div className="text-xs md:text-sm text-gray-400 mt-1">Songs Today</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-2xl p-3 md:p-4 text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>{activeUsers}</div>
                  <div className="text-xs md:text-sm text-gray-400 mt-1">Active Users</div>
                </motion.div>
              </div>

              {/* How It Works - Hidden on mobile, shown on md+ */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="hidden md:block glass rounded-2xl p-4 md:p-6 mt-4 md:mt-6"
              >
                <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How It Works
                </h3>
                <ol className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-300">
                  <li className="flex items-start gap-2 md:gap-3">
                    <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Search for a song using the search bar above</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Add it to the queue (1 song per person)</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Vote on songs to move them up the queue</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Enjoy the music while you dine!</span>
                  </li>
                </ol>
              </motion.div>
            </motion.section>

            {/* Queue Section - Takes up 3 columns on large, full width on mobile */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 order-2"
            >
              <QueueList />
            </motion.section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
}

