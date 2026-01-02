import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate admin requests
 */
export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    
    if (!decoded.admin) {
      return res.status(403).json({ error: 'Not an admin token' });
    }

    // Verify venue matches (if venue is in request)
    if (req.venue && decoded.venue && decoded.venue !== req.venue.slug) {
      return res.status(403).json({ error: 'Venue mismatch' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

