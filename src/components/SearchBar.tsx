'use client';

import { useState, useEffect } from 'react';
import { useJukeboxStore, Song } from '@/store/useJukeboxStore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

function SearchResult({ song, onAdd }: { song: Song; onAdd: () => void }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    await onAdd();
    setIsAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-midnight-700/50 transition-all duration-200 group"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
        <Image
          src={song.albumArt || song.album_art_url || '/placeholder-album.png'}
          alt={song.album}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-album.png';
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{song.title}</h4>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </div>

      <motion.button
        onClick={handleAdd}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isAdding}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all duration-200 group-hover:opacity-100 opacity-70 disabled:opacity-50"
      >
        {isAdding ? (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </motion.svg>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline font-medium">Add</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

export function SearchBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching, 
    requestSong,
    requestsRemaining,
    maxRequestsPerDay,
    queueEnabled,
    fetchUserStatus,
    searchSongs,
    error: storeError,
  } = useJukeboxStore();
  
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Show store error if search fails
  useEffect(() => {
    if (storeError && storeError.includes('search')) {
      setErrorMessage(storeError);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  }, [storeError]);

  // Load all songs when search bar is focused (for playlist mode)
  useEffect(() => {
    if (isFocused && !searchQuery) {
      searchSongs('');
    }
  }, [isFocused, searchQuery, searchSongs]);

  const handleAddSong = async (song: Song) => {
    if (requestsRemaining <= 0) {
      setErrorMessage('You have reached your daily request limit');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    if (!song.spotify_id) {
      setErrorMessage('Invalid song');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const result = await requestSong(song.spotify_id);
    
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      await fetchUserStatus();
      // Clear search query to close dropdown
      setSearchQuery('');
    } else {
      setErrorMessage(result.error || 'Failed to add song');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  if (!queueEnabled) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-amber-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Song requests are currently paused</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Song requested!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">{errorMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          {isSearching ? (
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 text-gold-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </motion.svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search for a song to add..."
          disabled={requestsRemaining <= 0}
          className="input-search pl-14 pr-32 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Song Limit Badge */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            requestsRemaining > 0 
              ? 'bg-gold-500/20 text-gold-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {requestsRemaining > 0 ? `${requestsRemaining}/${maxRequestsPerDay} remaining` : `0/${maxRequestsPerDay} remaining`}
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-40 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              {searchQuery && (
                <p className="text-xs text-gray-400 px-2 py-1 mb-1">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
              )}
              {!searchQuery && (
                <p className="text-xs text-gray-400 px-2 py-1 mb-1">
                  Available songs ({searchResults.length})
                </p>
              )}
              {searchResults.map((song) => (
                <SearchResult 
                  key={song.spotify_id || song.id} 
                  song={song} 
                  onAdd={() => handleAddSong(song)} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Text */}
      {requestsRemaining <= 0 && (
        <p className="mt-3 text-center text-sm text-amber-400">
          You&apos;ve reached your daily request limit. Come back tomorrow!
        </p>
      )}
    </div>
  );
}
