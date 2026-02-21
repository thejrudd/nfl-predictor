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

## Roadmap

**v2.0**
- **Player Info & Rosters** — Player headshots, stats, and accomplishments pulled client-side from public APIs
- **Image Download** — Export the infographic as a downloadable PNG

**Future**
- **Historical Comparison** — Compare predicted records to each team's actual results from past seasons
- **Compare Mode** — Import a friend's predictions and diff them against yours
- **Season Narrative** — Auto-generate a text summary of your predicted season

## Project Structure

```
src/
├── App.jsx                  # Main app container and header controls
├── components/
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
└── utils/
    ├── scheduleParser.js    # Team/division queries, strength of schedule
    ├── validation.js        # Constraint checking and balance validation
    ├── exportImport.js      # JSON export/import
    ├── exportStats.js       # Highlight stat computations for the infographic
    └── layoutUtils.js       # Bento grid layout constants, sizing, and RGL helpers
```
