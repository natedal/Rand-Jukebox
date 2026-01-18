# Spotify OAuth Setup Guide

This guide explains how to configure Spotify OAuth for the Jukebox application.

## Prerequisites

- A Spotify account
- Access to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Step 1: Create a Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in the app details:
   - **App name**: `Rand Jukebox` (or your venue name)
   - **App description**: `Music queue management system`
   - **Redirect URI**: See Step 2 below
5. Accept the terms and click **"Save"**

## Step 2: Configure Redirect URIs

You **must** add the following redirect URIs to your Spotify app:

### For Production (Vercel)
```
https://rand-jukebox.vercel.app/api/spotify/callback
```

### For Local Development
```
http://localhost:3000/api/spotify/callback
http://127.0.0.1:3000/api/spotify/callback
```

**Important Notes:**
- Spotify requires **exact match** of redirect URIs
- No trailing slashes
- Must include protocol (`http://` or `https://`)
- For custom domains, add those redirect URIs too

### How to Add Redirect URIs:

1. Go to your app in Spotify Developer Dashboard
2. Click **"Edit Settings"**
3. Scroll to **"Redirect URIs"**
4. Click **"Add URI"** for each URI above
5. Click **"Add"** and **"Save"**

## Step 3: Get Your Credentials

After creating the app, you'll see:

- **Client ID**: Copy this value
- **Client Secret**: Click **"Show Client Secret"** and copy this value

## Step 4: Set Environment Variables

### For Railway (Backend)

Add these to your Railway backend service environment variables:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
FRONTEND_URL=https://rand-jukebox.vercel.app
```

**Important:** `FRONTEND_URL` must match your Vercel deployment URL exactly (no trailing slash).

### For Local Development

Add to `backend/.env`:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
FRONTEND_URL=http://localhost:3000
```

## Step 5: Connect Spotify Account (Admin Panel)

1. Deploy your backend with the environment variables above
2. Visit your admin panel: `https://rand-jukebox.vercel.app/admin`
3. Log in with your admin password
4. Click **"Connect Spotify"** button
5. You'll be redirected to Spotify to authorize the app
6. After authorization, you'll be redirected back to the admin panel
7. Your Spotify account is now connected!

## Troubleshooting

### "Illegal redirect_uri" Error

This means the redirect URI in your Spotify app settings doesn't match what the backend is sending.

**Check:**
1. Go to Spotify Developer Dashboard → Your App → Edit Settings
2. Verify the redirect URI is exactly: `https://rand-jukebox.vercel.app/api/spotify/callback`
3. Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
4. No trailing slashes in either place

**Common mistakes:**
- Missing `/api/spotify/callback` path
- Using `http://` instead of `https://` (or vice versa)
- Trailing slashes
- Wrong domain/subdomain

### "Failed to refresh Spotify Premium token"

This means the refresh token wasn't saved properly or expired.

**Solution:**
1. Disconnect Spotify in admin panel
2. Reconnect Spotify (this will get a new refresh token)

### "Spotify Premium credentials not configured"

This means the environment variables aren't set correctly.

**Check:**
1. Verify `SPOTIFY_CLIENT_ID` is set in Railway
2. Verify `SPOTIFY_CLIENT_SECRET` is set in Railway
3. Redeploy backend after adding variables

## Multi-Venue Support

For multiple venues with subdomains, you'll need to:

1. Add redirect URIs for each subdomain:
   ```
   https://venue1.yourdomain.com/api/spotify/callback
   https://venue2.yourdomain.com/api/spotify/callback
   ```

2. Set `FRONTEND_URL` in Railway to your base domain (or use environment-specific variables)

## Security Notes

- Never commit `SPOTIFY_CLIENT_SECRET` to git
- Keep your Client Secret secure
- Each venue can have its own Spotify account connected
- Refresh tokens are stored encrypted in the database



