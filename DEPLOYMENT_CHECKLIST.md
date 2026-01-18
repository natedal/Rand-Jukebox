# 📋 Deployment Checklist - Quick Reference

Use this checklist to gather all values before deploying.

## Before You Start

### 1. Gather Your Values

Open `backend/.env` and copy these values:

**Spotify API:**
- [ ] `SPOTIFY_CLIENT_ID` = _______________________
- [ ] `SPOTIFY_CLIENT_SECRET` = _______________________
- [ ] `SPOTIFY_PREMIUM_REFRESH_TOKEN` = _______________________

**Security:**
- [ ] `JWT_SECRET` = _______________________ (or generate new: `openssl rand -base64 32`)

**Venue:**
- [ ] `VENUE_SLUG` = `rand`
- [ ] `VENUE_NAME` = `Rand Dining Hall`
- [ ] `ADMIN_PASSWORD` = `randstaff` (or your choice)

**Frontend URL:**
- [ ] Your Vercel URL = `https://rand-jukebox.vercel.app` (or your actual URL)

---

## Railway Deployment Steps

### Step 1: Create Account
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Authorize Railway

### Step 2: Create Database
- [ ] New Project → New → Database → PostgreSQL
- [ ] Copy `DATABASE_URL` = _______________________

### Step 3: Create Redis
- [ ] New → Database → Redis
- [ ] Copy `REDIS_URL` = _______________________

### Step 4: Deploy Backend
- [ ] New → GitHub Repo → Select `natedal/Rand-Jukebox`
- [ ] Settings → Root Directory: `backend`
- [ ] Settings → Start Command: `npm start`

### Step 5: Add Environment Variables

In Railway → Backend Service → Variables, add:

**From Railway (auto-added):**
- [ ] `DATABASE_URL` (already there)
- [ ] `REDIS_URL` (already there)

**From your .env file:**
- [ ] `SPOTIFY_CLIENT_ID`
- [ ] `SPOTIFY_CLIENT_SECRET`
- [ ] `SPOTIFY_REDIRECT_URI` = `https://rand-jukebox.vercel.app/api/spotify/callback`
- [ ] `SPOTIFY_PREMIUM_REFRESH_TOKEN`
- [ ] `JWT_SECRET`
- [ ] `VENUE_SLUG` = `rand`
- [ ] `VENUE_NAME` = `Rand Dining Hall`
- [ ] `ADMIN_PASSWORD` = `randstaff`
- [ ] `NODE_ENV` = `production`
- [ ] `FRONTEND_URL` = `https://rand-jukebox.vercel.app`

### Step 6: Get Backend URL
- [ ] Settings → Networking → Generate Domain
- [ ] Copy backend URL = _______________________
- [ ] Test: Visit `https://your-backend-url.railway.app/health`
- [ ] Should see: `{"status":"ok"}`

### Step 7: Update Vercel
- [ ] Go to Vercel → Project → Settings → Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app`
- [ ] `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-url.railway.app`
- [ ] `NEXT_PUBLIC_VENUE_SLUG` = `rand`
- [ ] Redeploy Vercel app

### Step 8: Test
- [ ] Visit Vercel URL
- [ ] Check browser console (F12) - should see "Socket connected"
- [ ] Try searching for a song
- [ ] Try admin login at `/admin`

---

## Quick Commands

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**Test Backend:**
```bash
curl https://your-backend-url.railway.app/health
```

**Check Railway Logs:**
Railway → Backend Service → Deployments → Latest → Logs

---

## Common Issues

**Backend won't start:**
- Check all environment variables are set
- Check Railway logs for errors
- Verify Root Directory is `backend`

**CORS errors:**
- Make sure `FRONTEND_URL` in Railway matches Vercel URL exactly
- No trailing slashes

**Socket.io not connecting:**
- Verify `NEXT_PUBLIC_SOCKET_URL` in Vercel matches backend URL
- Check browser console for errors

---

## You're Done When:

- ✅ Backend health check works
- ✅ Frontend connects to backend (no network errors)
- ✅ Can search for songs
- ✅ Admin login works
- ✅ Socket.io connects (check browser console)

Good luck! 🚀



