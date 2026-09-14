# Schematic Map Israel

A Vite + React + TypeScript app for generating schematic transit views for Israel's public transportation network.

## Phase 5 status

This phase upgrades the React Flow rendering to look more like a classic schematic transit diagram, using dedicated transfer-hub nodes, octilinear route edges, and grid-snapped dragging.

### Implemented now
- upload and parse a real Israel MOT GTFS zip archive in the browser
- derive live route summaries from `agency.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, and `stops.txt`
- preprocess GTFS stops into transfer hubs using parent_station hierarchy first and geospatial proximity second
- remap route stop sequences through a stop-to-hub dictionary before generating graph edges
- render the selected route as a React Flow graph with draggable transit station and transfer-hub nodes
- display transfer hubs with a dedicated interchange node style and outside labels
- render route segments as octilinear edges using only horizontal, vertical, and 45° diagonal segments
- display Israel Railways train-series labels like `2XX` and `4XX` on the longest route segment of each schematic edge
- add Point of Interest (POI) nodes at the center of the visible canvas
- edit the selected POI label from the sidebar
- manually draw new edges between POI and transit nodes with standard React Flow connections
- export the full fitted graph as a high-resolution SVG using `html-to-image`
- snap node dragging to a `20 x 20` grid for cleaner manual schematic adjustments
- use the included Vite base-path configuration and GitHub Actions workflow for GitHub Pages publishing on pushes to `main`

## New npm dependencies

- no new packages are required for the Phase 5 schematic styling work
- optional future alternative: `@turf/distance` or `geolib` if you prefer external geospatial helpers
- existing canvas/export packages remain `@xyflow/react` and `html-to-image`

## How to use

```bash
npm install
npm run dev
```

Then open the app, upload an official MOT GTFS `.zip` archive, drag stations and hubs on the schematic grid, add POIs from the sidebar, and export the current graph as SVG.

## GitHub Pages publishing

This project now includes a GitHub Pages deployment workflow, and production builds are coupled to the repository-specific Vite `base` value in `vite.config.ts`. The current production base is hard-coded to `/Schematic-Map-israil/`, so Pages deployment expects the exact repository slug `noambaum00/Schematic-Map-israil`; if the slug changes, update `vite.config.ts` before publishing. Local development does not require Pages setup.

Configured deployment workflow:
- `.github/workflows/deploy-pages.yml`
- builds with `npm ci && npm run build`
- publishes the `dist/` directory via GitHub Pages

Repository settings required:
- open **Settings → Pages** in GitHub
- set **Source** to **GitHub Actions**
- keep the repository slug aligned with the Vite `base` value `/Schematic-Map-israil/`, or change `vite.config.ts` before using a different production hosting path

## Current GTFS parsing scope

The current parser reads and preprocesses:
- `agency.txt` (optional)
- `routes.txt`
- `trips.txt`
- `stop_times.txt`
- `stops.txt`

It uses the longest available trip pattern per route as the initial graph source, preserves wheelchair status as accessible, inaccessible, or unknown, and merges clustered stops into centroid-based transfer hubs with `constituent_stop_ids` metadata.

## Export behavior

Before exporting, the app temporarily calls React Flow fit-to-view behavior so the entire graph is inside the viewport bounds. The export utility then captures `.react-flow__viewport` and triggers an automatic `.svg` download.

## Schematic rendering behavior

- regular stops render as compact station nodes
- clustered transfer hubs render as prominent interchange markers with external labels
- route edges use a custom octilinear SVG path generator
- manual node dragging snaps to a `20 x 20` canvas grid
