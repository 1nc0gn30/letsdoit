# Navi — Hampton Roads Explorer

A curated map of 500+ real places and events across Hampton Roads, VA (Norfolk, Virginia Beach, Chesapeake, Hampton, Newport News, Portsmouth, Suffolk, Williamsburg, Yorktown, and beyond).

Built with **React + Vite + Tailwind + Leaflet** on the frontend and **Netlify Identity + Netlify Functions + Netlify Blobs** on the backend.

## Features

- **612 mapped locations** with accurate coordinates across all Hampton Roads cities
- **Personalized suggestions** based on interests, time of day, distance, and history
- **Credibility scoring** — earn points by following through on suggestions, lose points for skipping
- **Streak tracking** for consecutive successful visits
- **Like / Dislike** feedback to mature your recommendation algorithm
- **User profiles** stored in Netlify's serverless document store
- **Responsive map + sidebar** with live distance calculation and routing links

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS, Leaflet, Framer Motion |
| Auth | Netlify Identity |
| API | Netlify Functions (TypeScript) |
| Data | Netlify Blobs (document store) |
| Deploy | Netlify |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Local development

```bash
npm run dev
```

### 3. Netlify setup (required for auth and data)

1. Create a new site on [Netlify](https://app.netlify.com)
2. Enable **Netlify Identity** in your site settings
3. Set Identity registration to "Open" or "Invite only" as preferred
4. Deploy the site (or run `netlify dev` locally)

The Netlify Functions in `netlify/functions/` handle profile, visits, and feedback storage via Netlify Blobs. No external database connection strings are required.

### 4. Environment variables

No env vars are required for the base app. If you want to customize:

```
# Optional: Netlify Identity URL (auto-detected in production)
NETLIFY_IDENTITY_URL=https://your-site.netlify.app
```

## Data

Places are stored in `src/data/places.ts` (612 entries). They span:

- Food & Dining
- Coffee Shops
- Bars & Breweries
- Parks & Outdoors
- Beaches & Water
- Museums & Culture
- History & Landmarks
- Entertainment
- Family Friendly
- Sports & Fitness
- Wellness & Spa
- Music Venues
- Shopping
- Festivals & Events

## Netlify Functions

| Function | Purpose |
|----------|---------|
| `/.netlify/functions/profile` | GET/PUT user profile (preferences, score, streak) |
| `/.netlify/functions/visits` | GET/POST/PUT visit history |
| `/.netlify/functions/feedback` | GET/POST place like/dislike feedback |

All functions read the Identity JWT from the `Authorization` header and scope data to the authenticated user.

## Suggestion Engine

The suggestion engine (`src/lib/suggestionEngine.ts`) scores places using:

- **Tag match** — alignment with user preferences
- **Distance** — proximity to user's live location
- **Time of day** — coffee in the morning, nightlife at night, etc.
- **History** — penalty for recently visited or disliked places
- **Freshness jitter** — small randomization so the same place isn't always picked

## Scoring Logic

| Action | Credibility Delta |
|--------|-------------------|
| Go & Like | +12 |
| Go & Neutral | +8 |
| Go & Dislike | -2 |
| Skip after accepting | -10 |
| Decline suggestion | -3 |

## File Structure

```
netlify/
  functions/
    _shared/store.ts      # Netlify Blobs wrapper
    profile.ts            # Profile CRUD
    visits.ts             # Visit history CRUD
    feedback.ts           # Like/dislike CRUD
src/
  components/
    MapViewer.tsx         # Leaflet map with markers
    Onboarding.tsx        # Auth + preferences UI
    SuggestionCard.tsx    # Ready-to-go + suggestion flow
    ProfilePanel.tsx      # Score, streak, history, likes
  contexts/
    AuthContext.tsx       # Netlify Identity auth provider
  data/
    places.ts             # 612 Hampton Roads locations
  lib/
    suggestionEngine.ts   # Scoring algorithm
    netlifyApi.ts         # API client for Netlify Functions
    profileService.ts     # Profile helpers
    visitService.ts       # Visit/feedback helpers
  App.tsx                 # Main layout + suggestion flow
```

## Deploy

```bash
netlify deploy --prod
```

Or connect your Git repo to Netlify for auto-deploys.

## Iteration Roadmap

- [ ] Real-time event feeds ( scrape & import recurring events )
- [ ] Social features ( friend suggestions, group outings )
- [ ] Weather-aware recommendations
- [ ] Push notifications for nearby streak opportunities
- [ ] Leaderboards & badges
- [ ] Photo check-ins
