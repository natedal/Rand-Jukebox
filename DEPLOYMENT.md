# Deployment Guide - Rand Jukebox

## Quick Start

This guide walks you through deploying the Rand Jukebox application.

## Architecture

- **Frontend**: Next.js app (deployed on Vercel)
- **Backend**: Node.js/Express API (deploy to Railway, Render, or similar)
- **Database**: PostgreSQL (managed service)
- **Cache**: Redis (managed service)
- **Real-time**: Socket.io

## Prerequisites

1. **Node.js** installed locally (for development)
2. **PostgreSQL** database (use managed service like Supabase, Railway, or Neon)
3. **Redis** instance (use managed service like Upstash or Railway)
4. **Spotify Developer Account** with:
   - Client ID and Secret
   - Premium account with refresh token

## Step 1: Set Up Spotify API

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Copy your **Client ID** and **Client Secret**
4. Set redirect URI: `http://localhost:3000/api/spotify/callback`
5. For Premium account refresh token:
   - Use Spotify's Authorization Code Flow
   - Get refresh token (see Spotify API docs)
   - Store in environment variable

## Step 2: Set Up Database

### Option A: Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database

### Option B: Railway
1. Go to https://railway.app
2. Create new PostgreSQL service
3. Copy connection string

### Option C: Neon
1. Go to https://neon.tech
2. Create new project
3. Copy connection string

## Step 3: Set Up Redis

### Option A: Upstash (Recommended)
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL

### Option B: Railway
1. Create Redis service
2. Copy connection URL

## Step 4: Backend Deployment

### Deploy to Railway

1. Push backend code to GitHub
2. Go to Railway.app
3. New Project → Deploy from GitHub
4. Select your repository
5. Add environment variables (see below)
6. Deploy!

### Deploy to Render

1. Push backend code to GitHub
2. Go to Render.com
3. New Web Service
4. Connect GitHub repo
5. Build command: `cd backend && npm install`
6. Start command: `cd backend && npm start`
7. Add environment variables

### Environment Variables for Backend

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://user:password@host:6379

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_refresh_token

# JWT Secret (generate random string)
JWT_SECRET=your_random_secret_key_min_32_chars

# Venue Configuration
VENUE_SLUG=rand
VENUE_NAME=Rand Dining Hall

# Admin Password (will be hashed on first run)
ADMIN_PASSWORD=randstaff

# Server
PORT=3001
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app
```

## Step 5: Frontend Deployment

### Deploy to Vercel

1. Push frontend code to GitHub
2. Go to vercel.com
3. Import Project → Select repository
4. Framework Preset: Next.js
5. Add environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
NEXT_PUBLIC_VENUE_SLUG=rand
```

6. Deploy!

## Step 6: Initialize Database

The backend will automatically run migrations on first start. Make sure:

1. Database is accessible
2. `DATABASE_URL` is correct
3. Backend has permission to create tables

## Step 7: Test Deployment

1. **Frontend**: Visit your Vercel URL
2. **Search**: Try searching for a song
3. **Request**: Add a song to queue
4. **Vote**: Upvote/downvote songs
5. **Admin**: Go to `/admin`, login with `randstaff`

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure database allows connections from your backend IP
- Verify SSL settings match your database provider

### Redis Connection Issues
- Check `REDIS_URL` format
- Ensure Redis allows connections
- Some providers use `rediss://` for SSL

### Spotify API Issues
- Verify Client ID and Secret
- Check refresh token is valid
- Ensure redirect URI matches Spotify dashboard

### CORS Issues
- Set `FRONTEND_URL` correctly in backend
- Check Socket.io CORS settings in `server.js`

### Socket.io Not Connecting
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend URL
- Check WebSocket support on hosting provider
- Some providers require specific Socket.io config

## Production Checklist

- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Enable SSL for database
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry, etc.)

## Environment Variables Summary

### Backend (.env)
```
DATABASE_URL
REDIS_URL
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_PREMIUM_REFRESH_TOKEN
JWT_SECRET
VENUE_SLUG
VENUE_NAME
ADMIN_PASSWORD
PORT
NODE_ENV
FRONTEND_URL
```

### Frontend (Vercel Environment Variables)
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SOCKET_URL
NEXT_PUBLIC_VENUE_SLUG
```

## Support

For issues, check:
1. Backend logs (Railway/Render dashboard)
2. Frontend logs (Vercel dashboard)
3. Database logs
4. Redis logs

