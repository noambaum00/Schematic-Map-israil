# Schematic Map Israel

A Vite + React + TypeScript app for generating schematic transit views for Israel's public transportation network.

## Phase 3 status

This phase upgrades the live GTFS route view into an interactive React Flow canvas.

### Implemented now
- upload and parse a real Israel MOT GTFS zip archive in the browser
- derive live route summaries from `agency.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, and `stops.txt`
- render the selected route as a React Flow graph with draggable transit station nodes
- display Israel Railways train-series labels like `2XX` and `4XX` directly on route edges
- add Point of Interest (POI) nodes at the center of the visible canvas
- edit the selected POI label from the sidebar
- manually draw new edges between POI and transit nodes with standard React Flow connections
- export the full fitted graph as a high-resolution SVG using `html-to-image`
- optionally configure Vite and a deployment GitHub Actions workflow for GitHub Pages publishing on pushes to `main`

## New npm dependencies

- `@xyflow/react`
- `html-to-image`

## How to use

```bash
npm install
npm run dev
```

Then open the app, upload an official MOT GTFS `.zip` archive, add POIs from the sidebar, and export the current graph as SVG.

## Optional GitHub Pages publishing

Local development does not require any GitHub Pages setup. If you want to publish the app, the Vite `base` value in `vite.config.ts` should match the repository name used for GitHub Pages hosting.

Optional deployment workflow:
- `.github/workflows/deploy-pages.yml`
- builds with `npm ci && npm run build`
- publishes the `dist/` directory via GitHub Pages

Repository settings required:
- open **Settings → Pages** in GitHub
- set **Source** to **GitHub Actions**
- keep the repository name aligned with the Vite `base` value in `vite.config.ts`

## Current GTFS parsing scope

The current parser reads:
- `agency.txt` (optional)
- `routes.txt`
- `trips.txt`
- `stop_times.txt`
- `stops.txt`

It uses the longest available trip pattern per route as the initial graph source, and preserves wheelchair status as accessible, inaccessible, or unknown.

## Export behavior

Before exporting, the app temporarily calls React Flow fit-to-view behavior so the entire graph is inside the viewport bounds. The export utility then captures `.react-flow__viewport` and triggers an automatic `.svg` download.
