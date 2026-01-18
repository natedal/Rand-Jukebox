'use client';

import { motion } from 'framer-motion';

interface VenueNotConfiguredProps {
  venueSlug: string;
  error?: string | null;
}

export function VenueNotConfigured({ venueSlug, error }: VenueNotConfiguredProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-midnight-700/50 flex items-center justify-center border-2 border-gold-400/30">
            <svg
              className="w-12 h-12 text-gold-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-4"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Venue Not Configured
        </h1>

        {/* Message */}
        <p className="text-lg md:text-xl text-gray-300 mb-6">
          The venue <span className="text-gold-400 font-semibold">{venueSlug}</span> has not been
          configured yet.
        </p>

        {/* Error details if available */}
        {error && error !== 'Venue not found' && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <p className="text-gray-400 mb-4">
            If you believe this is an error, please contact the venue administrator or try accessing
            a different venue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all font-semibold"
            >
              Go to Home
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-midnight-700/50 border border-midnight-600 text-gray-300 hover:bg-midnight-700 transition-all font-semibold"
            >
              Retry
            </button>
          </div>
        </div>

        {/* Venue slug display */}
        <div className="text-sm text-gray-500">
          <p>Venue slug: <code className="text-gold-400">{venueSlug}</code></p>
        </div>
      </motion.div>
    </div>
  );
}



