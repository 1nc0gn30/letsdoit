# Navi — Hampton Roads Explorer

A curated map of 500+ real places and events across Hampton Roads, VA (Norfolk, Virginia Beach, Chesapeake, Hampton, Newport News, Portsmouth, Suffolk, Williamsburg, Yorktown, and beyond).

Built with **React + Vite + Tailwind + Leaflet** on the frontend and **Netlify Identity + Netlify Functions + Netlify Database** on the backend.

## Features

- **612 mapped locations** with accurate coordinates across all Hampton Roads cities
- **Personalized suggestions** based on interests, time of day, distance, and history
- **Credibility scoring** — earn points by following through on suggestions, lose points for skipping
- **Streak tracking** for consecutive successful visits
- **Like / Dislike** feedback to mature your recommendation algorithm
- **User profiles** stored in Netlify's managed Postgres database
- **Responsive map + sidebar** with live distance calculation and routing links

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS, Leaflet, Framer Motion |
| Auth | Netlify Identity |
| API | Netlify Functions (TypeScript) |
| Data | Netlify Database (Postgres) |
| Deploy | Netlify |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Netlify setup (required for auth and database)

1. Create a new site on [Netlify](https://app.netlify.com)
2. Enable **Netlify Identity** in your site settings → Registration preferences → "Open" or "Invite only"
3. The database will be auto-provisioned on first deploy because migrations exist in `netlify/database/migrations/`

## Development

### Frontend only (fastest iteration)

```bash
npm run dev
```

This starts Vite on `http://localhost:5173`. Netlify Functions and the database won't work, but the UI, map, and suggestion engine are fully functional.

### Full stack (frontend + functions + database)

```bash
netlify dev
```

This starts:
- Vite dev server (auto-detected port)
- Netlify Functions locally
- Local Postgres database via Netlify Database
- Netlify Identity widget available

**Access the app at `http://localhost:8888`** (the Netlify dev proxy port), NOT the Vite port directly.

> ⚠️ If you see "Port 5173 is in use", kill any old Vite processes first: `killall node` or `lsof -ti:5173 | xargs kill -9`

### Functions only

```bash
netlify functions:serve
```

Test individual functions at `http://localhost:9999/.netlify/functions/profile`, etc.

## Deploy

```bash
netlify deploy --prod
```

Or connect your Git repo to Netlify for auto-deploys.

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

## Database Schema

Migrations live in `netlify/database/migrations/`:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (preferences, credibility score, streak) |
| `visits` | Visit history (suggested, accepted, checked_in, skipped, declined) |
| `place_feedback` | Like/dislike per place per user |

Netlify applies migrations automatically on deploy.

## Netlify Functions

| Function | Purpose |
|----------|---------|
| `/.netlify/functions/profile` | GET/PUT user profile |
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
  database/
    migrations/
      0000_initial.sql    # Postgres schema
  functions/
    _shared/
      store.ts            # Auth context helper
    profile.ts            # Profile CRUD
    visits.ts             # Visit history CRUD
    feedback.ts           # Like/dislike CRUD
public/
  _redirects              # Production SPA fallback
  robots.txt
  sitemap.xml
  og-image.svg
src/
  components/
    Layout.tsx            # App shell with navigation
    MapViewer.tsx         # Leaflet map with markers
    Onboarding.tsx        # Auth + preferences UI
    SEO.tsx               # Dynamic meta tag manager
    SuggestionCard.tsx    # Ready-to-go + suggestion flow
    ProfilePanel.tsx      # Score, streak, history, likes
  contexts/
    AuthContext.tsx       # Netlify Identity provider
  data/
    places.ts             # 612 Hampton Roads locations
  pages/
    Home.tsx              # Dashboard with stats & picks
    Explore.tsx           # Full map + sidebar
    Events.tsx            # Filterable events grid
    DailyPicks.tsx        # Standalone suggestion flow
    ProfilePage.tsx       # Full profile page
    PlaceDetail.tsx       # Individual place page
  lib/
    suggestionEngine.ts   # Scoring algorithm
    netlifyApi.ts         # API client for Netlify Functions
    profileService.ts     # Profile helpers
    visitService.ts       # Visit/feedback helpers
  App.tsx                 # Router + auth guards
```

## Auth Flow

1. User opens app, not logged in → Welcome screen with **Create Account** / **Sign In**
2. Clicking either opens the **Netlify Identity modal** (popup from `identity.netlify.com`)
3. After signup/login, modal closes → app detects user via `window.netlifyIdentity` events
4. If no preferences set → shows interest selection
5. Then the full app loads with personalized suggestions

## Iteration Roadmap

- [ ] Real-time event feeds (scrape & import recurring events)
- [ ] Social features (friend suggestions, group outings)
- [ ] Weather-aware recommendations
- [ ] Push notifications for nearby streak opportunities
- [ ] Leaderboards & badges
- [ ] Photo check-ins
