# Schematic Map Israel

A Vite + React + TypeScript app for generating schematic transit views for Israel's public transportation network.

## Phase 2 status

This phase removes mock route data and replaces it with a real in-browser GTFS ingestion flow.

### Implemented now
- upload and parse a real Israel MOT GTFS zip archive in the browser
- derive live route summaries from `agency.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, and `stops.txt`
- search and select real routes after loading a GTFS feed
- render a live schematic SVG preview for the selected route
- display Israel Railways train-series labels like `2XX` and `4XX` directly on route edges
- configure Vite and GitHub Actions for GitHub Pages deployment

## How to use

```bash
npm install
npm run dev
```

Then open the app and upload an official MOT GTFS `.zip` archive.

## GitHub Pages

The app is configured for repository Pages deployment, and the Vite `base` value in `vite.config.ts` should match the repository name used for GitHub Pages hosting.

Deployment workflow:
- `.github/workflows/deploy-pages.yml`
- builds with `npm ci && npm run build`
- publishes the `dist/` directory via GitHub Pages

## Current GTFS parsing scope

The current Phase 2 parser reads:
- `agency.txt`
- `routes.txt`
- `trips.txt`
- `stop_times.txt`
- `stops.txt`

It uses the longest available trip pattern per route as the schematic preview source.

## Train number templates

For Israel Railways routes, the app scans `route_short_name` and `trip_short_name` for:
- explicit templates such as `2XX`
- 3-4 digit train numbers, which are normalized into templates like `2XX` or `4XXX`

The detected template is rendered directly on the line segments of the selected rail route.

## Next steps

Future phases can extend this base with:
- multi-route overlays
- octilinear snapping
- transfer hub clustering
- accessibility layers
- pathfinding
- SVG/PDF export
- permalink serialization
