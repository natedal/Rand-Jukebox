'use client';

import { useJukeboxStore, Song } from '@/store/useJukeboxStore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

function SongCard({ song, index }: { song: Song; index: number }) {
  const { upvoteSong, downvoteSong } = useJukeboxStore();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      layout
      className="song-card group"
    >
      <div className="flex items-center gap-4">
        {/* Position */}
        <div className="w-8 text-center">
          <span className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>
            {index + 1}
          </span>
        </div>

        {/* Album Art */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-white/10">
          <Image
            src={song.albumArt}
            alt={song.album}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{song.title}</h3>
          <p className="text-sm text-gray-400 truncate">{song.artist}</p>
        </div>

        {/* Duration */}
        <div className="hidden sm:block text-sm text-gray-500 font-mono">
          {formatDuration(song.duration)}
        </div>

        {/* Voting */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => downvoteSong(song.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className="min-w-[3rem] text-center">
            <motion.span
              key={song.votes}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-gold-400"
            >
              {song.votes}
            </motion.span>
          </div>
          
          <button
            onClick={() => upvoteSong(song.id)}
            className="p-2 rounded-lg hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Added By */}
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 min-w-[100px]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{song.addedBy}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function QueueList() {
  const { queue } = useJukeboxStore();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Up Next
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {queue.length} {queue.length === 1 ? 'song' : 'songs'} in queue
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>Sorted by votes</span>
        </div>
      </div>

      {/* Queue Items */}
      {queue.length > 0 ? (
        <AnimatePresence mode="popLayout">
          {queue.map((song, index) => (
            <SongCard key={song.id} song={song} index={index} />
          ))}
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-midnight-700/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Queue is empty</h3>
          <p className="text-gray-500">Search for a song above to add it to the queue!</p>
        </motion.div>
      )}
    </div>
  );
}

