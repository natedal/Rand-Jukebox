# Fixing "Network Error" on Vercel Deployment

## The Problem

Your frontend is deployed to Vercel but can't connect to the backend because:
1. Environment variables aren't set in Vercel, OR
2. They're pointing to `localhost:3001` instead of your production backend URL

## Quick Fix Steps

### Step 1: Deploy Your Backend First

**You need a backend server running before the frontend can work!**

Options:
- **Railway** (Recommended): https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io
- **Any Node.js hosting**

### Step 2: Get Your Backend URL

Once your backend is deployed, you'll get a URL like:
- `https://your-app.railway.app`
- `https://your-app.onrender.com`
- `https://your-app.fly.dev`

**Copy this URL** - you'll need it for Step 3.

### Step 3: Set Environment Variables in Vercel

1. Go to **Vercel Dashboard**: https://vercel.com
2. Click on your **Rand Jukebox** project
3. Go to **Settings** → **Environment Variables**
4. Add these **3 variables**:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-url.com` (replace with your actual backend URL)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SOCKET_URL`
   - Value: `https://your-backend-url.com` (same as above)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - Name: `NEXT_PUBLIC_VENUE_SLUG`
   - Value: `rand`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. Click **Save** for each variable

### Step 4: Redeploy

After setting environment variables:
1. Go to **Deployments** tab
2. Click the **3 dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

### Step 5: Verify It Works

1. Visit your Vercel URL: `https://rand-jukebox.vercel.app`
2. Check browser console (F12) - should see:
   - ✅ Socket connected
   - No network errors
3. Try admin login - should work now!

## If You Don't Have a Backend Yet

### Quick Backend Deployment (Railway)

1. **Sign up**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Select your repository
4. **Add Service** → **GitHub Repo** → Select `backend` folder
5. Set **Root Directory** to `backend`
6. Add environment variables (see `DEPLOYMENT.md`)
7. Deploy!

### Backend Environment Variables Needed

```bash
DATABASE_URL=your_postgresql_url
REDIS_URL=your_redis_url
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://rand-jukebox.vercel.app/api/spotify/callback
SPOTIFY_PREMIUM_REFRESH_TOKEN=your_refresh_token
JWT_SECRET=your_random_secret_32_chars_min
VENUE_SLUG=rand
VENUE_NAME=Rand Dining Hall
ADMIN_PASSWORD=randstaff
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://rand-jukebox.vercel.app
```

## Troubleshooting

### Still Getting "Network Error"?

1. **Check backend is running:**
   - Visit `https://your-backend-url.com/health`
   - Should return: `{"status":"ok"}`

2. **Check CORS:**
   - Backend must allow requests from your Vercel domain
   - Check `FRONTEND_URL` in backend env vars

3. **Check browser console:**
   - Open DevTools (F12) → Console tab
   - Look for CORS errors or connection errors
   - Share the error message

4. **Verify environment variables:**
   - In Vercel, go to Settings → Environment Variables
   - Make sure all 3 are set correctly
   - Make sure they're enabled for Production

### Backend URL Format

Make sure your backend URL:
- ✅ Starts with `https://` (not `http://`)
- ✅ Doesn't end with `/`
- ✅ Is accessible (try in browser)

**Correct:**
```
https://rand-jukebox-backend.railway.app
```

**Wrong:**
```
http://rand-jukebox-backend.railway.app
https://rand-jukebox-backend.railway.app/
localhost:3001
```

## Quick Checklist

- [ ] Backend is deployed and running
- [ ] Backend URL is accessible (test `/health` endpoint)
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_SOCKET_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_VENUE_SLUG` is set to `rand`
- [ ] All variables enabled for Production
- [ ] Redeployed after setting variables
- [ ] Checked browser console for errors

Once all these are done, your app should work! 🎉



