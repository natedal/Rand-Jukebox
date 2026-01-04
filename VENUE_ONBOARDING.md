# Venue Onboarding Guide

This guide explains how to set up a new venue with its own subdomain on jukeb.ink.

## Overview

Each venue gets its own subdomain (e.g., `cafemogador.jukeb.ink`) with a completely isolated queue, votes, and admin settings. All venues share the same backend infrastructure but have separate data via `venue_id` filtering.

## Prerequisites

- Admin access to an existing venue (to create new venues)
- DNS access to configure `jukeb.ink` domain (if not already configured)
- Vercel account with `jukeb.ink` domain configured

## Step 1: Create Venue via API

### Using cURL

```bash
# First, login as admin to get a token
curl -X POST https://your-backend-url/api/admin/login \
  -H "Content-Type: application/json" \
  -H "X-Venue-Slug: rand" \
  -d '{"password": "your-admin-password"}'

# Use the token to create a new venue
curl -X POST https://your-backend-url/api/admin/venues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Venue-Slug: rand" \
  -d '{
    "slug": "cafemogador",
    "name": "Cafe Mogador",
    "admin_password": "secure-password-here"
  }'
```

### Using JavaScript/TypeScript

```javascript
// Login first
const loginResponse = await fetch('https://your-backend-url/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Venue-Slug': 'rand', // Use any existing venue
  },
  body: JSON.stringify({
    password: 'your-admin-password',
  }),
});

const { token } = await loginResponse.json();

// Create new venue
const createVenueResponse = await fetch('https://your-backend-url/api/admin/venues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Venue-Slug': 'rand',
  },
  body: JSON.stringify({
    slug: 'cafemogador',
    name: 'Cafe Mogador',
    admin_password: 'secure-password-here',
  }),
});

const venue = await createVenueResponse.json();
console.log('Venue created:', venue);
```

### Venue Slug Requirements

- Must be lowercase letters, numbers, and hyphens only
- Must be between 2 and 50 characters
- Must be unique (cannot already exist)
- Examples: `cafemogador`, `bar-pisellino`, `venue1`, `rand`

### Response

```json
{
  "success": true,
  "venue": {
    "id": "uuid-here",
    "slug": "cafemogador",
    "name": "Cafe Mogador",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Venue created successfully. Admin password: as provided"
}
```

## Step 2: DNS Configuration (If Not Already Done)

If wildcard DNS is not already configured for `jukeb.ink`:

1. **Add Wildcard CNAME Record** (Recommended)
   - Type: `CNAME`
   - Name: `*` (wildcard)
   - Value: `cname.vercel-dns.com`
   - TTL: Auto or 3600

2. **Alternative: Wildcard A Record**
   - If your DNS provider doesn't support wildcard CNAME:
   - Type: `A`
   - Name: `*`
   - Value: Vercel's IP addresses (get from Vercel dashboard)
   - TTL: Auto or 3600

3. **Root Domain** (Optional but Recommended)
   - Type: `A` or `CNAME`
   - Name: `@` or blank
   - Value: Vercel IPs or `cname.vercel-dns.com`
   - This handles `jukeb.ink` (root domain)

### DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Use `dig *.jukeb.ink` or online DNS checker to verify

## Step 3: Vercel Domain Configuration

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `*.jukeb.ink` (wildcard subdomain)
3. Add domain: `jukeb.ink` (root domain)
4. Vercel will automatically route all subdomains to the same deployment
5. No code changes needed - Next.js handles subdomain routing automatically

### Verify Domain

- Vercel will show DNS configuration instructions
- Follow the instructions to add the DNS records
- Wait for DNS verification (usually instant after DNS propagates)

## Step 4: Test Venue Access

1. **Access via Subdomain**
   - Visit `https://cafemogador.jukeb.ink`
   - Should load the jukebox interface
   - Venue name should display correctly

2. **Test Admin Login**
   - Go to `https://cafemogador.jukeb.ink/admin`
   - Login with the admin password you set
   - Should access admin dashboard

3. **Verify Queue Isolation**
   - Add a song to queue on `cafemogador.jukeb.ink`
   - Check `rand.jukeb.ink` - should NOT see the song
   - Each venue has its own isolated queue

4. **Test API Access**
   ```bash
   curl https://your-backend-url/api/queue \
     -H "X-Venue-Slug: cafemogador"
   ```
   Should return empty queue (or songs specific to that venue)

## Step 5: Initial Setup (Admin)

After creating the venue and accessing it:

1. **Connect Spotify** (Required for playback)
   - Go to Admin → Spotify Connection
   - Follow OAuth flow
   - Requires Spotify Premium account

2. **Configure Settings**
   - Set default playlist (optional)
   - Configure filters (explicit content, genres, etc.)
   - Adjust queue settings

3. **Test Playback**
   - Add a song to queue
   - Start playback
   - Verify music plays correctly

## Venue Management Endpoints

### List All Venues

```bash
curl https://your-backend-url/api/admin/venues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Venue-Slug: rand"
```

### Get Venue Details

```bash
curl https://your-backend-url/api/admin/venues/cafemogador \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Venue-Slug: rand"
```

### Update Venue Name

```bash
curl -X PUT https://your-backend-url/api/admin/venues/cafemogador \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Venue-Slug: rand" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cafe Mogador - Updated Name"}'
```

## Troubleshooting

### Venue Not Found Error

- **Symptom**: "Venue not found: cafemogador"
- **Solution**: 
  1. Verify venue was created successfully via API
  2. Check venue slug matches exactly (case-sensitive, lowercase)
  3. Verify backend database connection

### CORS Errors

- **Symptom**: CORS policy errors in browser console
- **Solution**:
  1. Ensure `FRONTEND_URL` environment variable is set to `https://jukeb.ink` in backend
  2. Verify subdomain is properly detected (check browser network tab headers)
  3. Check backend CORS configuration allows `*.jukeb.ink`

### Subdomain Not Routing

- **Symptom**: Subdomain shows 404 or wrong content
- **Solution**:
  1. Verify DNS wildcard record is configured correctly
  2. Check Vercel domain configuration includes `*.jukeb.ink`
  3. Wait for DNS propagation (can take up to 48 hours)
  4. Clear browser cache and try again

### Admin Login Not Working

- **Symptom**: Cannot login to admin panel
- **Solution**:
  1. Verify admin password was set correctly during venue creation
  2. Check admin_settings table has entry for venue_id
  3. Try resetting admin password (if endpoint exists)

## Security Considerations

- **Admin Password**: Use strong, unique passwords for each venue
- **API Authentication**: All venue creation endpoints require admin authentication
- **Venue Isolation**: All database queries filter by `venue_id` - verify isolation in testing
- **CORS**: Only allows subdomains of `jukeb.ink` - maintains security

## Environment Variables

### Backend

```bash
FRONTEND_URL=https://jukeb.ink  # Base domain for CORS
# Other variables remain the same
```

### Frontend

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url
# NEXT_PUBLIC_VENUE_SLUG is optional - detected from subdomain
```

## Testing Checklist

- [ ] Venue created successfully via API
- [ ] DNS wildcard record configured
- [ ] Vercel domain configured
- [ ] Subdomain accessible (e.g., `venue.jukeb.ink`)
- [ ] Venue name displays correctly
- [ ] Admin login works
- [ ] Queue is isolated (different from other venues)
- [ ] Songs can be added to queue
- [ ] Votes work correctly
- [ ] Spotify connection works
- [ ] Playback works
- [ ] CORS allows subdomain requests
- [ ] Socket.io works with subdomain

## Support

For issues:
1. Check backend logs for errors
2. Check browser console for frontend errors
3. Verify DNS configuration
4. Verify Vercel domain configuration
5. Test API endpoints directly with cURL

