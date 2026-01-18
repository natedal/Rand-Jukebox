# Fix: API URL Configuration Error (405 Method Not Allowed)

## Problem

You're seeing errors like:
- `405 Method Not Allowed` when searching for songs
- `405 Method Not Allowed` when logging into admin panel
- URLs like: `rand-jukebox-xxx.vercel.app/rand-jukebox-production.up.railway.app/api/...`

This means `NEXT_PUBLIC_API_URL` in Vercel is missing the `https://` protocol.

## Solution

### Step 1: Get Your Railway Backend URL

1. Go to [Railway Dashboard](https://railway.app)
2. Open your backend service
3. Go to **Settings** → **Networking**
4. Copy your **Public Domain** (e.g., `rand-jukebox-production.up.railway.app`)

### Step 2: Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: **Rand-Jukebox**
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_API_URL`
5. **Update it** to include `https://`:

   **Correct format:**
   ```
   https://rand-jukebox-production.up.railway.app
   ```

   **Wrong format (causes 405 errors):**
   ```
   rand-jukebox-production.up.railway.app
   ```

6. Make sure it's set for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Step 3: Redeploy

After updating the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Verify

1. Open your Vercel app
2. Open browser console (F12)
3. You should see: `API URL: https://rand-jukebox-production.up.railway.app`
4. Try searching for a song - should work now!

## Quick Checklist

- [ ] Railway backend URL copied (with `https://`)
- [ ] `NEXT_PUBLIC_API_URL` updated in Vercel
- [ ] Set for Production, Preview, and Development
- [ ] Vercel app redeployed
- [ ] Tested song search - works!
- [ ] Tested admin login - works!

## Still Having Issues?

Check the browser console for error messages. The code now logs helpful debugging info if the API URL is misconfigured.

If you see errors about the API URL in the console, double-check:
1. The environment variable name is exactly `NEXT_PUBLIC_API_URL` (case-sensitive)
2. The value starts with `https://`
3. No trailing slash
4. The Railway backend is actually running



