# Vercel Deployment Setup

## Environment Variables

Set these in your Vercel project settings:

### Required

- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL (from Upstash dashboard)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token (from Upstash dashboard)

### Optional (for features)

- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - For AI-generated tips
- `GEMINI_MODEL` - Model to use (default: "gemini-2.0-flash")
- `SPOTIFY_CLIENT_ID` - Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify app client secret
- `SPOTIFY_REFRESH_TOKEN` - Fallback refresh token (optional)

## Setup Steps

1. **Create Upstash Redis Database:**

   - Go to Vercel Dashboard → Storage → Marketplace → Upstash
   - Click "Create" on Upstash
   - This will create an Upstash Redis database and automatically set environment variables
   - Alternatively, create manually at [upstash.com](https://upstash.com) and copy the REST URL and token

2. **Deploy to Vercel:**

   ```bash
   cd server
   vercel
   ```

3. **Set Environment Variables:**

   - In Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables listed above

4. **Redeploy:**
   - After setting environment variables, redeploy the project

## API Endpoints

All endpoints accept an optional `petId` query parameter (defaults to "default"):

- `GET /api/poll?petId=xxx` - Get all state (cat, prefs, stats)
- `GET /api/cat/state?petId=xxx` - Get cat state
- `POST /api/cat/state?petId=xxx` - Update cat state
- `GET /api/prefs/state?petId=xxx` - Get preferences
- `POST /api/prefs/state?petId=xxx` - Update preferences
- `GET /api/stats/state?petId=xxx` - Get stats
- `POST /api/stats/state?petId=xxx` - Update stats
- `GET /api/items?petId=xxx` - Get items
- `POST /api/items?petId=xxx` - Create item
- `GET /api/auth/spotify/login?petId=xxx` - Start Spotify auth
- `GET /api/auth/spotify/callback` - Spotify callback

## Client Integration

Update your client to:

1. Use HTTP polling instead of WebSocket
2. Include `petId` in all API calls (store in localStorage)
3. Poll `/api/poll?petId=xxx` every 1.5 seconds

Example:

```typescript
const petId = localStorage.getItem("petId") || "default";
const response = await fetch(
  `https://your-app.vercel.app/api/poll?petId=${petId}`
);
const data = await response.json();
```
