'use client';

import { Header } from '@/components/Header';
import { NowPlaying } from '@/components/NowPlaying';
import { SearchBar } from '@/components/SearchBar';
import { QueueList } from '@/components/QueueList';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Home() {
  return (
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
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Now Playing - Takes up 2 columns on large screens */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <NowPlaying />
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-2xl p-4 text-center"
                >
                  <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>156</div>
                  <div className="text-sm text-gray-400 mt-1">Songs Today</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-2xl p-4 text-center"
                >
                  <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>89</div>
                  <div className="text-sm text-gray-400 mt-1">Active Users</div>
                </motion.div>
              </div>

              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-2xl p-6 mt-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How It Works
                </h3>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Search for a song using the search bar above</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Add it to the queue (1 song per person)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Vote on songs to move them up the queue</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Enjoy the music while you dine!</span>
                  </li>
                </ol>
              </motion.div>
            </motion.section>

            {/* Queue Section - Takes up 3 columns */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <QueueList />
            </motion.section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

