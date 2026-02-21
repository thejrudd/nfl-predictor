# Changelog

## v1.1.2 (2026-02-20)

### Improvements

- **Independent Division Collapse on Mobile** — On single-column (mobile) view, collapsing a division card now only collapses that individual division instead of both AFC and NFC. On two-column (desktop) view, clicking either card still collapses both side-by-side as before.

## v1.1.1 (2026-02-20)

### New Features

- **Drag & Resize Bento Grid** — The "Create Image" export preview now uses a fully interactive grid powered by react-grid-layout. Drag sections to reorder and resize them by pulling the corner handle. The layout uses a 4-column by 12-row grid with freeform placement and collision prevention.
- **5 New Insight Sections** — Added Worst Division, Strength of Schedule, Closest Division Race, Wild Card Teams, and Parity Index to the export graphic alongside the original 6 sections.
- **Section Toggles** — Enable or disable any of the 11 sections via checkboxes in the export modal sidebar. The bento grid auto-assigns sections to cells based on aspect ratio matching.
- **Reset Layout** — One-click button to return the bento grid to its smart default arrangement after manual rearranging.
- **User Name / Handle** — Enter your name or social handle to display "Predictions by ..." on the export graphic.
- **Per-Section Size Limits** — Each section enforces minimum and maximum grid dimensions (minW/minH/maxW/maxH) so sections can't be resized into unusable shapes.
- **Larger Preview** — Export preview scaled up from 540px to 756px (0.7x) for improved readability of text and logos.
- **About Link** — Added an "About" button to the header menu (desktop and mobile) linking to the GitHub repository.

### Improvements

- **Playoff Seeds Always Show 7** — The Playoff Seeds section now consistently displays seeds 1-7 for both conferences instead of dynamically varying by cell height.
- **Section Title Wrapping** — Section titles now wrap with `word-break: break-word` instead of truncating with ellipsis, so longer titles like "Strength of Schedule" remain fully visible.
- **Overflow Handling** — Sections that overflow the grid bounds on resize are automatically disabled rather than causing layout corruption.
- **Layout Stability** — Uses `onDragStop`/`onResizeStop` callbacks instead of `onLayoutChange` to prevent collision cascades when toggling sections.

### Other

- Updated version footer from v1.0.2 to v1.1.1.
- Added GitHub repository link to header menu.
