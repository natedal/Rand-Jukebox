# 🚀 Backend Deployment Guide - Railway

This guide walks you through deploying your Rand Jukebox backend to Railway step-by-step.

## Prerequisites

Before starting, make sure you have:
- ✅ GitHub account (your code is already on GitHub)
- ✅ Spotify Developer account with Client ID, Secret, and Refresh Token
- ✅ About 15-20 minutes

---

## Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with **GitHub** (recommended - easiest)
4. Authorize Railway to access your GitHub repositories

---

## Step 2: Create PostgreSQL Database

1. In Railway dashboard, click **"New Project"**
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait ~30 seconds for database to be created
4. Click on the **PostgreSQL** service
5. Go to **"Variables"** tab
6. Copy the **`DATABASE_URL`** value (looks like `postgresql://postgres:password@host:5432/railway`)
7. **Save this somewhere** - you'll need it later!

---

## Step 3: Create Redis Instance

1. Still in the same Railway project
2. Click **"New"** → **"Database"** → **"Add Redis"**
3. Wait ~30 seconds for Redis to be created
4. Click on the **Redis** service
5. Go to **"Variables"** tab
6. Copy the **`REDIS_URL`** value (looks like `redis://default:password@host:6379`)
7. **Save this somewhere** - you'll need it later!

---

## Step 4: Deploy Backend Code

### Option A: Deploy from GitHub (Recommended)

1. In Railway project, click **"New"** → **"GitHub Repo"**
2. Select your repository: **`natedal/Rand-Jukebox`**
3. Railway will detect it's a Node.js project
4. Click on the newly created service
5. Go to **"Settings"** tab
6. Set **"Root Directory"** to: `backend`
7. Set **"Start Command"** to: `npm start`
8. Railway will automatically detect `package.json` and install dependencies

### Option B: Manual Setup

If GitHub deploy doesn't work:

1. Click **"New"** → **"Empty Service"**
2. Click **"Settings"** → **"Source"** → **"Connect GitHub Repo"**
3. Select your repository
4. Set **Root Directory** to: `backend`
5. Set **Start Command** to: `npm start`

---

## Step 5: Set Environment Variables

This is the most important step! Click on your backend service, then go to **"Variables"** tab.

Add these variables one by one:

### Database & Redis (You already have these!)

1. **`DATABASE_URL`**
   - Value: Paste the PostgreSQL URL you copied in Step 2
   - ✅ Already added by Railway (you can verify it's there)

2. **`REDIS_URL`**
   - Value: Paste the Redis URL you copied in Step 3
   - ✅ Already added by Railway (you can verify it's there)

### Spotify API (Get from your local .env file)

3. **`SPOTIFY_CLIENT_ID`**
   - Value: Your Spotify Client ID (from `backend/.env`)

4. **`SPOTIFY_CLIENT_SECRET`**
   - Value: Your Spotify Client Secret (from `backend/.env`)

5. **`SPOTIFY_REDIRECT_URI`**
   - Value: `https://rand-jukebox.vercel.app/api/spotify/callback`
   - ⚠️ Replace with your actual Vercel URL if different

6. **`SPOTIFY_PREMIUM_REFRESH_TOKEN`**
   - Value: Your refresh token (from `backend/.env`)

### Security & Configuration

7. **`JWT_SECRET`**
   - Value: Generate a random string (32+ characters)
   - Quick way: Run `openssl rand -base64 32` in terminal, or use: `SrUFx9xRbJLJ414QWJmI1CyQjqb732gR1XeD8vyVOhk=`

8. **`VENUE_SLUG`**
   - Value: `rand`

9. **`VENUE_NAME`**
   - Value: `Rand Dining Hall`

10. **`ADMIN_PASSWORD`**
    - Value: `randstaff` (or your preferred password)

### Server Configuration

11. **`PORT`**
    - Value: Railway will set this automatically, but you can add: `3001`
    - ⚠️ Railway uses `PORT` env var automatically, so this might not be needed

12. **`NODE_ENV`**
    - Value: `production`

13. **`FRONTEND_URL`**
    - Value: `https://rand-jukebox.vercel.app`
    - ⚠️ Replace with your actual Vercel URL

---

## Step 6: Deploy & Wait

1. After adding all environment variables, Railway will **automatically redeploy**
2. Go to **"Deployments"** tab to watch the build
3. Wait for status to show **"Active"** (usually 1-2 minutes)
4. If it fails, check the logs for errors

---

## Step 7: Get Your Backend URL

1. Click on your backend service
2. Go to **"Settings"** tab
3. Scroll down to **"Networking"**
4. Click **"Generate Domain"** (if not already generated)
5. Copy the URL (looks like `https://your-app.up.railway.app`)
6. **Save this URL** - you'll need it for Vercel!

---

## Step 8: Test Your Backend

1. Open a new browser tab
2. Visit: `https://your-backend-url.railway.app/health`
3. You should see: `{"status":"ok","timestamp":"..."}`
4. ✅ If you see this, your backend is working!

---

## Step 9: Update Vercel Environment Variables

Now go back to Vercel and update your environment variables:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Update **`NEXT_PUBLIC_API_URL`** to: `https://your-backend-url.railway.app`
3. Update **`NEXT_PUBLIC_SOCKET_URL`** to: `https://your-backend-url.railway.app`
4. Keep **`NEXT_PUBLIC_VENUE_SLUG`** as: `rand`
5. **Redeploy** your Vercel app

---

## Step 10: Test Everything

1. Visit your Vercel URL: `https://rand-jukebox.vercel.app`
2. Open browser console (F12)
3. Should see: `✅ Socket connected`
4. Try searching for a song
5. Try admin login at `/admin`

---

## Troubleshooting

### Backend Won't Start

**Check Railway logs:**
1. Go to Railway → Your Backend Service → **"Deployments"**
2. Click on the latest deployment
3. Check **"Logs"** tab
4. Look for error messages

**Common errors:**

**"Database connection failed"**
- Check `DATABASE_URL` is correct
- Make sure PostgreSQL service is running

**"Redis connection failed"**
- Check `REDIS_URL` is correct
- Make sure Redis service is running

**"Module not found"**
- Make sure `Root Directory` is set to `backend`
- Check `package.json` exists in backend folder

### CORS Errors

**If frontend shows CORS errors:**
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Should be: `https://rand-jukebox.vercel.app` (no trailing slash)

### Socket.io Not Connecting

**Check:**
1. Backend URL is correct in Vercel env vars
2. `FRONTEND_URL` in Railway matches Vercel URL
3. Browser console for connection errors

---

## Quick Checklist

- [ ] Railway account created
- [ ] PostgreSQL database created and `DATABASE_URL` copied
- [ ] Redis instance created and `REDIS_URL` copied
- [ ] Backend service deployed from GitHub
- [ ] Root directory set to `backend`
- [ ] All 13 environment variables added
- [ ] Backend deployment shows "Active"
- [ ] Health check works: `/health` returns `{"status":"ok"}`
- [ ] Backend URL copied
- [ ] Vercel environment variables updated
- [ ] Vercel app redeployed
- [ ] Frontend connects successfully

---

## Cost Estimate

**Railway Free Tier:**
- $5 free credit per month
- PostgreSQL: ~$5/month (after free credit)
- Redis: ~$5/month (after free credit)
- Backend hosting: Free (included)

**Total:** ~$10/month after free credit, or free if you stay within limits

---

## Alternative: Render.com

If Railway doesn't work, you can use Render:

1. Go to **https://render.com**
2. **New** → **Web Service**
3. Connect GitHub repo
4. **Root Directory:** `backend`
5. **Build Command:** `npm install`
6. **Start Command:** `npm start`
7. Add environment variables (same as above)
8. Deploy!

---

## Need Help?

If you get stuck:
1. Check Railway logs for specific errors
2. Verify all environment variables are set
3. Test backend health endpoint
4. Check browser console for frontend errors

Good luck! 🚀

