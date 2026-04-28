# Design System Quick Ref — "Broadcast Editorial"

Full token table and dark-mode values: **`docs/Design Tokens.md`**

## Key Rules

- All colors via CSS custom properties in `src/index.css` — never hardcoded Tailwind palette or hex values in components. The `.dark` class on `<html>` swaps all values.
- `--color-signature` (`#F5B700`) is decorative only — never body text. Use `--color-signature-fg` for text ON signature backgrounds.
- `font-size: 16px` on all inputs (prevents iOS auto-zoom)
- Safe area insets: `env(safe-area-inset-bottom)` on fixed bottom bars
- Motion: spring-curve easing `cubic-bezier(0.32, 0.72, 0, 1)`

## Team Color Palettes

- NFL teams — `src/data/teamColors.js` (`TEAM_COLORS`, `getTeamPalette`). Used for Statistics, Companion, Scout Results pick rows, and the Compare/Heatmap surfaces.
- College teams — `src/data/collegeColors.js` (`COLLEGE_COLORS`, `getCollegePalette`, `buildCollegeRowGradient`, `getCollegeForeground`). Used for the optional Scout Prospects "Team Colors" toggle. Mirrors the NFL palette structure (primary / secondary / darkPrimary / darkSecondary) and the same `linear-gradient(135deg, primary 0%, darken(primary,0.28) 58%, secondary 100%)` row treatment used by Scout Results.
- When adding a new school to `ROOKIES_2026`, add a matching entry to `COLLEGE_COLORS` keyed by the normalized college name (`normalizeCollegeKey`). If the official primary is near-black or very dark navy, set `darkPrimary` to the brighter accent so the gradient still reads in dark mode.
