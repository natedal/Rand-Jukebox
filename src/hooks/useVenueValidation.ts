import { useState, useEffect } from 'react';
import { getVenueSlug } from '@/lib/venue';

/**
 * Normalize API URL to ensure it's absolute with protocol
 */
function normalizeApiUrl(url: string | undefined): string {
  if (!url) {
    return 'http://localhost:3001';
  }
  
  // Remove trailing slashes
  url = url.trim().replace(/\/+$/, '');
  
  // If it doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//)) {
    // If it's localhost, use http, otherwise use https
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  
  return url;
}

interface VenueValidationResult {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  venueSlug: string;
}

/**
 * Hook to validate if a venue exists
 * Checks venue existence by calling /api/venue/:slug
 * Caches result to avoid repeated API calls
 */
export function useVenueValidation(): VenueValidationResult {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [venueSlug, setVenueSlug] = useState<string>('');

  useEffect(() => {
    // Skip validation on server-side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      setIsValid(true); // Assume valid on server to prevent hydration issues
      return;
    }

    const validateVenue = async () => {
      const slug = getVenueSlug();
      setVenueSlug(slug);

      // Skip validation for localhost/Vercel domains (use env var fallback)
      const hostname = window.location.hostname;
      const isVercelDomain = hostname.endsWith('.vercel.app');
      const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
      
      if (isVercelDomain || isLocalhost) {
        // For Vercel/localhost, assume valid (uses env var fallback)
        setIsValid(true);
        setIsLoading(false);
        return;
      }

      try {
        const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
        const response = await fetch(`${API_URL}/api/venue/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          setIsValid(false);
          setError('Venue not found');
        } else if (response.ok) {
          setIsValid(true);
          setError(null);
        } else {
          // Other errors (500, etc.)
          setIsValid(false);
          setError('Failed to validate venue');
        }
      } catch (err: any) {
        // Network errors, timeouts, etc.
        console.error('Error validating venue:', err);
        setIsValid(false);
        setError(err.message || 'Network error while validating venue');
      } finally {
        setIsLoading(false);
      }
    };

    validateVenue();
  }, []); // Only run once on mount

  return { isValid, isLoading, error, venueSlug };
}



