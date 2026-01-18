# 🧪 Local Testing Guide - Before Deploying to Vercel

This guide walks you through testing your Rand Jukebox application locally before deploying to Vercel.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] PostgreSQL database set up (Supabase, Railway, or Neon)
- [ ] Redis instance set up (Upstash, Railway, or local)
- [ ] Spotify Developer account with Client ID, Secret, and Refresh Token
- [ ] Git repository (optional, but recommended)

---

## 🔧 Step 1: Verify Environment Files

### Backend Environment (`backend/.env`)

Check that `backend/.env` exists and has all required variables:

```bash
cd "/Users/natenate/Rand Jukebox/backend"
cat .env
```

**Required variables:**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_refresh_token
JWT_SECRET=your_secret_key_min_32_chars
VENUE_SLUG=rand
VENUE_NAME=Rand Dining Hall
ADMIN_PASSWORD=randstaff
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**If `.env` is missing or incomplete:**
1. Copy from `SETUP_GUIDE.md` template
2. Fill in your actual values
3. Make sure no trailing spaces or quotes

### Frontend Environment (`.env.local`)

Check that `.env.local` exists in the root directory:

```bash
cd "/Users/natenate/Rand Jukebox"
cat .env.local
```

**Required variables:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_VENUE_SLUG=rand
```

**If `.env.local` is missing:**
1. Create it in the root directory
2. Add the variables above
3. Make sure URLs match your backend port

---

## 📦 Step 2: Install Dependencies

### Install Backend Dependencies

```bash
cd "/Users/natenate/Rand Jukebox/backend"
npm install
```

**Expected output:**
```
added XXX packages in XXs
```

### Install Frontend Dependencies

```bash
cd "/Users/natenate/Rand Jukebox"
npm install
```

**Expected output:**
```
added XXX packages in XXs
```

---

## 🚀 Step 3: Start the Backend Server

Open **Terminal 1** and run:

```bash
cd "/Users/natenate/Rand Jukebox/backend"
npm run dev
```

**✅ Success indicators:**
```
✅ Database connected
✅ Redis connected
🚀 Server running on port 3001
📡 Socket.io ready for connections
🎵 Venue: Rand Dining Hall
```

**❌ Common errors:**

**"Database not initialized"**
- Check `DATABASE_URL` is correct
- Verify database is accessible
- Test connection: `psql $DATABASE_URL` (if psql installed)

**"Redis not initialized"**
- Check `REDIS_URL` is correct
- Verify Redis instance is running
- For Upstash: Make sure URL includes password

**"Port 3001 already in use"**
- Change `PORT` in `backend/.env` to another port (e.g., 3002)
- Update `NEXT_PUBLIC_API_URL` in `.env.local` to match

**"Cannot find module"**
- Run `npm install` in backend directory
- Check `package.json` has all dependencies

---

## 🌐 Step 4: Start the Frontend Server

Open **Terminal 2** (keep backend running) and run:

```bash
cd "/Users/natenate/Rand Jukebox"
npm run dev
```

**✅ Success indicators:**
```
✓ Ready in X seconds
○ Local:        http://localhost:3000
```

**❌ Common errors:**

**"Port 3000 already in use"**
- Kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```
- Or change Next.js port:
  ```bash
  npm run dev -- -p 3002
  ```

**"Failed to compile"**
- Check TypeScript errors
- Run `npm run build` to see all errors
- Fix any type errors before continuing

**"Cannot connect to backend"**
- Make sure backend is running
- Check `NEXT_PUBLIC_API_URL` matches backend port
- Check browser console for CORS errors

---

## ✅ Step 5: Test the Application

### 5.1 Open the Application

1. Open browser: **http://localhost:3000**
2. You should see the Rand Jukebox homepage
3. Check browser console (F12) for any errors

### 5.2 Test Song Search

1. **Type a song name** in the search bar
2. **Wait for results** to appear
3. **Verify results** show:
   - Album art
   - Song title
   - Artist name
   - Duration

**Expected:** Results appear within 1-2 seconds

**If no results:**
- Check backend terminal for errors
- Verify Spotify API credentials in `backend/.env`
- Check browser console for API errors

### 5.3 Test Adding Songs to Queue

1. **Click "Add"** on a song
2. **Verify song appears** in the queue list
3. **Check position** - should be at bottom initially

**Expected:** Song appears immediately in queue

**If song doesn't appear:**
- Check backend terminal for errors
- Verify database connection
- Check browser console for errors
- Try refreshing the page

### 5.4 Test Voting

1. **Click upvote** (↑) on a song
2. **Verify vote count** increases
3. **Click downvote** (↓) on a song
4. **Verify vote count** decreases

**Expected:** Votes update immediately

**If votes don't update:**
- Check Socket.io connection (browser console)
- Verify Redis connection
- Check backend terminal for errors

### 5.5 Test Real-time Updates

1. **Open two browser windows** side-by-side
2. **Add a song** in window 1
3. **Verify song appears** in window 2 automatically

**Expected:** Changes sync in real-time via Socket.io

**If not syncing:**
- Check Socket.io connection status
- Verify `NEXT_PUBLIC_SOCKET_URL` is correct
- Check backend terminal for Socket.io errors

### 5.6 Test Admin Panel

1. **Navigate to:** http://localhost:3000/admin
2. **Enter password:** `randstaff`
3. **Click "Login"**

**Expected:** Admin dashboard loads

**Admin Panel Tests:**

**A. Playback Controls**
- [ ] Click **Play** button - should start playback
- [ ] Click **Pause** button - should pause playback
- [ ] Click **Skip** button - should skip to next song

**B. Queue Management**
- [ ] Toggle "Requests Enabled" - should enable/disable queue
- [ ] Click "Clear Queue" - should remove all songs
- [ ] Remove individual songs - should remove from queue
- [ ] Move songs up/down - should reorder queue

**C. Search & Add**
- [ ] Search for songs in admin search bar
- [ ] Add songs directly to queue (bypasses limit)

**D. Statistics**
- [ ] Verify stats display correctly:
  - Songs played today
  - Active users
  - Total votes
  - Queue length

**If admin panel doesn't work:**
- Check backend terminal for authentication errors
- Verify `JWT_SECRET` is set in `backend/.env`
- Check browser console for errors
- Verify admin password is correct

### 5.7 Test Spotify Connection

1. **In admin panel**, find "Spotify Connection" section
2. **Click "Connect to Spotify"** (if not connected)
3. **Authorize** the app
4. **Verify connection** status shows "Connected"

**Expected:** Spotify connection works and shows device status

**If Spotify doesn't connect:**
- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
- Check `SPOTIFY_REDIRECT_URI` matches Spotify dashboard
- Verify refresh token is valid
- Check backend terminal for Spotify API errors

### 5.8 Test Device Selection

1. **In admin panel**, find "Device Selector"
2. **Select a device** from dropdown
3. **Verify device** is selected

**Expected:** Can select and switch between Spotify devices

---

## 🔍 Step 6: Check for Errors

### Backend Terminal

Look for:
- ❌ Any red error messages
- ⚠️ Warning messages (usually OK)
- ✅ Success messages for database/Redis connections

### Frontend Browser Console

1. **Open DevTools** (F12)
2. **Check Console tab** for:
   - Red errors
   - Failed API calls
   - Socket.io connection issues

### Network Tab

1. **Open DevTools** → **Network tab**
2. **Refresh page**
3. **Check for:**
   - Failed requests (red)
   - Slow requests (>1 second)
   - CORS errors

---

## 🧹 Step 7: Test Edge Cases

### Test Daily Limit

1. **Add a song** to queue
2. **Try to add another song** (same browser)
3. **Expected:** Should show "You've already requested a song today"

### Test Queue When Disabled

1. **In admin panel**, disable requests
2. **Try to add song** from main page
3. **Expected:** Should show "Queue is currently disabled"

### Test Empty Queue

1. **Clear all songs** from queue
2. **Verify** "Queue is empty" message appears
3. **Add a song** - should work normally

### Test Long Song Titles

1. **Search for song** with very long title
2. **Add to queue**
3. **Verify** title truncates properly (no layout break)

---

## 📊 Step 8: Performance Check

### Page Load Time

1. **Open DevTools** → **Network tab**
2. **Refresh page** (Cmd+Shift+R or Ctrl+Shift+R)
3. **Check load time** - should be < 3 seconds

### API Response Times

1. **Open DevTools** → **Network tab**
2. **Perform actions** (search, add song, vote)
3. **Check response times** - should be < 500ms

### Socket.io Latency

1. **Open two windows**
2. **Add song in window 1**
3. **Time how long** it takes to appear in window 2
4. **Expected:** < 1 second

---

## ✅ Step 9: Pre-Deployment Checklist

Before deploying to Vercel, verify:

### Code Quality
- [ ] **Build succeeds:** `npm run build` completes without errors
- [ ] **No TypeScript errors:** All types are correct
- [ ] **No linting errors:** `npm run lint` passes
- [ ] **No console errors:** Browser console is clean

### Functionality
- [ ] **Search works:** Can find songs
- [ ] **Add to queue works:** Songs appear in queue
- [ ] **Voting works:** Votes update correctly
- [ ] **Real-time sync works:** Changes appear in multiple windows
- [ ] **Admin panel works:** All controls function
- [ ] **Spotify connection works:** Can connect and control playback

### Environment Variables
- [ ] **Backend `.env`** has all required variables
- [ ] **Frontend `.env.local`** has all required variables
- [ ] **Production URLs prepared:** Know what URLs you'll use for production

### Database & Services
- [ ] **Database accessible:** Can connect from local machine
- [ ] **Redis accessible:** Can connect from local machine
- [ ] **Spotify API working:** Can search and control playback

### Security
- [ ] **Admin password changed:** Not using default `randstaff`
- [ ] **JWT_SECRET is strong:** 32+ random characters
- [ ] **No secrets in code:** All secrets in environment variables

---

## 🚀 Step 10: Ready for Deployment

Once all tests pass:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Prepare production environment variables:**
   - Backend: Update `FRONTEND_URL` to your Vercel URL
   - Frontend: Update `NEXT_PUBLIC_API_URL` to your backend URL

3. **Deploy backend first** (Railway, Render, etc.)
   - Use production environment variables
   - Verify backend is accessible

4. **Deploy frontend to Vercel:**
   - Connect GitHub repository
   - Add environment variables
   - Deploy!

5. **Test production:**
   - Visit your Vercel URL
   - Run through all tests again
   - Verify everything works

---

## 🐛 Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify database and Redis are accessible
- Check port isn't already in use

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` matches backend port
- Check CORS settings in backend
- Verify backend is running

### Songs don't appear
- Check database connection
- Verify Spotify API credentials
- Check backend logs for errors

### Real-time updates don't work
- Verify Socket.io is running
- Check `NEXT_PUBLIC_SOCKET_URL` is correct
- Check browser console for connection errors

### Admin panel doesn't work
- Verify JWT_SECRET is set
- Check admin password is correct
- Check backend authentication logs

---

## 📝 Quick Test Script

Run this quick test sequence:

1. ✅ Open http://localhost:3000
2. ✅ Search for "Bohemian Rhapsody"
3. ✅ Add song to queue
4. ✅ Upvote the song
5. ✅ Open http://localhost:3000/admin
6. ✅ Login with `randstaff`
7. ✅ Click Play button
8. ✅ Verify song plays (if Spotify connected)

If all steps work, you're ready to deploy! 🎉

---

## 🆘 Need Help?

- Check `SETUP_GUIDE.md` for setup instructions
- Check `DEPLOYMENT.md` for deployment guide
- Review backend terminal logs
- Check browser console for errors
- Verify all environment variables are set correctly



