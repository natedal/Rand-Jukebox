'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PendingSong {
  id: string;
  spotify_id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url: string | null;
  duration_ms: number;
  is_explicit: boolean;
  requested_at: string;
  requested_by: string;
  votes: number;
  tags: string[];
}

export function PendingRequests() {
  const [songs, setSongs] = useState<PendingSong[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingRequests();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadPendingRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingRequests = async () => {
    try {
      const response = await adminApi.getPendingRequests();
      setSongs(response.data.songs || []);
      setError(null);
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
      setError('Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (songId: string) => {
    try {
      setIsProcessing(songId);
      setError(null);
      await adminApi.approveSong(songId);
      setSongs(prev => prev.filter(s => s.id !== songId));
      setSelectedSongs(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error approving song:', error);
      setError(error.response?.data?.error || 'Failed to approve song');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeny = async (songId: string) => {
    const reason = prompt('Reason for denial (optional):');
    try {
      setIsProcessing(songId);
      setError(null);
      await adminApi.denySong(songId, reason || undefined);
      setSongs(prev => prev.filter(s => s.id !== songId));
      setSelectedSongs(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error denying song:', error);
      setError(error.response?.data?.error || 'Failed to deny song');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedSongs.size === 0) {
      setError('Please select at least one song');
      return;
    }

    try {
      setIsProcessing('bulk');
      setError(null);
      await adminApi.bulkApproveSong(Array.from(selectedSongs));
      setSongs(prev => prev.filter(s => !selectedSongs.has(s.id)));
      setSelectedSongs(new Set());
    } catch (error: any) {
      console.error('Error bulk approving songs:', error);
      setError(error.response?.data?.error || 'Failed to approve songs');
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleSelect = (songId: string) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSongs.size === songs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(songs.map(s => s.id)));
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending Song Requests
        </h3>
        <div className="text-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending Song Requests
        </h3>
        {songs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
            >
              {selectedSongs.size === songs.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedSongs.size > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkApprove}
                disabled={isProcessing === 'bulk'}
                className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing === 'bulk' ? 'Approving...' : `Approve ${selectedSongs.size}`}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {songs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No pending song requests</p>
          <p className="text-xs mt-2 text-gray-500">Songs will appear here when users request them</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {songs.map((song) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedSongs.has(song.id)}
                    onChange={() => toggleSelect(song.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold-400 focus:ring-gold-400"
                  />

                  {/* Album Art */}
                  {song.album_art_url && (
                    <div className="flex-shrink-0">
                      <Image
                        src={song.album_art_url}
                        alt={`${song.title} album art`}
                        width={64}
                        height={64}
                        className="rounded-lg"
                      />
                    </div>
                  )}

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{song.title}</h4>
                        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                        <p className="text-xs text-gray-500 truncate">{song.album}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs text-gray-500">{formatDuration(song.duration_ms)}</span>
                        {song.is_explicit && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                            E
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {song.tags && song.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {song.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-xs bg-gold-400/20 text-gold-300 border border-gold-400/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Requester Info */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span>Requested by: </span>
                        <span className="text-gray-400">{song.requested_by}</span>
                        <span className="ml-2">• {formatDate(song.requested_at)}</span>
                      </div>
                      {song.votes > 0 && (
                        <div className="text-xs text-gray-400">
                          {song.votes} vote{song.votes !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(song.id)}
                      disabled={isProcessing === song.id}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isProcessing === song.id ? '...' : 'Approve'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeny(song.id)}
                      disabled={isProcessing === song.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Deny
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

