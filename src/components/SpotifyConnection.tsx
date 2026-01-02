'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

export function SpotifyConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Checking Spotify connection status...');
      const response = await adminApi.getSpotifyStatus();
      console.log('✅ Spotify status response:', response.data);
      const wasConnected = isConnected;
      setIsConnected(response.data.connected);
      
      if (response.data.connected) {
        console.log('✅✅✅ Spotify is CONNECTED!');
        // If we just connected, remove the query param now
        if (searchParams?.get('spotify_connected') === 'true') {
          setTimeout(() => {
            router.replace('/admin');
          }, 1000);
        }
      } else {
        console.warn('⚠️ Spotify status check returned connected: false');
        if (wasConnected) {
          console.warn('⚠️ Connection was lost!');
        }
      }
    } catch (error: any) {
      console.error('❌ Error checking Spotify status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, searchParams, router]);

  useEffect(() => {
    // Check for OAuth callback parameters first
    const connected = searchParams?.get('spotify_connected');
    const error = searchParams?.get('spotify_error');
    
    if (connected === 'true') {
      console.log('✅ Spotify connected param detected, refreshing status...');
      setIsConnecting(false);
      // Wait longer for backend to save token, then check status
      // Increased delay to ensure backend has processed the callback
      setTimeout(() => {
        console.log('Checking connection status after OAuth callback...');
        checkConnection();
      }, 2000); // Increased from 500ms to 2 seconds
      // Don't remove query param immediately - wait to see if it worked
      // Remove it after status check completes
    } else if (error) {
      console.error('❌ Spotify connection error:', error);
      const errorDetails = searchParams?.get('msg') || searchParams?.get('details');
      if (errorDetails) {
        console.error('Error details:', decodeURIComponent(errorDetails));
      }
      setIsConnecting(false);
      setIsConnected(false);
      // Remove error param from URL after a delay
      setTimeout(() => {
        router.replace('/admin');
      }, 3000);
    } else {
      // Normal status check
      checkConnection();
    }
  }, [searchParams, router, checkConnection]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('Requesting Spotify auth URL...');
      const response = await adminApi.getSpotifyAuthUrl();
      console.log('Received auth URL:', response.data.auth_url);
      // Extract redirect_uri from auth URL to verify it matches Spotify settings
      const authUrl = new URL(response.data.auth_url);
      const redirectUri = authUrl.searchParams.get('redirect_uri');
      console.log('Redirect URI being sent to Spotify:', redirectUri);
      console.log('Make sure this exact URI is registered in Spotify Developer Dashboard!');
      // Redirect to Spotify OAuth
      window.location.href = response.data.auth_url;
    } catch (error: any) {
      console.error('Error initiating Spotify connection:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to connect Spotify account');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Spotify account? Playback will not work until you reconnect.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await adminApi.disconnectSpotify();
      setIsConnected(false);
      // Also clear selected device from state if needed
    } catch (error: any) {
      console.error('Error disconnecting Spotify:', error);
      alert(error.response?.data?.error || 'Failed to disconnect Spotify account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        Spotify Account
      </h3>

      {isLoading ? (
        <div className="text-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full mx-auto"
          />
        </div>
      ) : isConnected ? (
        <div>
          <div className="flex items-center gap-2 text-green-400 mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Connected</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Your Spotify Premium account is connected. Playback is enabled.
          </p>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkConnection}
              className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
            >
              Refresh Status
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDisconnect}
              disabled={isLoading}
              className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </motion.button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-400 mb-4">
            Connect your Spotify Premium account to enable music playback. You&apos;ll be redirected to Spotify to authorize the connection.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full px-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </motion.svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span>Connect Spotify Account</span>
              </>
            )}
          </motion.button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Requires Spotify Premium. The connection is secure and only stores a refresh token.
          </p>
        </div>
      )}
    </div>
  );
}

