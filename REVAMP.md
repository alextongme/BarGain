# BarGain Revamp — Architecture & Design Decisions

## Overview

BarGain was rebuilt from a 2016 Express/EJS/MongoDB app into a modern single-page application while preserving the original concept: a geolocation-based buy/sell marketplace.

## Architecture

### Before
- Express 4 + EJS server-side templates
- MongoDB 2.x (native driver) with per-request connections
- Google Maps API (hardcoded key) + server-side Google Geolocation API
- Node 6.6.0, deployed on Heroku

### After
- **Frontend**: Vanilla HTML/CSS/JS SPA with hash-based routing, served as static files by Express
- **Backend**: Express 4 JSON REST API (`/api/*` endpoints)
- **Database**: MongoDB 6.x via MongoDB Atlas (free tier), connection pooling
- **Maps**: Leaflet + OpenStreetMap/CARTO dark tiles (no API key needed)
- **Geolocation**: Browser-native `navigator.geolocation` (replaced server-side Google API)
- **Deployment**: Render Web Service (auto-deploy on push to master)

## Design System

### Aesthetic Direction: Art Deco Luxury
The redesign uses an art deco-inspired visual language — the gold-on-navy palette already had that DNA. The design leans into geometric corner brackets, diamond separators, dramatic typography scale, and a film grain texture overlay.

### Typography
- **Display**: Playfair Display (900/700) — elegant serif for headings, prices, and the hero
- **Body**: Outfit (300-700) — geometric sans-serif for body text, labels, and UI elements

### Color Palette
| Token         | Value                        | Usage                    |
|---------------|------------------------------|--------------------------|
| `--navy-deep` | `#0d0f1a`                    | Body background          |
| `--navy-card` | `#171a30`                    | Card backgrounds         |
| `--navy`      | `#22264b`                    | Original brand navy      |
| `--gold`      | `#e6cf8b`                    | Primary accent, CTAs     |
| `--rose`      | `#b56969`                    | Secondary accent, errors |
| `--text`      | `#e8edf3`                    | Primary text             |
| `--text-muted`| `#7a7f94`                    | Secondary text           |

### Key Visual Elements
- **Corner brackets** on cards (CSS `::before`/`::after`) — art deco framing
- **Diamond separators** — gold lines with a centered diamond glyph
- **Film grain overlay** — SVG feTurbulence noise at 2.2% opacity
- **Conic gradient sunburst** — hero background pattern radiating from below center
- **Dark map tiles** — CARTO dark_all tiles match the overall palette

## Technical Tradeoffs

### Vanilla JS vs Framework
Chose vanilla JS over React/Vue because:
- No build step needed — deploy as-is
- ~20KB total JS vs 40-100KB+ for a framework
- The app has ~10 pages with simple interactions — a framework adds complexity without proportional benefit
- Better portfolio signal: shows you can build without framework scaffolding

### Leaflet vs Google Maps
Switched from Google Maps to Leaflet + OpenStreetMap because:
- No API key required (the old Google key was hardcoded in source)
- Free with no usage limits
- CARTO dark tiles fit the design aesthetic
- Shows breadth of mapping library experience (Google Maps on other projects)

### Hash Routing vs History API
Chose hash routing (`#/path`) because:
- Works with static file serving — no server-side catch-all needed
- No 404 issues on page refresh
- Simpler implementation, no build tools required

### MongoDB Atlas vs Render Postgres
Kept MongoDB (via Atlas free tier) instead of switching to Render Postgres because:
- Portfolio diversity: shows both MongoDB and Postgres experience (Noteworthy uses Postgres)
- Zero data migration needed — same schema, same queries
- Atlas free tier is genuinely free with 512MB storage

### Session Auth vs JWT
Kept session-based auth instead of switching to JWT because:
- Simpler implementation for a server-rendered-adjacent app
- No token refresh logic needed
- Express-session handles expiry and invalidation natively

## Security Improvements

| Issue                       | Before                        | After                           |
|-----------------------------|-------------------------------|---------------------------------|
| Session secret              | Hardcoded `'alextong'`        | `process.env.SESSION_SECRET`    |
| Google API key              | Hardcoded in EJS templates    | Eliminated (using Leaflet)      |
| Search injection            | Raw `new RegExp(userInput)`   | Escaped special chars           |
| Password in responses       | Included in user objects      | Stripped via destructuring      |
| DB connections               | New connection per request    | Connection pool (singleton)     |
| Listing ownership           | No server-side check          | `sellerId` verified on edit/delete |

## API Endpoints

| Method   | Path                    | Auth | Description              |
|----------|-------------------------|------|--------------------------|
| `GET`    | `/api/me`               | Yes  | Current user             |
| `POST`   | `/api/auth/login`       | No   | Log in                   |
| `POST`   | `/api/auth/signup`      | No   | Create account           |
| `POST`   | `/api/auth/logout`      | No   | Log out                  |
| `GET`    | `/api/listings`         | No   | All listings             |
| `GET`    | `/api/listings/search`  | No   | Search by title          |
| `GET`    | `/api/listings/:id`     | No   | Single listing           |
| `POST`   | `/api/listings`         | Yes  | Create listing           |
| `PUT`    | `/api/listings/:id`     | Yes  | Update own listing       |
| `DELETE` | `/api/listings/:id`     | Yes  | Delete own listing       |
| `GET`    | `/api/profile`          | Yes  | User profile + data      |
| `POST`   | `/api/favorites/:id`    | Yes  | Add favorite             |
| `DELETE` | `/api/favorites/:id`    | Yes  | Remove favorite          |

## Deployment

- **Provider**: Render (Web Service, free tier)
- **Config**: `render.yaml` blueprint
- **Auto-deploy**: On push to `master` branch
- **Database**: MongoDB Atlas (free M0 cluster)
- **Environment Variables**: `MONGODB_URI`, `SESSION_SECRET`, `DB_NAME`
