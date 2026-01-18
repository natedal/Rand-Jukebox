# Step-by-Step Setup Guide

## ✅ Step 1: Dependencies Installed
Done! Frontend and backend dependencies are installed.

---

## 📝 Step 2: Create Environment Files

### Backend Environment File

Create `backend/.env` file with these contents:

```bash
# Database (PostgreSQL) - See Step 3
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis - See Step 4
REDIS_URL=redis://user:password@host:6379

# Spotify API - See Step 5
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_refresh_token_here

# JWT Secret (use the generated one below)
JWT_SECRET=SrUFx9xRbJLJ414QWJmI1CyQjqb732gR1XeD8vyVOhk=

# Venue Configuration
VENUE_SLUG=rand
VENUE_NAME=Rand Dining Hall

# Admin Password
ADMIN_PASSWORD=randstaff

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment File

Create `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_VENUE_SLUG=rand
```

---

## 🗄️ Step 3: Set Up PostgreSQL Database

You have **3 options**:

### Option A: Supabase (Easiest - Free Tier Available)

1. Go to https://supabase.com
2. Sign up/login
3. Click "New Project"
4. Fill in:
   - Name: `rand-jukebox`
   - Database Password: (choose a strong password)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)
6. Go to **Settings** → **Database**
7. Copy the **Connection string** (URI format)
8. Paste it into `backend/.env` as `DATABASE_URL`

**Example:**
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Option B: Railway (Simple - Free Trial)

1. Go to https://railway.app
2. Sign up/login
3. Click "New Project"
4. Click "Provision PostgreSQL"
5. Click on the PostgreSQL service
6. Go to **Variables** tab
7. Copy the `DATABASE_URL` value
8. Paste it into `backend/.env`

### Option C: Neon (Free Tier Available)

1. Go to https://neon.tech
2. Sign up/login
3. Create new project
4. Copy connection string
5. Paste into `backend/.env`

---

## 🔴 Step 4: Set Up Redis

You have **2 options**:

### Option A: Upstash (Easiest - Free Tier)

1. Go to https://upstash.com
2. Sign up/login
3. Click "Create Database"
4. Choose:
   - Name: `rand-jukebox`
   - Type: Regional (or Global)
   - Region: Choose closest
5. Click "Create"
6. Copy the **REST URL** (looks like `redis://...`)
7. Paste it into `backend/.env` as `REDIS_URL`

**Example:**
```
REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379
```

### Option B: Railway

1. In Railway project, click "New"
2. Select "Redis"
3. Copy connection URL
4. Paste into `backend/.env`

### Option C: Local Redis (if you want to install locally)

```bash
# macOS
brew install redis
brew services start redis

# Then use:
REDIS_URL=redis://localhost:6379
```

---

## 🎵 Step 5: Set Up Spotify API

### Part A: Create Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in:
   - **App name**: `Rand Jukebox`
   - **App description**: `Music queue for Rand Dining Hall`
   - **Redirect URI**: `http://localhost:3000/api/spotify/callback`
   - Check **"I understand and agree..."**
5. Click **"Save"**
6. Copy your **Client ID** and **Client Secret**
7. Paste them into `backend/.env`:
   - `SPOTIFY_CLIENT_ID=your_client_id`
   - `SPOTIFY_CLIENT_SECRET=your_client_secret`

### Part B: Get Refresh Token (For Premium Account)

**You need a Spotify Premium account for playback!**

#### Method 1: Using Browser (Easiest)

1. Replace `YOUR_CLIENT_ID` in this URL with your actual Client ID:
```
https://accounts.spotify.com/authorize?client_id=5e8e29f98a47471ca0c91dc06fbaf5c2&response_type=code&redirect_uri=http://127.0.0.1:3000/api/spotify/callback&scope=user-modify-playback-state%20user-read-playback-state
```

2. Open that URL in your browser
3. Log in and authorize
4. You'll be redirected to `http://127.0.0.1:3000/api/spotify/callback?code=XXXXX`
5. Copy the `code` value from the URL

6. Run this command (replace YOUR_CODE, YOUR_CLIENT_ID, YOUR_CLIENT_SECRET):
```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost:3000/api/spotify/callback" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"
```

7. Copy the `refresh_token` from the response
8. Paste it into `backend/.env` as `SPOTIFY_PREMIUM_REFRESH_TOKEN`

#### Method 2: Using Postman

1. Create a POST request to `https://accounts.spotify.com/api/token`
2. Set headers:
   - `Content-Type: application/x-www-form-urlencoded`
   - `Authorization: Basic [base64 of CLIENT_ID:CLIENT_SECRET]`
3. Body (x-www-form-urlencoded):
   - `grant_type`: `authorization_code`
   - `code`: `[code from step 4]`
   - `redirect_uri`: `http://localhost:3000/api/spotify/callback`
4. Send request and copy `refresh_token`

---

## 🚀 Step 6: Run the Application

### Terminal 1 - Start Backend

```bash
cd "/Users/natenate/Rand Jukebox/backend"
npm run dev
```

You should see:
```
✅ Database connected
✅ Redis connected
🚀 Server running on port 3001
```

### Terminal 2 - Start Frontend

```bash
cd "/Users/natenate/Rand Jukebox"
npm run dev
```

You should see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

---

## ✅ Step 7: Test the Application

1. **Open Frontend**: http://localhost:3000
2. **Search for a song**: Type in the search bar
3. **Add to queue**: Click "Add" on a song
4. **Vote**: Click upvote/downvote buttons
5. **Check Admin**: Go to http://localhost:3000/admin
   - Password: `randstaff`
   - Try play/pause/skip buttons

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Database not initialized"**
- Check `DATABASE_URL` is correct
- Make sure database is accessible
- Try connecting with `psql` to verify

**Error: "Redis not initialized"**
- Check `REDIS_URL` is correct
- Verify Redis is accessible

**Error: "Port 3001 already in use"**
- Change `PORT` in `backend/.env` to another port (e.g., 3002)
- Update `NEXT_PUBLIC_API_URL` in `.env.local` to match

### Frontend can't connect

**Error: "Failed to fetch"**
- Make sure backend is running
- Check `NEXT_PUBLIC_API_URL` matches backend port
- Check browser console for CORS errors

### Spotify API errors

**Error: "Invalid client"**
- Double-check Client ID and Secret
- Make sure they're copied correctly (no extra spaces)

**Error: "Invalid refresh token"**
- Re-generate refresh token (see Step 5 Part B)
- Make sure you're using a Premium account

---

## 📋 Quick Checklist

- [ ] Dependencies installed (`npm install` in both folders)
- [ ] `backend/.env` file created with all variables
- [ ] `.env.local` file created in root
- [ ] PostgreSQL database set up and `DATABASE_URL` configured
- [ ] Redis set up and `REDIS_URL` configured
- [ ] Spotify app created and credentials added
- [ ] Refresh token obtained and added
- [ ] Backend running (`npm run dev` in backend folder)
- [ ] Frontend running (`npm run dev` in root folder)
- [ ] Can access http://localhost:3000
- [ ] Can search and add songs
- [ ] Admin panel works with password `randstaff`

---

## 🎉 You're Done!

Once everything is working, you can:
- Deploy to production (see `DEPLOYMENT.md`)
- Customize the venue name/slug
- Change admin password
- Set up default playlist in admin panel

Need help? Check the error messages and refer to the troubleshooting section above.



