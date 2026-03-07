# NFL Season Predictor

An interactive web app for predicting the 2026 NFL season. Pick game-by-game outcomes for all 32 teams, view projected standings and playoff seeding, browse live player stats, and create a shareable infographic — all in the browser, with nothing leaving your device.

![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8) ![PWA](https://img.shields.io/badge/PWA-installable-green)

## Features

- **Game-by-Game Predictions** — Pick W/L/T for all 272 regular season games with automatic opponent syncing; picks stay in sync league-wide
- **Real-Time Validation** — Enforces league-wide balance (272 total wins), division constraints, and pairwise game limits
- **Division Standings** — Auto-generated standings sorted by wins, division record, and strength of schedule
- **Playoff Seeding** — AFC and NFC brackets with division winners and wild card spots
- **Shareable Infographic** — Build a custom bento-grid graphic with up to 11 insight sections (Best & Worst Records, Playoff Seeds, Division Winners, Conference Showdown, Toughest Division, Bold Predictions, Worst Division, Strength of Schedule, Closest Division Race, Wild Card Teams, Parity Index). Drag and resize sections, add your name/handle, and export as an image.
- **Team Search & Filter** — Search teams by name or abbreviation and filter by conference (AFC/NFC) from the predictions view
- **Player Browser** — Browse all 32 rosters by conference, division, and position; search players by name across the league
- **Player Profiles** — Full profile pages with headshot, career stats, per-game log, and Pro Bowl / All-Pro honors
- **Favorite Team Theming** — Pick your favorite NFL team to theme the app around their official colors; accent color applies to tab indicators, nav highlights, the progress bar, filter toggles, and more. Persists across sessions and respects dark/light mode.
- **Export / Import** — Save predictions as JSON and restore them on any device
- **Dark Mode** — Toggle between light and dark themes; persists across sessions
- **PWA / Installable** — Install to your home screen on iOS and Android; runs in standalone mode with full asset and API caching via a service worker
- **Responsive Layout** — Desktop: fixed sidebar with full navigation. Mobile/tablet: sticky top nav bar + bottom tab bar. Both layouts share the same content.
- **Client-Side Only** — All prediction data is stored in `localStorage`; nothing is sent to a server

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

```bash
docker compose up -d --build
```

The app will be available on port 80 by default. To use a different port:

```bash
PORT=8080 docker compose up -d --build
```

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 + CSS custom properties |
| Bento grid | react-grid-layout |
| Image export | html2canvas |
| Player data | ESPN public APIs (client-side) |
| PWA | vite-plugin-pwa + Workbox |
| Production serving | nginx (Docker) |

## Roadmap

| Version | Status | Description |
|---|---|---|
| v3.0 | ✅ Released | Broadcast Editorial visual overhaul — unified design token system, sidebar/bottom-tab navigation, Barlow Condensed editorial type, signature amber accent |
| v3.1 | ✅ Released | Favorite team theming — accent color system driven by official NFL team palettes, persisted team picker |
| v4.0 | Planned | Fantasy football / Sleeper league integration — custom scoring, start/sit recommendations, projections |
| v4.5 | Planned | Week-by-week schedule view *(blocked on 2026 season schedule data)* |

## Project Structure

```
src/
├── App.jsx                    # Root: layout, navigation state, modal orchestration
├── index.css                  # Design token system (CSS custom properties, light/dark)
├── main.jsx                   # React entry point
│
├── components/
│   ├── NavBar.jsx             # Mobile/tablet sticky top bar (hidden lg+)
│   ├── BottomTabBar.jsx       # Mobile/tablet fixed bottom tab bar (hidden lg+)
│   ├── Sidebar.jsx            # Desktop fixed sidebar with nav, actions, and footer
│   ├── SeasonSubNav.jsx       # Editorial tab row (Predictions / Standings / Playoffs)
│   ├── ActionSheet.jsx        # Mobile slide-up menu
│   ├── FavoriteTeamPicker.jsx # Full-screen team color theme picker
│   ├── TeamList.jsx           # Division cards with team rows
│   ├── TeamDetail.jsx         # Modal for editing a team's game-by-game predictions
│   ├── StandingsTable.jsx     # Division standings view
│   ├── PlayoffSeeding.jsx     # Playoff bracket view
│   ├── RecordSetter.jsx       # Win-loss-tie record controls
│   ├── GameResultToggle.jsx   # Individual game outcome toggle (W / L / T)
│   ├── DivisionMatrix.jsx     # Head-to-head results grid
│   ├── ExportPreview.jsx      # Export modal with section toggles and layout controls
│   ├── ShareableImage.jsx     # Interactive bento-grid infographic (11 sections)
│   ├── PlayerBrowser.jsx      # Roster browser with conference/division/position filter
│   ├── PlayerProfile.jsx      # Player profile page with hero card and stats
│   ├── PlayerStatTable.jsx    # Stat accordion with standard/advanced toggle and honors
│   ├── ErrorBoundary.jsx      # Top-level error boundary
│   └── Guide.jsx              # Getting-started guide modal
│
├── context/
│   ├── PredictionContext.jsx  # Game prediction state and localStorage sync
│   └── ThemeContext.jsx       # Dark mode + favorite team theming state and CSS var injection
│
├── data/
│   ├── teamColors.js          # Official color palettes for all 32 teams (light + dark variants)
│   ├── teamHistory.js         # Historical team records and context
│   └── honors.json            # Static Pro Bowl / All-Pro records by player and season
│
└── utils/
    ├── playerApi.js           # ESPN API fetches: roster, stats, game log, bio, depth chart
    ├── playerCache.js         # localStorage cache with per-key TTLs
    ├── playerMetrics.js       # Stat row definitions, headline metrics, and career highlights
    ├── scheduleParser.js      # Team/division queries and strength of schedule
    ├── validation.js          # Constraint checking and league-wide balance validation
    ├── exportImport.js        # JSON export and import
    ├── exportStats.js         # Highlight stat computations for the infographic sections
    └── layoutUtils.js         # Bento grid layout constants, sizing, and RGL helpers
```
