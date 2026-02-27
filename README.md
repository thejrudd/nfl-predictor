# NFL Season Predictor

An interactive web app for predicting the 2026 NFL season. Pick game-by-game outcomes for all 32 teams, view projected standings, generate playoff seeding, and create a shareable infographic of your predictions — all in the browser.

![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8)

## Features

- **Game-by-Game Predictions** — Pick winners for all 272 regular season games with automatic opponent syncing
- **Real-Time Validation** — Enforces league-wide balance (272 total wins), division constraints, and pairwise limits
- **Division Standings** — Auto-generated standings sorted by wins, division record, and strength of schedule
- **Playoff Seeding** — AFC and NFC brackets with division winners and wild card spots
- **Shareable Infographic** — Create a custom bento-grid graphic with up to 11 insight sections (Best & Worst Records, Playoff Seeds, Division Winners, Conference Showdown, Toughest Division, Bold Predictions, Worst Division, Strength of Schedule, Closest Division Race, Wild Card Teams, Parity Index). Drag and resize sections to build your layout.
- **Export/Import** — Save predictions as JSON; import JSON to restore picks
- **Dark Mode** — Toggle between light and dark themes
- **Responsive Design** — Works on desktop and mobile
- **Client-Side Only** — All data stored in localStorage, nothing leaves your browser

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

Output is written to `dist/`.

## Docker Deployment

### Build and run on the server

```bash
docker compose up -d --build
```

The app will be available on port 80 by default. To use a different port:

```bash
PORT=8080 docker compose up -d --build
```

## Tech Stack

- **React 19** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Utility-first styling
- **react-grid-layout** — Drag-and-resize bento grid for the export infographic
- **nginx** — Production static file serving (Docker)

## What's New in v2.2.1

- **Scroll Tracking Fix** — Collapsing header now uses delta-based tracking; collapse and expand both follow scroll speed exactly rather than snapping
- **Larger Collapse Zone** — Header collapses and expands over 160px of scroll travel (up from 80px), making the motion feel proportional at any scroll speed

## What's New in v2.2

- **Collapsing Header** — On mobile, the app title, progress bar, and view tabs slide out of view when scrolling down, leaving only the essential controls visible; full header restores on scroll up
- **Navigation in Menu** — When the header is collapsed, the hamburger menu shows a "Navigate" section at the top for quick access to all four views
- **Desktop Unaffected** — Header always stays fully expanded on wider screens; collapse only activates below the Tailwind `sm` breakpoint (640px)
- **iOS Overscroll Fix** — Scroll position clamped to prevent the elastic rubber-band bounce at the bottom of the page from triggering spurious collapse/expand flicker

## What's New in v2.1

- **PWA Support** — Install the app to your home screen on iOS and Android; runs in standalone mode with no browser chrome
- **Asset Caching** — Static assets, team logos, and data file precached on install for faster repeat loads
- **ESPN API Caching** — Roster, stats, and game log requests cached at the service worker level (network-first with offline fallback)
- **Install Button** — "Install App" button appears in the header on supported browsers (Chrome, Edge)

## What's New in v2.0

- **Player Browser** — Browse all 32 rosters by conference, division, and position filter; search players by name across the league
- **Depth Chart Ordering** — When filtering by position, players are sorted by their ESPN depth chart rank (RB1, RB2, etc.)
- **Player Profiles** — Full player profile pages with headshot, career highlight pods, and per-season stat accordions
- **Season Stats** — Grouped stat sections (Passing, Rushing, Negative Plays, etc.) with standard and advanced stat toggles
- **Game Log** — Per-game stat table with an advanced stats toggle, for every season on record
- **Awards & Honors** — Pro Bowl, All-Pro, and major award badges displayed on each season's accordion header
- **Career Totals** — Lifetime stat pods shown in the player hero card, color-coded by stat type

## Roadmap

**v2.3** — Search / filter teams by name, division, or conference
**v2.4** — Week-by-week schedule view
**v2.5** — Season narrative (auto-generated text summary of your predicted season)
**v2.6** — Historical comparison (predicted records vs. each team's actual past results)
**v3.0** — Fantasy football / Sleeper league integration (custom scoring, start/sit recommendations, projections)
**v4.0** — Visual overhaul (unified design system, redesigned cards and bracket, polished mobile experience)

## Project Structure

```
src/
├── App.jsx                  # Main app container and header controls
├── components/
│   ├── PlayerBrowser.jsx    # Team/roster browser with position filter and player search
│   ├── PlayerProfile.jsx    # Player profile page with hero card, stats, and game log
│   ├── PlayerStatTable.jsx  # Accordion stat table with standard/advanced toggle and honors badges
│   ├── TeamList.jsx         # Division cards with team rows and tooltips
│   ├── TeamDetail.jsx       # Modal for editing team predictions
│   ├── StandingsTable.jsx   # Division standings view
│   ├── PlayoffSeeding.jsx   # Playoff bracket view
│   ├── RecordSetter.jsx     # Win-loss-tie record controls
│   ├── GameResultToggle.jsx # Individual game outcome toggle
│   ├── DivisionMatrix.jsx   # Head-to-head results grid
│   ├── ExportPreview.jsx    # Export modal with section toggles and layout controls
│   ├── ShareableImage.jsx   # Interactive bento-grid infographic with 11 sections
│   └── Guide.jsx            # Getting-started guide modal
├── context/
│   ├── PredictionContext.jsx # Prediction state and localStorage sync
│   └── ThemeContext.jsx      # Dark mode state
├── data/
│   └── honors.json          # Static Pro Bowl / All-Pro records by player and season
└── utils/
    ├── playerApi.js         # ESPN API fetches: roster, stats, game log, bio, depth chart
    ├── playerCache.js       # localStorage cache with per-key TTLs
    ├── playerMetrics.js     # Stat row definitions, headline metrics, and career highlights
    ├── scheduleParser.js    # Team/division queries, strength of schedule
    ├── validation.js        # Constraint checking and balance validation
    ├── exportImport.js      # JSON export/import
    ├── exportStats.js       # Highlight stat computations for the infographic
    └── layoutUtils.js       # Bento grid layout constants, sizing, and RGL helpers
```
