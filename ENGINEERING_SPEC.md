# Rand Jukebox - Engineering Specification

## 1. System Architecture

### Components
- **Student Web Client (React/Next.js)**: User-facing interface for browsing, searching, and voting
- **Backend API (Node.js/Express)**: RESTful API + WebSocket server for real-time updates
- **PostgreSQL**: Persistent storage for queue, users, votes, admin settings
- **Redis**: Real-time caching, session management, atomic operations
- **Spotify API**: Music search (free) and playback (Premium account)
- **Admin Panel (React)**: Staff control interface with authentication

### Multi-Tenant Design
- Each business gets a unique deployment (e.g., `rand-jukebox.vercel.app`)
- Venue-specific configuration via environment variables
- Database schema supports multiple venues (future scalability)

---

## 2. Database Schema (PostgreSQL)

### Tables

#### `venues`
```sql
id: UUID PRIMARY KEY
slug: VARCHAR(50) UNIQUE NOT NULL  -- e.g., "rand"
name: VARCHAR(255) NOT NULL
created_at: TIMESTAMP DEFAULT NOW()
```

#### `songs`
```sql
id: UUID PRIMARY KEY
venue_id: UUID REFERENCES venues(id)
spotify_id: VARCHAR(255) NOT NULL
title: VARCHAR(255) NOT NULL
artist: VARCHAR(255) NOT NULL
album: VARCHAR(255)
album_art_url: TEXT
duration_ms: INTEGER
is_explicit: BOOLEAN DEFAULT FALSE
requested_at: TIMESTAMP DEFAULT NOW()
requested_by: VARCHAR(255)  -- Anonymous user identifier (browser fingerprint or IP)
status: VARCHAR(20) DEFAULT 'queued'  -- 'queued', 'playing', 'played', 'skipped'
played_at: TIMESTAMP
```

#### `votes`
```sql
id: UUID PRIMARY KEY
song_id: UUID REFERENCES songs(id) ON DELETE CASCADE
user_identifier: VARCHAR(255) NOT NULL  -- Browser fingerprint/IP hash
created_at: TIMESTAMP DEFAULT NOW()
UNIQUE(song_id, user_identifier)  -- One vote per user per song
```

#### `user_requests`
```sql
id: UUID PRIMARY KEY
venue_id: UUID REFERENCES venues(id)
user_identifier: VARCHAR(255) NOT NULL
song_id: UUID REFERENCES songs(id)
requested_at: TIMESTAMP DEFAULT NOW()
date: DATE NOT NULL  -- For daily limit tracking
UNIQUE(venue_id, user_identifier, date, song_id)  -- Prevent duplicate requests same day
```

#### `admin_settings`
```sql
id: UUID PRIMARY KEY
venue_id: UUID REFERENCES venues(id) UNIQUE
admin_password_hash: VARCHAR(255) NOT NULL  -- bcrypt hash
default_playlist_id: VARCHAR(255)  -- Spotify playlist ID
is_playing: BOOLEAN DEFAULT FALSE
is_queue_enabled: BOOLEAN DEFAULT TRUE
current_song_id: UUID REFERENCES songs(id)
updated_at: TIMESTAMP DEFAULT NOW()
```

#### `playback_history`
```sql
id: UUID PRIMARY KEY
venue_id: UUID REFERENCES venues(id)
song_id: UUID REFERENCES songs(id)
played_at: TIMESTAMP DEFAULT NOW()
duration_played_ms: INTEGER
was_skipped: BOOLEAN DEFAULT FALSE
```

---

## 3. API Endpoints

### Public Endpoints

#### `GET /api/queue`
Returns current queue sorted by votes DESC, then requested_at DESC

**Response:**
```json
{
  "queue": [
    {
      "id": "uuid",
      "spotify_id": "spotify:track:...",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "album_art_url": "https://...",
      "duration_ms": 200000,
      "votes": 5,
      "requested_at": "2024-01-15T14:30:00Z",
      "requested_by": "user_hash",
      "status": "queued"
    }
  ],
  "current_song": { ... } | null,
  "is_playing": false,
  "queue_enabled": true
}
```

#### `POST /api/songs/search`
Search Spotify for songs

**Request:**
```json
{
  "query": "song name"
}
```

**Response:**
```json
{
  "results": [
    {
      "spotify_id": "spotify:track:...",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "album_art_url": "https://...",
      "duration_ms": 200000,
      "is_explicit": false
    }
  ]
}
```

#### `POST /api/songs/request`
Request a song to be added to queue

**Request:**
```json
{
  "spotify_id": "spotify:track:...",
  "user_identifier": "browser_fingerprint_hash"
}
```

**Response:**
```json
{
  "success": true,
  "song": { ... },
  "requests_remaining": 2
}
```

**Errors:**
- `400`: Daily limit reached (3 songs)
- `400`: Song already requested by user today
- `400`: Queue disabled

#### `POST /api/votes/upvote`
Upvote a song

**Request:**
```json
{
  "song_id": "uuid",
  "user_identifier": "browser_fingerprint_hash"
}
```

**Response:**
```json
{
  "success": true,
  "new_vote_count": 6
}
```

**Errors:**
- `400`: Already voted on this song
- `404`: Song not found

#### `POST /api/votes/downvote`
Downvote a song (remove vote)

**Request:**
```json
{
  "song_id": "uuid",
  "user_identifier": "browser_fingerprint_hash"
}
```

#### `GET /api/user/status`
Get user's current status (requests remaining, votes cast)

**Request Headers:**
```
X-User-Identifier: browser_fingerprint_hash
```

**Response:**
```json
{
  "requests_remaining": 2,
  "requests_today": 1,
  "votes_cast": 5
}
```

### Admin Endpoints (Require Authentication)

#### `POST /api/admin/login`
Admin login

**Request:**
```json
{
  "password": "randstaff"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

#### `GET /api/admin/status`
Get admin dashboard status

**Headers:**
```
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "is_playing": false,
  "queue_enabled": true,
  "current_song": { ... } | null,
  "default_playlist_id": "spotify:playlist:...",
  "queue_length": 5,
  "stats": {
    "songs_played_today": 156,
    "active_users": 89,
    "total_votes": 432
  }
}
```

#### `POST /api/admin/playback/play`
Start playback

**Response:**
```json
{
  "success": true,
  "is_playing": true
}
```

#### `POST /api/admin/playback/pause`
Pause playback

#### `POST /api/admin/playback/skip`
Skip current song, play next

**Response:**
```json
{
  "success": true,
  "next_song": { ... } | null
}
```

#### `POST /api/admin/queue/toggle`
Enable/disable queue requests

**Request:**
```json
{
  "enabled": false
}
```

#### `POST /api/admin/queue/clear`
Clear all queued songs

#### `POST /api/admin/playlist/set`
Set default playlist

**Request:**
```json
{
  "playlist_id": "spotify:playlist:..."
}
```

#### `DELETE /api/admin/songs/:id`
Remove a song from queue

---

## 4. Real-Time Updates (Socket.io)

### Socket Events

#### Client → Server

- `join:venue` - Join venue room
  ```json
  { "venue_slug": "rand" }
  ```

- `vote:up` - Upvote song
  ```json
  { "song_id": "uuid", "user_identifier": "hash" }
  ```

- `vote:down` - Downvote song

#### Server → Client

- `queue:updated` - Queue order changed
  ```json
  { "queue": [...], "current_song": {...} }
  ```

- `song:added` - New song added
  ```json
  { "song": {...}, "position": 5 }
  ```

- `song:removed` - Song removed
  ```json
  { "song_id": "uuid" }
  ```

- `playback:started` - Playback started
  ```json
  { "song": {...} }
  ```

- `playback:paused` - Playback paused

- `playback:skipped` - Song skipped
  ```json
  { "next_song": {...} }
  ```

### Socket Rooms
- `venue:rand` - All users viewing Rand's queue
- `admin:rand` - Admin panel connections

---

## 5. Queue Management Logic

### Queue Sorting Algorithm

```javascript
function sortQueue(songs) {
  return songs
    .filter(song => song.status === 'queued')
    .sort((a, b) => {
      // PRIMARY: Vote count DESC
      if (b.votes !== a.votes) {
        return b.votes - a.votes;
      }
      // SECONDARY: Newest first (tie-breaker)
      return new Date(b.requested_at) - new Date(a.requested_at);
    });
}
```

### Default Playlist Logic

**When queue is empty:**
1. Fetch 5 random songs from default playlist
2. Add them to queue with `requested_by: "system"`
3. Mark as `status: "queued"`

**When user adds song while default playing:**
1. User song added to queue normally
2. Default songs continue playing
3. After current song ends, check user queue
4. If user queue has songs, skip remaining default songs
5. Play user requests in vote order

**When admin changes default playlist:**
1. Finish current song
2. Clear remaining default songs from queue
3. Start new default playlist if queue empty

### Daily Request Limit

```javascript
// Check at request time
const today = new Date().toISOString().split('T')[0];
const requestsToday = await db.query(`
  SELECT COUNT(*) 
  FROM user_requests 
  WHERE user_identifier = $1 
    AND venue_id = $2 
    AND date = $3
`, [userIdentifier, venueId, today]);

if (requestsToday >= 3) {
  throw new Error('Daily limit reached');
}
```

---

## 6. Vote Limiting

### Database Constraint
```sql
UNIQUE(song_id, user_identifier)
```

### Application Logic
```javascript
// Check before inserting vote
const existingVote = await db.query(`
  SELECT id FROM votes 
  WHERE song_id = $1 AND user_identifier = $2
`, [songId, userIdentifier]);

if (existingVote) {
  throw new Error('Already voted on this song');
}
```

### Redis Atomic Operations
```javascript
// Use Redis WATCH/MULTI/EXEC for race condition prevention
const redis = require('redis');
const client = redis.createClient();

async function atomicVote(songId, userIdentifier) {
  const key = `vote:${songId}:${userIdentifier}`;
  
  return new Promise((resolve, reject) => {
    client.watch(key, (err) => {
      if (err) return reject(err);
      
      client.multi()
        .set(key, '1', 'EX', 86400) // 24 hour expiry
        .incr(`song:${songId}:votes`)
        .exec((err, results) => {
          if (err) return reject(err);
          if (!results) {
            // Conflict detected, retry
            return atomicVote(songId, userIdentifier);
          }
          resolve(results);
        });
    });
  });
}
```

---

## 7. Spotify API Integration

### Configuration

**Environment Variables:**
```bash
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_refresh_token
```

### Endpoints

#### Search (Free API)
```javascript
// GET /api/songs/search?q=query
// Uses client credentials flow (no user auth needed)
```

#### Playback (Premium Account)
```javascript
// POST /api/admin/playback/play
// Uses refresh token flow
// Requires Premium account
```

### Playback Flow

1. Admin clicks "Play" in admin panel
2. Backend gets current song from queue
3. Backend calls Spotify API to play song
4. Backend updates `current_song_id` in database
5. Backend emits `playback:started` via Socket.io
6. When song ends (polling or webhook), move to next song

---

## 8. User Identification

### Browser Fingerprinting
```javascript
// Generate stable user identifier
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();
const userIdentifier = hash(result.visitorId); // SHA-256 hash
```

### Fallback: IP + User Agent Hash
```javascript
const userIdentifier = hash(
  req.ip + req.headers['user-agent']
);
```

---

## 9. Admin Authentication

### Password: `randstaff` (temporary)

**Implementation:**
```javascript
// Hash password with bcrypt
const bcrypt = require('bcrypt');
const passwordHash = await bcrypt.hash('randstaff', 10);

// Verify on login
const isValid = await bcrypt.compare(password, passwordHash);
if (isValid) {
  // Generate JWT token
  const token = jwt.sign({ admin: true, venue: 'rand' }, SECRET);
}
```

### JWT Token
- Expires in 24 hours
- Stored in HTTP-only cookie or localStorage
- Required for all `/api/admin/*` endpoints

---

## 10. Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rand_jukebox

# Redis
REDIS_URL=redis://localhost:6379

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_premium_refresh_token

# JWT Secret
JWT_SECRET=your_random_secret_key

# Venue Configuration
VENUE_SLUG=rand
VENUE_NAME=Rand Dining Hall

# Admin Password (bcrypt hash)
ADMIN_PASSWORD_HASH=$2b$10$... (generated hash of "randstaff")

# Server
PORT=3001
NODE_ENV=development
```

### Where to Set

**Local Development:**
- Create `.env.local` file in project root

**Vercel Deployment:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add each variable for Production, Preview, and Development

---

## 11. Frontend Updates

### User Identification
- Generate fingerprint on page load
- Store in localStorage
- Send with all API requests as `X-User-Identifier` header

### Real-Time Updates
- Connect to Socket.io server
- Join venue room on mount
- Listen for `queue:updated`, `song:added`, `playback:*` events
- Update UI optimistically, sync with server state

### Admin Panel
- Password prompt modal on `/admin` route
- Store JWT token in localStorage
- Include in `Authorization` header for admin requests

---

## 12. Deployment Architecture

### Frontend (Vercel)
- Next.js app
- Static + API routes
- Environment variables via Vercel dashboard

### Backend (Separate Server/Railway/Render)
- Express API server
- Socket.io server
- PostgreSQL database (managed service)
- Redis instance (managed service)

### Alternative: Monorepo on Vercel
- Frontend: Next.js API routes proxy to backend
- Backend: Separate Express server (can deploy to Railway/Render)
- Or: Use Vercel Serverless Functions for API routes

---

## 13. Race Condition Handling

### Vote Updates
1. Use Redis WATCH/MULTI/EXEC for atomic operations
2. Optimistic updates on frontend
3. Server state always wins
4. Broadcast corrected state via Socket.io

### Queue Modifications
1. PostgreSQL transactions for song additions
2. Lock queue during sorting
3. Emit updates after transaction commits

### Concurrent Requests
1. Rate limiting per user identifier
2. Queue operations serialized via Redis
3. Database constraints prevent duplicates

---

## 14. Testing Checklist

- [ ] User can search for songs
- [ ] User can request song (3 per day limit)
- [ ] User can vote (1 vote per song)
- [ ] Queue sorts correctly (votes DESC, newest first)
- [ ] Real-time updates work (multiple browsers)
- [ ] Admin can login with password
- [ ] Admin can play/pause/skip
- [ ] Admin can set default playlist
- [ ] Default playlist auto-fills when queue empty
- [ ] Daily limits reset at midnight
- [ ] Duplicate songs allowed
- [ ] Race conditions handled correctly

---

## 15. Future Enhancements

- [ ] Multiple platform support (YouTube, SoundCloud)
- [ ] User accounts (optional)
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Playlist management UI
- [ ] Song history/reports
- [ ] Custom branding per venue

