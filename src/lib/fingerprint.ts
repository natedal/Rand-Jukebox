import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<Awaited<ReturnType<typeof FingerprintJS.load>>> | null = null;

export async function getUserIdentifier(): Promise<string> {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user_identifier');
    if (stored) {
      return stored;
    }
  }

  // Generate fingerprint
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  const fp = await fpPromise;
  const result = await fp.get();
  
  // Use visitorId as identifier
  const identifier = result.visitorId;
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_identifier', identifier);
  }
  
  return identifier;
}

/**
 * Get username from localStorage
 * Returns null if username is not set
 */
export function getUsername(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('user_username');
}

/**
 * Check if username is set
 */
export function hasUsername(): boolean {
  return getUsername() !== null;
}

