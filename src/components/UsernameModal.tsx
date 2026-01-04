'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: (username: string) => void;
}

export function UsernameModal({ isOpen, onClose }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setError(null);
    }
  }, [isOpen]);

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 20) {
      return 'Username must be no more than 20 characters';
    }
    // Alphanumeric and underscores only
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Store username in localStorage
    localStorage.setItem('user_username', username.trim());
    onClose(username.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass rounded-3xl p-6 md:p-8 max-w-md w-full border border-gold-400/20">
              <div className="text-center mb-6">
                <h2 
                  className="text-2xl md:text-3xl font-bold gradient-text mb-2"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Welcome!
                </h2>
                <p className="text-gray-400 text-sm md:text-base">
                  Please enter a username to get started
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-midnight-800 border border-midnight-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50 transition-all"
                    maxLength={20}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={!username.trim()}
                  className="w-full px-6 py-3 rounded-xl bg-gold-400 text-midnight-900 font-semibold hover:bg-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

