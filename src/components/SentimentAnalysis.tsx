'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sentimentApi } from '@/lib/api';
import Image from 'next/image';

type Tab = 'queue' | 'top-songs' | 'feedback';

interface QueueSongRating {
  song_id: string;
  spotify_id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url?: string;
  current_upvotes: number;
  current_downvotes: number;
  current_net_score: number;
  approval_rating: number | null;
  total_plays: number;
  total_votes: number;
}

interface TopSong {
  spotify_id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url?: string;
  approval_rating: number | null;
  total_plays: number;
  total_votes: number;
  total_upvotes: number;
  total_downvotes: number;
}

interface SongFeedback {
  id: string;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export function SentimentAnalysis() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [queueRatings, setQueueRatings] = useState<QueueSongRating[]>([]);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [songFeedback, setSongFeedback] = useState<SongFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'plays' | 'votes'>('rating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [topSongsError, setTopSongsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueueRatings();
    } else if (activeTab === 'top-songs') {
      fetchTopSongs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSongId && activeTab === 'feedback') {
      fetchSongFeedback(selectedSongId);
    }
  }, [selectedSongId, activeTab]);

  const fetchQueueRatings = async () => {
    setIsLoading(true);
    setQueueError(null);
    try {
      const response = await sentimentApi.getQueueRatings();
      setQueueRatings(response.data.queue || []);
    } catch (error: any) {
      console.error('Error fetching queue ratings:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load queue ratings';
      setQueueError(errorMsg);
      setQueueRatings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopSongs = async () => {
    setIsLoading(true);
    setTopSongsError(null);
    try {
      const response = await sentimentApi.getTopSongs(50);
      setTopSongs(response.data.top_songs || []);
    } catch (error: any) {
      console.error('Error fetching top songs:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load top songs';
      setTopSongsError(errorMsg);
      setTopSongs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSongFeedback = async (songId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sentimentApi.getSongFeedback(songId);
      setSongFeedback(response.data.feedback || []);
      if (response.data.feedback && response.data.feedback.length === 0) {
        setErrorMessage('No feedback found for this song');
      }
    } catch (error: any) {
      console.error('Error fetching song feedback:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch song feedback';
      setErrorMessage(errorMsg);
      setSongFeedback([]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateSongId = (songId: string): boolean => {
    // UUID format or Spotify ID format (22 alphanumeric characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const spotifyIdRegex = /^[a-zA-Z0-9]{22}$/;
    return uuidRegex.test(songId) || spotifyIdRegex.test(songId);
  };

  const sortedQueueRatings = [...queueRatings].sort((a, b) => {
    if (sortBy === 'rating') {
      const aRating = a.approval_rating ?? -Infinity;
      const bRating = b.approval_rating ?? -Infinity;
      return bRating - aRating;
    } else if (sortBy === 'plays') {
      return b.total_plays - a.total_plays;
    } else {
      return b.total_votes - a.total_votes;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-4 md:p-6 lg:p-8"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
        Sentiment Analysis
      </h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-midnight-700">
        {(['queue', 'top-songs', 'feedback'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-xl font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gold-400/20 text-gold-400 border-b-2 border-gold-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'queue' && 'Queue Ratings'}
            {tab === 'top-songs' && 'Most Loved Songs'}
            {tab === 'feedback' && 'Song Feedback'}
          </button>
        ))}
      </div>

      {/* Queue Ratings Tab */}
      {activeTab === 'queue' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <p className="text-gray-400 text-sm">
              Historical approval ratings for songs currently in the queue
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'plays' | 'votes')}
              className="px-3 py-2 rounded-lg bg-midnight-800 border border-midnight-700 text-white text-sm w-full sm:w-auto"
            >
              <option value="rating">Sort by Rating</option>
              <option value="plays">Sort by Plays</option>
              <option value="votes">Sort by Votes</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto"></div>
            </div>
          ) : queueError ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-2">{queueError}</div>
              <button
                onClick={fetchQueueRatings}
                className="mt-4 px-4 py-2 rounded-lg bg-gold-400/20 text-gold-400 hover:bg-gold-400/30 transition-all text-sm"
              >
                Retry
              </button>
            </div>
          ) : sortedQueueRatings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No songs in queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[700px] space-y-3">
                {sortedQueueRatings.map((song) => (
                  <div
                    key={song.song_id}
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-midnight-800/50 border border-midnight-700"
                  >
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={song.album_art_url || '/placeholder-album.png'}
                        alt={song.album}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate text-sm sm:text-base">{song.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{song.artist}</p>
                    </div>
                    <div className="text-center min-w-[60px] sm:min-w-[80px] flex-shrink-0">
                      <div className="text-sm sm:text-lg font-bold text-gold-400">
                        {song.approval_rating !== null ? `${song.approval_rating.toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="text-center min-w-[60px] sm:min-w-[80px] flex-shrink-0 hidden sm:block">
                      <div className="text-sm font-semibold text-white">{song.current_net_score}</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                    <div className="text-center min-w-[60px] sm:min-w-[80px] flex-shrink-0">
                      <div className="text-sm font-semibold text-white">{song.total_plays}</div>
                      <div className="text-xs text-gray-500">Plays</div>
                    </div>
                    <div className="text-center min-w-[60px] sm:min-w-[80px] flex-shrink-0">
                      <div className="text-sm font-semibold text-white">{song.total_votes}</div>
                      <div className="text-xs text-gray-500">Votes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Songs Tab */}
      {activeTab === 'top-songs' && (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            Most historically loved songs ranked by audience approval rating
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto"></div>
            </div>
          ) : topSongsError ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-2">{topSongsError}</div>
              <button
                onClick={fetchTopSongs}
                className="mt-4 px-4 py-2 rounded-lg bg-gold-400/20 text-gold-400 hover:bg-gold-400/30 transition-all text-sm"
              >
                Retry
              </button>
            </div>
          ) : topSongs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No song data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[700px] space-y-3">
                {topSongs.map((song, index) => (
                  <div
                    key={song.spotify_id}
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-midnight-800/50 border border-midnight-700"
                  >
                    <div className="w-6 sm:w-8 text-center flex-shrink-0">
                      <span className="text-lg sm:text-xl font-bold gradient-text">#{index + 1}</span>
                    </div>
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={song.album_art_url || '/placeholder-album.png'}
                        alt={song.album}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate text-sm sm:text-base">{song.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{song.artist}</p>
                    </div>
                    <div className="text-center min-w-[70px] sm:min-w-[100px] flex-shrink-0">
                      <div className="text-sm sm:text-lg font-bold text-gold-400">
                        {song.approval_rating !== null ? `${song.approval_rating.toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Approval</div>
                    </div>
                    <div className="text-center min-w-[60px] sm:min-w-[80px] flex-shrink-0">
                      <div className="text-sm font-semibold text-white">{song.total_plays}</div>
                      <div className="text-xs text-gray-500">Plays</div>
                    </div>
                    <div className="text-center min-w-[70px] sm:min-w-[80px] flex-shrink-0">
                      <div className="text-xs sm:text-sm font-semibold text-white">
                        +{song.total_upvotes} / -{song.total_downvotes}
                      </div>
                      <div className="text-xs text-gray-500">Votes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            View user feedback comments for songs. Select a song from the queue to view its feedback.
          </p>

          {selectedSongId ? (
            <div>
              <button
                onClick={() => {
                  setSelectedSongId(null);
                  setSongFeedback([]);
                }}
                className="mb-4 px-4 py-2 rounded-lg bg-midnight-700 text-white hover:bg-midnight-600 transition-all text-sm"
              >
                ← Back to Song Selection
              </button>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto"></div>
                </div>
              ) : errorMessage ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-2">{errorMessage}</div>
                  <p className="text-sm text-gray-400">Please check the song ID and try again</p>
                </div>
              ) : songFeedback.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No feedback for this song</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {songFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700"
                    >
                      <p className="text-white mb-2">{item.comment}</p>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.created_at)}
                        {item.updated_at && item.updated_at !== item.created_at && ' (edited)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-4">
                Click on a song from the queue management panel to view its feedback, or enter a song ID:
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter song ID (UUID or Spotify ID)"
                  className="flex-1 px-4 py-2 rounded-lg bg-midnight-800 border border-midnight-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const songId = (e.target as HTMLInputElement).value.trim();
                      if (songId) {
                        if (validateSongId(songId)) {
                          setSelectedSongId(songId);
                        } else {
                          setErrorMessage('Invalid song ID format. Please use a valid UUID or Spotify ID from the queue.');
                        }
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter song ID (UUID or Spotify ID)"]') as HTMLInputElement;
                    const songId = input?.value.trim();
                    if (songId) {
                      if (validateSongId(songId)) {
                        setSelectedSongId(songId);
                      } else {
                        setErrorMessage('Invalid song ID format. Please use a valid UUID or Spotify ID from the queue.');
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gold-400 text-midnight-900 font-semibold hover:bg-gold-500 transition-all"
                >
                  View Feedback
                </button>
              </div>
              {errorMessage && !selectedSongId && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

