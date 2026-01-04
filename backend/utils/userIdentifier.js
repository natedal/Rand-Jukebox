import crypto from 'crypto';

/**
 * Generate a stable user identifier from request
 * Uses IP + User-Agent hash as fallback
 * In production, use browser fingerprinting on frontend
 */
export function getUserIdentifier(req) {
  // Check if frontend sent fingerprint
  const fingerprint = req.headers['x-user-identifier'];
  if (fingerprint) {
    return fingerprint;
  }

  // Fallback: hash IP + User-Agent
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const combined = `${ip}:${userAgent}`;
  
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);
}

/**
 * Get username from request headers
 * Returns username if provided, otherwise returns null
 */
export function getUsername(req) {
  return req.headers['x-user-username'] || null;
}

/**
 * Hash a string (for consistent user identifiers)
 */
export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 32);
}

