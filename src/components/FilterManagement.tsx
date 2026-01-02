'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { motion } from 'framer-motion';

const GENRE_OPTIONS = [
  "90's Hip Hop",
  "Smooth Jazz",
  "Classical",
  "70's Rock",
  "Techno",
  "Pop",
  "R&B",
  "Country",
  "Electronic",
  "Indie",
  "Alternative",
  "Reggae",
  "Blues",
  "Funk",
  "Soul",
];

export function FilterManagement() {
  const [filterMode, setFilterMode] = useState<'free' | 'tailored'>('free');
  const [banExplicit, setBanExplicit] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [allowedTracksCount, setAllowedTracksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getFilters();
      const filters = response.data;
      
      setFilterMode(filters.filter_mode || 'free');
      setBanExplicit(filters.ban_explicit || false);
      setGenreFilter(filters.genre_filter || []);
      setPlaylistName(filters.playlist_name);
      setAllowedTracksCount(filters.allowed_tracks_count || 0);
    } catch (error: any) {
      console.error('Error loading filters:', error);
      setError('Failed to load filter settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (newMode: 'free' | 'tailored') => {
    if (newMode === filterMode) return;

    const confirmMessage = newMode === 'tailored'
      ? 'Switching to Tailored Mode will restrict songs to only those in the selected playlist. Continue?'
      : 'Switching to Free Mode will allow any song. Continue?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await adminApi.updateFilters({ filter_mode: newMode });
      setFilterMode(newMode);
      setSuccess(`Switched to ${newMode === 'free' ? 'Free' : 'Tailored'} Mode`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating mode:', error);
      setError(error.response?.data?.error || 'Failed to update mode');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFilters = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await adminApi.updateFilters({
        filter_mode: filterMode,
        ban_explicit: banExplicit,
        genre_filter: genreFilter,
      });
      setSuccess('Filter settings saved');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving filters:', error);
      setError(error.response?.data?.error || 'Failed to save filters');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setError('Please enter a playlist URL');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      const response = await adminApi.importPlaylist(playlistUrl.trim());
      setPlaylistName(response.data.playlist_name);
      setAllowedTracksCount(response.data.tracks_count);
      setFilterMode('tailored');
      setPlaylistUrl('');
      setSuccess(`Playlist imported: ${response.data.tracks_count} tracks`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error importing playlist:', error);
      setError(error.response?.data?.error || 'Failed to import playlist');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearPlaylist = async () => {
    if (!confirm('Clear the current playlist? This will switch to Free Mode.')) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await adminApi.updateFilters({ filter_mode: 'free', playlist_url: '' });
      setFilterMode('free');
      setPlaylistName(null);
      setAllowedTracksCount(0);
      setSuccess('Playlist cleared');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error clearing playlist:', error);
      setError(error.response?.data?.error || 'Failed to clear playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setGenreFilter(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
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
    <div className="glass rounded-2xl p-4 md:p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 md:mb-4"
      >
        <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Management
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform md:hidden ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>

      {/* Mode Indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-400">Mode:</span>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeChange('free')}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterMode === 'free'
                  ? 'bg-blue-500/30 border-2 border-blue-400 text-blue-300'
                  : 'bg-gray-700/50 border-2 border-gray-600 text-gray-400 hover:border-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Free Mode
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeChange('tailored')}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterMode === 'tailored'
                  ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-300'
                  : 'bg-gray-700/50 border-2 border-gray-600 text-gray-400 hover:border-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Tailored Mode
            </motion.button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {filterMode === 'free'
            ? 'Users can request any song from Spotify'
            : 'Users can only request songs from the selected playlist'}
        </p>
      </div>

      {/* Free Mode Settings */}
      {filterMode === 'free' && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ban-explicit"
              checked={banExplicit}
              onChange={(e) => setBanExplicit(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-gold-400 focus:ring-gold-400"
            />
            <label htmlFor="ban-explicit" className="text-sm text-gray-300 cursor-pointer">
              Ban explicit songs
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Genre/Style Filter (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map(genre => (
                <motion.button
                  key={genre}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    genreFilter.includes(genre)
                      ? 'bg-gold-400/30 border border-gold-400 text-gold-300'
                      : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {genre}
                </motion.button>
              ))}
            </div>
            {genreFilter.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {genreFilter.join(', ')}
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveFilters}
            disabled={isSaving}
            className="w-full px-4 py-2 rounded-xl bg-gold-500/20 border border-gold-500/30 text-gold-400 hover:bg-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Filter Settings'}
          </motion.button>
        </div>
      )}

      {/* Tailored Mode Settings */}
      {filterMode === 'tailored' && (
        <div className="space-y-4 mb-6">
          {playlistName ? (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{playlistName}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearPlaylist}
                  disabled={isSaving}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Clear
                </motion.button>
              </div>
              <p className="text-xs text-gray-400">
                {allowedTracksCount} tracks available
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Spotify Playlist URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImportPlaylist}
                  disabled={isImporting || !playlistUrl.trim()}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Paste a Spotify playlist URL to restrict songs to only those in the playlist
              </p>
            </div>
          )}
        </div>
      )}

        {/* Messages */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

