# NFL Season Predictor

An interactive web app for predicting the 2026 NFL season. Pick game-by-game outcomes for all 32 teams, view projected standings, and generate playoff seeding — all in the browser.

![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8)

## Features

- **Game-by-Game Predictions** — Pick winners for all 272 regular season games with automatic opponent syncing
- **Real-Time Validation** — Enforces league-wide balance (272 total wins), division constraints, and pairwise limits
- **Division Standings** — Auto-generated standings sorted by wins, division record, and strength of schedule
- **Playoff Seeding** — AFC and NFC brackets with division winners and wild card spots
- **Export/Import** — Save predictions as JSON or download a PNG image of all views; import JSON to restore picks
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

### Download from GitHub without git

If git isn't installed on your server, download the repo as a tarball:

```bash
curl -L https://github.com/thejrudd/nfl-predictor/archive/refs/heads/main.tar.gz | tar xz
cd nfl-predictor-main
docker compose up -d --build
```

> For private repos, use a [personal access token](https://github.com/settings/tokens):
> ```bash
> curl -L -H "Authorization: token YOUR_TOKEN" https://api.github.com/repos/thejrudd/nfl-predictor/tarball/main | tar xz
> ```

## Tech Stack

- **React 19** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Utility-first styling
- **html2canvas** — Image export
- **nginx** — Production static file serving (Docker)

## Roadmap

- **Compare Mode** — Import a friend's predictions and diff them against yours
- **Season Narrative** — Auto-generate a text summary of your predicted season ("The Bills go 14-3 and clinch the AFC East in Week 15...")
- **Historical Comparison** — Show how predicted records compare to each team's actual results from past seasons
- **Team Rosters & Stats** — Display roster and player stats for each team
- **Two-Column Division Grid** — AFC on the left, NFC on the right for better use of wide screens

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
│   └── DivisionMatrix.jsx   # Head-to-head results grid
├── context/
│   ├── PredictionContext.jsx # Prediction state and localStorage sync
│   └── ThemeContext.jsx      # Dark mode state
└── utils/
    ├── scheduleParser.js    # Team/division queries, strength of schedule
    ├── validation.js        # Constraint checking and balance validation
    └── exportImport.js      # JSON and image export/import
```
