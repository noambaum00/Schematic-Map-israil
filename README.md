# Schematic Map Israel

A Vite + React + TypeScript app for generating schematic transit views for Israel's public transportation network.

## Phase 8 status

This phase adds automated MOT GTFS fetching at build time together with a lighter white-and-blue application theme.

### Implemented now
- download the latest official MOT GTFS zip during build-time preprocessing
- extract `agency.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt`, and optional `translations.txt` into a temporary directory before processing
- generate `public/transit_graph.json` from the processed GTFS feed for static GitHub Pages hosting
- auto-load the bundled processed feed when the app opens, while still allowing manual GTFS zip replacement from the sidebar
- preprocess GTFS stops into transfer hubs using parent_station hierarchy first and geospatial proximity second
- remap route stop sequences through a stop-to-hub dictionary before generating graph edges
- render the selected route as a React Flow graph with draggable transit station and transfer-hub nodes
- display transfer hubs with a dedicated interchange node style and outside labels
- render route segments as octilinear edges using only horizontal, vertical, and 45° diagonal segments
- display Israel Railways train-series labels like `2XX` and `4XX` on the longest route segment of each schematic edge
- add Point of Interest (POI) nodes at the center of the visible canvas
- edit the selected POI label from the sidebar
- manually draw new edges between POI and transit nodes with standard React Flow connections
- export the full fitted graph as a vector SVG using `html-to-image`
- compress selected routes, POIs, manual links, and node positions into a shareable map URL with `lz-string`
- restore shared route/layout state from GitHub Pages-safe `#/?state=...` links
- switch stop and hub labels dynamically between English, Hebrew, and Arabic without resetting manual node positions
- apply RTL/LTR document direction dynamically when Hebrew or Arabic is selected
- snap node dragging to a `20 x 20` grid for cleaner manual schematic adjustments
- map visible routes to official operator colors such as Israel Railways blue, Dankal red, Egged green, Dan orange, and Kavim light blue
- classify routes into high, medium, and low frequency tiers by counting GTFS trips per route in the loaded feed
- render high-frequency lines thicker and low-frequency lines with lighter dashed strokes
- display a floating legend that explains the active operator color and frequency styling
- use a clean white-and-blue Tailwind theme across the sidebar, workspace, legend, nodes, and selection states
- deploy GitHub Pages builds from both `.github/workflows/deploy-pages.yml` and nightly `.github/workflows/gtfs-update.yml`

## New npm dependencies

- `axios` for downloading the latest GTFS archive during build-time processing
- `adm-zip` for extracting required GTFS files into a temporary directory
- `lz-string` for compressed URL-safe state serialization
- existing canvas/export packages remain `@xyflow/react` and `html-to-image`

## How to use

```bash
npm install
npm run dev
```

If `public/transit_graph.json` is missing or stale, or if you are working specifically on the GTFS refresh flow, run `npm run gtfs:update` before opening the app. Then browse the bundled MOT feed, optionally replace it with another official GTFS `.zip` archive, drag stations and hubs on the schematic grid, add POIs, copy a share link, and export the current graph as SVG.

## GitHub Pages publishing

This project is configured for GitHub Pages deployment through `.github/workflows/deploy-pages.yml` and `.github/workflows/gtfs-update.yml`, and production builds are coupled to the Vite `base` value in `vite.config.ts`. The current production base is explicitly set to `/Schematic-Map-israil/`, so the published GitHub Pages path must use that exact repository slug, or you must update `vite.config.ts` before publishing. Forks or renamed repositories will break on GitHub Pages until that `base` value is changed to match their deployed path. Local development does not require Pages setup.

Configured deployment workflows:
- `.github/workflows/deploy-pages.yml`
  - runs on pushes to `main`
  - fetches the latest GTFS feed with `npm run gtfs:update`
  - builds with `npm ci && npm run build`
- `.github/workflows/gtfs-update.yml`
  - runs nightly at `0 2 * * *` and on manual dispatch
  - fetches the latest GTFS feed with `npm run gtfs:update`
  - builds and publishes the `dist/` directory via GitHub Pages

Repository settings required:
- open **Settings → Pages** in GitHub
- set **Source** to **GitHub Actions**
- keep the published Pages path aligned with the configured `/Schematic-Map-israil/` Vite `base` value in `vite.config.ts`, or change `vite.config.ts` before using a different production hosting path; forks and renamed repositories must update that value before publishing

## Current GTFS parsing scope

The parser reads and preprocesses:
- `agency.txt` (optional)
- `routes.txt`
- `trips.txt`
- `stop_times.txt`
- `stops.txt`
- `translations.txt` (optional)

It uses the longest available trip pattern per route as the initial graph source, preserves wheelchair status as accessible, inaccessible, or unknown, merges clustered stops into centroid-based transfer hubs with `constituent_stop_ids` metadata, and keeps localized English, Hebrew, and Arabic stop names when available.

## Export behavior

Before exporting, the app temporarily calls React Flow fit-to-view behavior so the entire graph is inside the viewport bounds. The export utility then captures `.react-flow` so both the graph and edge-label overlays are included, and triggers an automatic `.svg` download.

## Shareable state behavior

- the app writes compressed shared state into `#/?state=...` so GitHub Pages can open shared links without server-side routing
- saved state includes the selected route IDs, POI nodes, manual POI connections, and current node positions
- when a shared URL is opened, the app restores the saved language immediately and reapplies the saved canvas state after the matching GTFS feed is loaded

## Schematic rendering behavior

- regular stops render as compact station nodes
- clustered transfer hubs render as prominent interchange markers with external labels
- route edges use a custom octilinear SVG path generator
- manual node dragging snaps to a `20 x 20` canvas grid
- route strokes inherit operator-specific colors from GTFS agency matching
- route trip counts are bucketed into `HIGH_FREQUENCY`, `MEDIUM_FREQUENCY`, and `LOW_FREQUENCY` tiers
