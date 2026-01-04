'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sentimentApi } from '@/lib/api';
import { FeedbackCalendar } from './FeedbackCalendar';
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

interface SongByDate {
  id: string;
  spotify_id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url?: string;
  requested_at: string;
  played_at?: string;
  requested_by?: string;
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
  
  // Date-based feedback state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [songsByDate, setSongsByDate] = useState<SongByDate[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [songsError, setSongsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [datesWithFeedback, setDatesWithFeedback] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueueRatings();
    } else if (activeTab === 'top-songs') {
      fetchTopSongs();
    } else if (activeTab === 'feedback') {
      fetchDatesWithFeedback();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSongId && activeTab === 'feedback') {
      fetchSongFeedback(selectedSongId);
    }
  }, [selectedSongId, activeTab]);

  useEffect(() => {
    if (activeTab === 'feedback' && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      fetchSongsByDate(dateStr);
    }
  }, [activeTab, selectedDate]);

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

  const fetchDatesWithFeedback = async () => {
    setIsLoadingDates(true);
    try {
      const response = await sentimentApi.getDatesWithFeedback();
      setDatesWithFeedback(response.data.dates || []);
    } catch (error: any) {
      console.error('Error fetching dates with feedback:', error);
      // Don't show error to user, just log it
      setDatesWithFeedback([]);
    } finally {
      setIsLoadingDates(false);
    }
  };

  const fetchSongsByDate = async (date: string) => {
    setIsLoadingSongs(true);
    setSongsError(null);
    setSelectedSongId(null);
    setSongFeedback([]);
    try {
      const response = await sentimentApi.getSongsByDate(date);
      setSongsByDate(response.data.songs || []);
    } catch (error: any) {
      console.error('Error fetching songs by date:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch songs';
      setSongsError(errorMsg);
      setSongsByDate([]);
    } finally {
      setIsLoadingSongs(false);
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
            View user feedback comments for songs. Select a day from the calendar, then choose a song from that day to view its feedback.
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
              {/* Calendar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Select Date
                </label>
                <FeedbackCalendar
                  selectedDate={selectedDate}
                  onDateSelect={(date) => setSelectedDate(date)}
                  datesWithFeedback={datesWithFeedback}
                />
              </div>

              {/* Search Filter */}
              {songsByDate.length > 0 && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-midnight-800 border border-midnight-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                  />
                </div>
              )}

              {/* Songs List */}
              {isLoadingSongs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto"></div>
                </div>
              ) : songsError ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-2">{songsError}</div>
                  <button
                    onClick={() => fetchSongsByDate(selectedDate)}
                    className="mt-4 px-4 py-2 rounded-lg bg-gold-400/20 text-gold-400 hover:bg-gold-400/30 transition-all text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : songsByDate.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No songs found for {selectedDate.toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {songsByDate
                    .filter((song) => {
                      if (!searchQuery.trim()) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        song.title.toLowerCase().includes(query) ||
                        song.artist.toLowerCase().includes(query) ||
                        song.album.toLowerCase().includes(query)
                      );
                    })
                    .map((song) => (
                      <div
                        key={song.id}
                        onClick={() => setSelectedSongId(song.id)}
                        className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700 hover:border-gold-400/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {song.album_art_url && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={song.album_art_url}
                                alt={song.album}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{song.title}</h4>
                            <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                            <p className="text-xs text-gray-500 truncate">{song.album}</p>
                            <div className="mt-1 text-xs text-gray-500">
                              {song.requested_by && (
                                <span>Requested by {song.requested_by}</span>
                              )}
                              {song.played_at && (
                                <span className="ml-2">• Played at {formatDate(song.played_at)}</span>
                              )}
                              {!song.played_at && song.requested_at && (
                                <span className="ml-2">• Requested at {formatDate(song.requested_at)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

