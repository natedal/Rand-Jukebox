/**
 * Get venue slug from current context
 * Supports multiple strategies:
 * 1. Subdomain (e.g., cafemogador.jukebox.com)
 * 2. Path (e.g., /cafemogador)
 * 3. Environment variable (fallback)
 */
export function getVenueSlug(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_VENUE_SLUG || 'rand';
  }

  // Strategy 1: Subdomain (e.g., cafemogador.jukebox.com)
  const hostname = window.location.hostname;
  const hostParts = hostname.split('.');
  
  // Check if we have a subdomain (at least 3 parts: subdomain.domain.tld)
  if (hostParts.length >= 3) {
    const subdomain = hostParts[0];
    // Skip common non-venue subdomains
    if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'localhost') {
      return subdomain;
    }
  } else if (hostname.includes('localhost') && hostParts.length >= 2) {
    // Handle localhost:3000 with subdomain pattern (e.g., cafemogador.localhost:3000)
    const firstPart = hostParts[0];
    if (firstPart && firstPart !== 'localhost' && firstPart !== 'www' && firstPart !== 'api') {
      return firstPart;
    }
  }

  // Strategy 2: Path (e.g., /cafemogador)
  const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
  if (pathMatch && pathMatch[1] && 
      pathMatch[1] !== 'admin' && 
      pathMatch[1] !== 'api' && 
      pathMatch[1] !== '_next' &&
      !pathMatch[1].startsWith('_')) {
    return pathMatch[1];
  }

  // Fallback to environment variable
  return process.env.NEXT_PUBLIC_VENUE_SLUG || 'rand';
}

/**
 * Get venue name from API
 */
export async function getVenueName(slug?: string): Promise<string> {
  const venueSlug = slug || getVenueSlug();
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/venue/${venueSlug}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.venue?.name || venueSlug;
    }
  } catch (error) {
    console.error('Error fetching venue name:', error);
  }
  
  // Fallback: capitalize slug
  return venueSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

