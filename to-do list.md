# NFL Predictor — Roadmap

## Features

### Image Export Redesign
Redesign as a compact, shareable summary (~1080x1080, Instagram post size) instead of a raw page screenshot. Show all team picks in a clean grid layout rather than dumping every app view into one tall image.

### Player Info & Rosters
Add a player info section accessible from each team view, pulled client-side from a public API (e.g. ESPN, nfl.com, or sportsdata.io) to keep server load minimal. Should include:
- Player headshots
- Key stats (passing yards, TDs, tackles, etc.)
- Position and jersey number
- Notable accomplishments (Pro Bowl, All-Pro, awards)
- Historical record
- Team history
- Career length (starting year)
- Interesting tidbits and facts about the player
- Ranking

### Compare Mode
Import a friend's exported JSON predictions and diff them against yours — highlight where you agree/disagree, show side-by-side records, and surface the biggest divergences.

## Fun / Analytics

### Season Narrative
Auto-generate a text summary of your predicted season (e.g. "The Bills go 14-3 and clinch the AFC East in Week 15..."). Could include division race storylines, upset picks, and playoff implications.

### Historical Comparison
Show how your predicted record for each team compares to their actual results from recent seasons. Highlight where you're more bullish or bearish than history.

## Claude Suggested

### Community & Social

#### Shareable Links
Encode predictions into a URL hash so users can share a link instead of a file — no import/export needed, just copy and send.

#### Leaderboard / Accuracy Tracker
Once the real season starts, track how accurate each user's predictions were week by week. Compare predicted outcomes to actual results as the season unfolds.

### UX Enhancements

#### Undo/Redo
Add undo support so users can back out of recent changes without resetting everything.

#### Randomize Predictions
A "fill random" button that generates a valid set of predictions instantly — fun for casual users or testing.

#### Week-by-Week View
Browse the schedule by week instead of by team, to see all matchups for a given week.

#### Search/Filter
Quick-find a team or filter by division/conference.

### Data & Analytics

#### Strength of Schedule Visualization
A chart or ranking showing each team's predicted strength of schedule based on your picks.

#### Win Probability Overlay
Pull Vegas odds or public power rankings to show how your picks compare to consensus.

#### Draft Order Projection
Show projected draft order for non-playoff teams based on predicted records.

### Polish

#### PWA Support
Add a manifest and service worker so the app can be installed on mobile home screens as a native-feeling app.

#### Confetti / Animations
Celebrate when all 32 teams are predicted and the season is valid.
