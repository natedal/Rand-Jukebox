# Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Set Up Environment Variables

#### Backend (`backend/.env`)

Create `backend/.env` file:

```bash
# Database (get from Supabase/Railway/Neon)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis (get from Upstash/Railway)
REDIS_URL=redis://user:password@host:6379

# Spotify API (get from https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_refresh_token

# JWT Secret (generate random string, min 32 chars)
JWT_SECRET=your_random_secret_key_change_this

# Venue Configuration
VENUE_SLUG=rand
VENUE_NAME=Rand Dining Hall

# Admin Password (default: randstaff)
ADMIN_PASSWORD=randstaff

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`.env.local`)

Create `.env.local` file in root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_VENUE_SLUG=rand
```

### 3. Set Up Database

The backend will automatically create tables on first run. Just make sure:

1. PostgreSQL is running
2. `DATABASE_URL` is correct
3. Database exists (create empty database first)

### 4. Set Up Redis

Make sure Redis is running:

```bash
# Local Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 6. Access the App

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Admin Password**: `randstaff`

## Getting Spotify Credentials

### 1. Create Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in:
   - App name: "Rand Jukebox"
   - Description: "Music queue for Rand Dining Hall"
   - Redirect URI: `http://localhost:3000/api/spotify/callback`
5. Save Client ID and Client Secret

### 2. Get Refresh Token (for Premium Account)

**Option A: Use Spotify's Authorization Code Flow**

1. Visit this URL (replace `YOUR_CLIENT_ID`):
```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/api/spotify/callback&scope=user-modify-playback-state%20user-read-playback-state
```

2. Authorize the app
3. Copy the `code` from the redirect URL
4. Exchange code for refresh token:

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost:3000/api/spotify/callback" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"
```

5. Copy the `refresh_token` from the response

**Option B: Use a tool like Postman**

Follow Spotify's Authorization Code Flow guide.

## Testing

### Test User Flow

1. Open http://localhost:3000
2. Search for a song
3. Click "Add" to request it
4. Upvote/downvote songs
5. Check that queue updates in real-time

### Test Admin Flow

1. Go to http://localhost:3000/admin
2. Enter password: `randstaff`
3. Click "Play" to start playback
4. Click "Skip" to skip songs
5. Toggle queue on/off
6. Clear queue

## Troubleshooting

### Backend won't start

- Check all environment variables are set
- Verify database connection
- Verify Redis connection
- Check port 3001 is available

### Frontend can't connect to backend

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running on port 3001
- Check CORS settings in backend

### Database errors

- Ensure PostgreSQL is running
- Check `DATABASE_URL` format
- Verify database exists
- Check user has CREATE TABLE permissions

### Redis errors

- Ensure Redis is running
- Check `REDIS_URL` format
- Verify Redis allows connections

### Spotify API errors

- Verify Client ID and Secret
- Check refresh token is valid
- Ensure Premium account is active

## Next Steps

1. Deploy backend to Railway/Render
2. Deploy frontend to Vercel
3. Set up production environment variables
4. Configure custom domain (optional)

See `DEPLOYMENT.md` for production deployment guide.

