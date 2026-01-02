import { getVenueId } from '../utils/queue.js';

/**
 * Middleware to extract venue from request and attach to req.venue
 * Supports multiple strategies:
 * 1. Subdomain (e.g., cafemogador.jukebox.com)
 * 2. X-Venue-Slug header
 * 3. Query parameter (?venue=slug)
 * 4. Environment variable (fallback for backward compatibility)
 */
export async function venueMiddleware(req, res, next) {
  let venueSlug;
  
  // Strategy 1: Header (e.g., X-Venue-Slug: cafemogador) - PRIORITY
  // Check header first since frontend explicitly sends it
  if (req.headers['x-venue-slug']) {
    venueSlug = req.headers['x-venue-slug'];
  }
  
  // Strategy 2: Subdomain (e.g., cafemogador.jukebox.com)
  // Only check subdomain if header wasn't provided
  if (!venueSlug) {
    const host = req.headers.host || '';
    const hostParts = host.split('.');
    
    // Skip Railway domains (up.railway.app) and other hosting platforms
    const isRailwayDomain = host.includes('.railway.app') || host.includes('.up.railway.app');
    const isVercelDomain = host.includes('.vercel.app');
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    // Only check subdomain for custom domains (not hosting platform domains)
    if (!isRailwayDomain && !isVercelDomain && !isLocalhost) {
      // Check if we have a subdomain (at least 3 parts: subdomain.domain.tld)
      if (hostParts.length >= 3) {
        const subdomain = hostParts[0];
        // Skip common non-venue subdomains
        if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'localhost') {
          venueSlug = subdomain;
        }
      }
    } else if (isLocalhost && hostParts.length >= 2) {
      // Handle localhost:3000 with subdomain pattern
      const firstPart = hostParts[0];
      if (firstPart && firstPart !== 'localhost' && firstPart !== 'www' && firstPart !== 'api') {
        venueSlug = firstPart;
      }
    }
  }
  
  
  // Strategy 3: Query parameter (e.g., ?venue=cafemogador)
  if (!venueSlug && req.query.venue) {
    venueSlug = req.query.venue;
  }
  
  // Strategy 4: Path parameter (e.g., /api/venue/cafemogador/queue)
  if (!venueSlug && req.params.venue_slug) {
    venueSlug = req.params.venue_slug;
  }
  
  // Fallback to environment variable (for backward compatibility)
  if (!venueSlug) {
    venueSlug = process.env.VENUE_SLUG || 'rand';
  }
  
  try {
    const venueId = await getVenueId(venueSlug);
    req.venue = {
      id: venueId,
      slug: venueSlug,
    };
    next();
  } catch (error) {
    res.status(404).json({ error: `Venue not found: ${venueSlug}` });
  }
}

