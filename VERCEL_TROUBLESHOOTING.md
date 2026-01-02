# Vercel Build Troubleshooting Guide

## Common Build Failure Causes

### 1. Missing Environment Variables

**Problem:** Vercel needs environment variables set before building.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables for **Production**, **Preview**, and **Development**:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
NEXT_PUBLIC_VENUE_SLUG=rand
```

**Important:** Even though the code has fallbacks, Vercel's build process might fail if these aren't set.

### 2. Node Version Mismatch

**Problem:** Vercel might be using a different Node version than your local machine.

**Solution:** The `vercel.json` file specifies Node 20.x. If issues persist:
1. Check your local Node version: `node --version`
2. Ensure Vercel is using Node 20.x (set in Vercel dashboard or vercel.json)

### 3. TypeScript Strict Mode

**Problem:** Vercel might have stricter TypeScript checking enabled.

**Solution:** Check `tsconfig.json` and ensure it matches your local setup. Run:
```bash
npm run build
```
Locally to catch any TypeScript errors before deploying.

### 4. Build Output Size

**Problem:** Build might be too large (unlikely but possible).

**Solution:** Check Vercel build logs for size warnings.

### 5. Missing Dependencies

**Problem:** Some dependencies might not be installed correctly.

**Solution:** 
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` locally
3. Commit `package-lock.json`
4. Redeploy

## Step-by-Step Fix

### Step 1: Check Build Logs

In Vercel Dashboard:
1. Go to your failed deployment
2. Click "Build Logs" 
3. Scroll to find the actual error (usually near the end)
4. Look for:
   - TypeScript errors
   - Missing module errors
   - Environment variable errors
   - Build command errors

### Step 2: Set Environment Variables

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all three required variables:
   - `NEXT_PUBLIC_API_URL` (use a placeholder if backend isn't deployed yet)
   - `NEXT_PUBLIC_SOCKET_URL` (same as API URL)
   - `NEXT_PUBLIC_VENUE_SLUG=rand`
3. Make sure they're set for **Production**, **Preview**, and **Development**

### Step 3: Verify Local Build

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build
npm run build

# Should complete successfully
```

### Step 4: Check TypeScript

```bash
# Run TypeScript check
npx tsc --noEmit

# Should show no errors
```

### Step 5: Redeploy

1. In Vercel Dashboard, click "Redeploy"
2. Or push a new commit to trigger deployment

## Quick Fixes

### If error mentions "Cannot find module"
```bash
# Ensure all dependencies are in package.json
npm install --save <missing-package>
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

### If error mentions environment variables
- Set them in Vercel Dashboard (see Step 2 above)

### If error mentions TypeScript
- Run `npm run build` locally first
- Fix any TypeScript errors
- Commit and push

### If build times out
- Check for infinite loops in useEffect hooks
- Ensure no API calls during build time
- Check for large dependencies

## Debugging Commands

```bash
# Check what Vercel will use
vercel build

# Test build locally (same as Vercel)
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint
```

## Still Not Working?

1. **Share the exact error** from Vercel build logs
2. **Check Vercel status**: https://www.vercel-status.com
3. **Try deploying from CLI**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```
   This will show more detailed error messages

## Most Common Issue

**90% of Vercel build failures are due to missing environment variables.**

Even if your code has fallbacks like:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

Vercel's build process might still fail. Always set environment variables in Vercel Dashboard before deploying.

