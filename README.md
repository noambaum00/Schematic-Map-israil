# Schematic Map Israel

A Vite + React + TypeScript planning shell for an advanced schematic transit map generator for Israel's public transportation network.

## Current scope

This first slice focuses on the requested **project architecture outline**, **octilinear snapping + hub clustering algorithms**, **required npm package inventory**, and a **main layout component** with:

- a planning sidebar
- a searchable line-selection input
- language toggles for English, Hebrew, and Arabic
- a schematic map canvas placeholder
- architectural notes for GTFS ingestion, schematic generation, and export

## Proposed architecture

### 1. GTFS ingestion pipeline
- Parse `routes`, `trips`, `stop_times`, `stops`, `shapes`, `frequencies`, `calendar`, `translations`, and wheelchair accessibility fields from the Israel MOT feed.
- Validate rows with `zod`, normalize operator IDs, and derive canonical station/trip-pattern/hub indexes.
- Cache a compact graph model for fast client hydration and future server-side preprocessing.

### 2. Schematic graph engine
- Convert geographic stops + shapes into a topological graph that preserves route order and transfer points.
- Detect transfer hubs before layout so clustered stations share one schematic node and consistent labels.
- Persist user edits as deltas layered over generated coordinates instead of mutating raw GTFS data.

### 3. Interactive editor
- Render nodes and edges with React Flow while using a URL-synced state store for filters, styling overrides, and viewport state.
- Support layer toggles for operator colors, frequency stroke width, accessibility, night service, and weekend/Shabbat service.
- Reuse the same scene graph for SVG/PDF export and future collaboration persistence.

## Algorithm proposals

### Octilinear snapping (45° grid)
1. Simplify GTFS shapes into anchor segments with a conservative Douglas-Peucker pass.
2. Quantize each segment to the closest octilinear bearing (`0°`, `45°`, `90°`, `135°`, etc.).
3. Score layout candidates using penalties for line crossings, station displacement, inconsistent spacing, and unnecessary bends.
4. Solve major interchanges first, then relax neighboring segments iteratively.
5. Reapply the same snap logic to manual node drags so user edits remain schematic.

### Complex hub clustering
1. Generate candidate stop groups using spatial distance, `parent_station`, and normalized station names.
2. Score candidate groups by walking distance, shared routes, accessibility parity, and expected transfer demand.
3. Promote high-confidence groups into one `Transfer Hub` node while preserving child stop metadata.
4. Keep a manual override registry for exceptional interchanges that need planner control.

## Required npm packages

### Installed now
- `react`
- `react-dom`
- `typescript`
- `vite`
- `tailwindcss`
- `@tailwindcss/vite`

### Planned for upcoming feature slices
- `@xyflow/react` for the interactive node/edge canvas
- `zustand` + `nuqs` for app state and URL serialization
- `papaparse` + `zod` + `@turf/turf` for GTFS parsing, validation, and spatial calculations
- `i18next` + `react-i18next` for English/Hebrew/Arabic localization
- `jspdf` + `svg2pdf.js` for print-quality export
- `vitest` + `@testing-library/react` for focused UI tests

## Available scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```
