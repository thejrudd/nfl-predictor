# NFL Predictor — Roadmap

## Versioned Releases

### v2.1 — PWA Support
Make the app installable as a native-feeling app on iOS and Android home screens.
- Add `manifest.json` with app name, icons, theme color, and `display: standalone`
- Register a service worker for asset caching and faster repeat loads
- Generate required icon sizes (192px, 512px minimum)
- Link manifest in `index.html`
- Integrate via `vite-plugin-pwa` for automatic manifest + service worker generation

### ~~v2.2 — Collapsing Header~~
~~Maximize usable screen space by collapsing the header on scroll. When scrolling down, the app title, view tab buttons, and desktop controls slide up and out of view, leaving only the dark/light mode toggle, teams-predicted count, and menu button visible. Scrolling back up reveals the full header again. Implemented via scroll direction tracking and CSS height/opacity transitions on the sticky header.~~ **Shipped in v2.2. Patched in v2.2.1** (delta-based scroll tracking, larger collapse zone). **Patched in v2.2.2** (jitter dead zone, smooth top expansion). **Patched in v2.2.3** (position-based with measured heights; content locked to header bottom). **Patched in v2.2.4** (spacer div cancels document-flow shift; content truly locked to header bottom with no slipping).

### v2.3 — Search / Filter
Quick-find a team or filter by division/conference directly from the main predictions view.

### v2.4 — Week-by-Week View
Browse the schedule by week instead of by team, to see all matchups for a given week.

### v2.5 — Season Narrative
Auto-generate a text summary of your predicted season (e.g. "The Bills go 14-3 and clinch the AFC East in Week 15..."). Could include division race storylines, upset picks, and playoff implications.

### v2.6 — Historical Comparison
Show how your predicted record for each team compares to their actual results from recent seasons. Highlight where you're more bullish or bearish than history.

### v3.0 — Fantasy Football / Sleeper League Integration
Allow users to connect their Sleeper league and surface fantasy-relevant insights from player stat data. Should include:
- Sleeper league import (connect via Sleeper username or league ID)
- Custom scoring rule input (PPR, half-PPR, standard; passing/rushing/receiving TD values; bonus thresholds; etc.)
- Per-player fantasy point totals calculated from historical and current-season stats
- Start/sit recommendations based on recent performance, matchup, and depth chart position
- Waiver wire / pickup suggestions based on available players and projected output
- Season-long projections and rankings by position under the user's scoring system

### v4.0 — Visual Overhaul
A ground-up redesign of the app's visual language and UI consistency. Goals:
- Unified design system — consistent spacing, typography scale, and color tokens across all views
- Redesigned prediction cards and team rows with richer visual hierarchy
- Improved standings and playoff bracket presentation
- Polished mobile experience with touch-optimized interactions
- Smoother transitions and micro-animations throughout
- Potential dark mode refinement or new theme options

---

## Features (Unversioned)

### Image Export Redesign
Redesign as a compact, shareable summary (~1080x1080, Instagram post size) instead of a raw page screenshot. Show all team picks in a clean grid layout rather than dumping every app view into one tall image.

### ~~Player Info & Rosters~~
~~Add a player info section accessible from each team view, pulled client-side from a public API (e.g. ESPN, nfl.com, or sportsdata.io) to keep server load minimal.~~ **Shipped in v2.0.**

### Compare Mode
Import a friend's exported JSON predictions and diff them against yours — highlight where you agree/disagree, show side-by-side records, and surface the biggest divergences.

---

## Fun / Analytics

### ~~Season Narrative~~
~~Auto-generate a text summary of your predicted season.~~ **Planned for v2.5.**

### ~~Historical Comparison~~
~~Show how your predicted record for each team compares to their actual results from recent seasons.~~ **Planned for v2.6.**

---

## ChatGPT Suggested

### ~~Playoff Auto-Builder~~
~~Compute a full playoff picture directly from saved picks — no backend needed.~~ **Shipped in v1.x.**

### Shareable Prediction Card
A dedicated `<PredictionCard />` component that renders a clean per-team card showing:
- Team name and logo
- Predicted record
- Projected seed
- Division finish

Export via canvas (`useRef` → render to canvas → `toBlob()`), avoiding HTML screenshot limitations.

### Monte Carlo Simulation (Client-Side)
Run 1,000 in-memory simulations using win probabilities derived from binary picks. Store results in a `Map` and calculate playoff odds as a percentage. Use a Web Worker if scaling above 5,000 simulations.

Architecture: all simulation logic isolated in `/utils/simEngine.ts`, triggered only when picks change (not on every re-render).

### Playoff Leverage Index
For each game, run two simulations — one with each team winning — and compare the resulting playoff probability delta. Display something like: *"This game swings playoff odds by 18%."* Built on top of the Monte Carlo simulation engine.

### Strength of Schedule Bias Slider
A global "Team Rating Bias" slider that bumps win probability by ~5–7% per unit and applies the modifier before simulation runs.

### Future Analytics (Post-Simulation)
- Weekly playoff probability graph (Recharts)
- Momentum graph per team
- Seed movement animation (Tailwind transitions)

---

## Claude Suggested

### Community & Social

#### Shareable Links
Encode predictions into a URL hash so users can share a link instead of a file — no import/export needed, just copy and send.

#### Leaderboard / Accuracy Tracker
Once the real season starts, track how accurate each user's predictions were week by week. Compare predicted outcomes to actual results as the season unfolds.

### UX Enhancements

#### Undo/Redo
Add undo support so users can back out of recent changes without resetting everything.

#### ~~Randomize Predictions~~
~~A "fill random" button that generates a valid set of predictions instantly.~~ **Shipped in v1.x.**

### Data & Analytics

#### Strength of Schedule Visualization
A chart or ranking showing each team's predicted strength of schedule based on your picks.

#### Win Probability Overlay
Pull Vegas odds or public power rankings to show how your picks compare to consensus.

#### Draft Order Projection
Show projected draft order for non-playoff teams based on predicted records.

### Polish

#### ~~PWA Support~~
~~Add a manifest and service worker so the app can be installed on mobile home screens as a native-feeling app.~~ **Shipped in v2.1.**

#### Richer PWA Install UI *(backburner)*
Add `screenshots` to the web manifest so Chrome shows the enhanced install dialog with app previews. Requires one desktop screenshot (1280×800, `form_factor: wide`) and one mobile screenshot (390×844, `form_factor: narrow`) saved to `public/screenshots/` and referenced in the `screenshots` array in `vite.config.js`. Non-blocking — basic install prompt works without this.

#### Confetti / Animations
Celebrate when all 32 teams are predicted and the season is valid.
