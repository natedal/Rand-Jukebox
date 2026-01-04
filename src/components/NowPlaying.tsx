'use client';

import { useJukeboxStore } from '@/store/useJukeboxStore';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function NowPlaying() {
  const { currentSong, isPlaying, progress } = useJukeboxStore();

  if (!currentSong) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-gray-400">No song is currently playing</div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = currentSong.duration || 0;
  const currentTime = Math.floor((progress / 100) * duration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-600/20 via-midnight-800/90 to-midnight-900" />
      
      {/* Animated Circles */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl animate-pulse-ring" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl animate-pulse-ring" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
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
          <span className="text-gold-400 font-semibold text-sm uppercase tracking-wider">
            Now Playing
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
          {/* Album Art with Vinyl Effect */}
          <div className="relative group">
            {/* Vinyl Record Behind */}
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 -right-6 flex items-center justify-center"
            >
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black border-4 border-gray-700 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gold-500/50 border-2 border-gold-400" />
                </div>
                {/* Vinyl Grooves */}
                <div className="absolute inset-4 rounded-full border border-gray-600/30" />
                <div className="absolute inset-8 rounded-full border border-gray-600/20" />
                <div className="absolute inset-12 rounded-full border border-gray-600/10" />
              </div>
            </motion.div>

            {/* Album Cover */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold-400/30 group-hover:ring-gold-400/60 transition-all duration-300">
              <Image
                src={currentSong.albumArt || '/placeholder-album.png'}
                alt={currentSong.album || 'Album cover'}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 text-center md:text-left">
            <motion.h2
              key={currentSong.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {currentSong.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gold-400 mb-1"
            >
              {currentSong.artist}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-400 mb-4"
            >
              {currentSong.album}
            </motion.p>

            {/* Added By */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-300">
              <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Requested by <span className="text-gold-400 font-medium">{currentSong.addedBy}</span></span>
            </div>
          </div>

          {/* Votes */}
          <div className="flex flex-col items-center gap-2 bg-midnight-800/50 rounded-2xl p-4">
            <svg className="w-8 h-8 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-2xl font-bold gradient-text">{currentSong.votes}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">votes</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 md:mt-8">
          <div className="relative h-2 bg-midnight-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-500 to-gold-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-400/50 to-transparent rounded-full animate-shimmer"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

