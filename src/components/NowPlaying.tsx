'use client';

import { useState } from 'react';
import { useJukeboxStore } from '@/store/useJukeboxStore';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FeedbackModal } from './FeedbackModal';

export function NowPlaying() {
  const { currentSong, isPlaying, progress, upvoteSong, downvoteSong } = useJukeboxStore();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const isUpvoted = currentSong?.user_vote === 'upvote';
  const isDownvoted = currentSong?.user_vote === 'downvote';

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

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 md:mb-6">
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
          <span className="text-gold-400 font-semibold text-xs md:text-sm uppercase tracking-wider">
            Now Playing
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 items-center">
          {/* Album Art with Vinyl Effect */}
          <div className="relative group">
            {/* Vinyl Record Behind - Hidden on mobile */}
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="hidden md:block absolute inset-0 -right-6 flex items-center justify-center"
            >
              <div className="w-32 h-32 md:w-36 md:h-36 lg:w-44 lg:h-44 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black border-4 border-gray-700 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gold-500/50 border-2 border-gold-400" />
                </div>
                {/* Vinyl Grooves */}
                <div className="absolute inset-3 md:inset-4 rounded-full border border-gray-600/30" />
                <div className="absolute inset-6 md:inset-8 rounded-full border border-gray-600/20" />
                <div className="absolute inset-9 md:inset-12 rounded-full border border-gray-600/10" />
              </div>
            </motion.div>

            {/* Album Cover */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold-400/30 group-hover:ring-gold-400/60 transition-all duration-300">
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
          <div className="flex-1 text-center md:text-left min-w-0 w-full md:w-auto">
            <motion.h2
              key={currentSong.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2 line-clamp-2 md:truncate"
              style={{ fontFamily: 'Syne, sans-serif' }}
              title={currentSong.title}
            >
              {currentSong.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-gold-400 mb-1 truncate"
            >
              {currentSong.artist}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs sm:text-sm text-gray-400 mb-3 md:mb-4 truncate"
            >
              {currentSong.album}
            </motion.p>

            {/* Added By */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-gray-300 mb-3 md:mb-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">Requested by <span className="text-gold-400 font-medium">{currentSong.addedBy}</span></span>
            </div>
          </div>

          {/* Votes and Feedback */}
          <div className="flex flex-col items-center gap-3">
            {/* Voting */}
            <div className="flex flex-row md:flex-col items-center gap-2 bg-midnight-800/50 rounded-xl md:rounded-2xl p-3 md:p-4">
              <button
                onClick={async () => {
                  try {
                    await downvoteSong(currentSong.id);
                  } catch (error) {
                    // Error handled in store
                  }
                }}
                className={`p-2 rounded-lg transition-all ${
                  isDownvoted
                    ? 'bg-red-500/30 text-red-400 hover:bg-red-500/40'
                    : 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                }`}
                title={isDownvoted ? "Remove downvote" : "Downvote"}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="text-center">
                <span className={`text-xl md:text-2xl font-bold ${
                  (currentSong.net_score !== undefined ? currentSong.net_score : currentSong.votes) >= 0 
                    ? 'gradient-text' 
                    : 'text-red-400'
                }`}>
                  {currentSong.net_score !== undefined ? currentSong.net_score : currentSong.votes}
                </span>
                <span className="hidden md:block text-xs text-gray-400 uppercase tracking-wider">net score</span>
                {(currentSong.upvotes !== undefined || currentSong.downvotes !== undefined) && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{currentSong.upvotes || 0} / -{currentSong.downvotes || 0}
                  </div>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    await upvoteSong(currentSong.id);
                  } catch (error) {
                    // Error handled in store
                  }
                }}
                className={`p-2 rounded-lg transition-all ${
                  isUpvoted
                    ? 'bg-green-500/30 text-green-400 hover:bg-green-500/40'
                    : 'hover:bg-green-500/20 text-gray-400 hover:text-green-400'
                }`}
                title={isUpvoted ? "Remove upvote" : "Upvote"}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>

            {/* Feedback Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-4 py-2 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-semibold"
            >
              Add Feedback
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 md:mt-6 lg:mt-8">
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

      {/* Feedback Modal */}
      {currentSong && (
        <FeedbackModal
          songId={currentSong.id}
          songTitle={currentSong.title}
          songArtist={currentSong.artist}
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
      )}
    </motion.div>
  );
}

