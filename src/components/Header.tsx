'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getVenueSlug, getVenueName } from '@/lib/venue';

export function Header() {
  const [venueName, setVenueName] = useState<string>('Jukebox');

  useEffect(() => {
    const fetchVenueName = async () => {
      const name = await getVenueName();
      setVenueName(name);
    };
    fetchVenueName();
  }, []);

  return (
    <header className="relative z-50">
      <div className="glass border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="relative w-10 h-10 md:w-12 md:h-12"
              >
                {/* Vinyl Record Icon */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gold-400/50 shadow-lg group-hover:border-gold-400 transition-colors">
                  <div className="absolute inset-2 rounded-full border border-gray-600/30" />
                  <div className="absolute inset-4 rounded-full border border-gray-600/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gold-400" />
                  </div>
                </div>
              </motion.div>
              <div>
                <h1 
                  className="text-xl md:text-2xl font-bold gradient-text"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {venueName} Jukebox
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Community Music Queue</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:text-gold-400 hover:bg-gold-400/10 transition-all duration-200"
              >
                Queue
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

