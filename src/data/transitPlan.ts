export type OperatorColor = {
  name: string
  hex: string
  note: string
}

export type ArchitectureSection = {
  title: string
  summary: string
  bullets: string[]
}

export type PackageGroup = {
  category: string
  packages: string[]
}

export type AlgorithmPlan = {
  title: string
  goal: string
  steps: string[]
}

export type DemoRoute = {
  id: string
  label: string
  mode: 'rail' | 'light-rail' | 'bus'
  operator: string
  frequency: string
  serviceWindow: string
}

export const operatorColors: OperatorColor[] = [
  {
    name: 'Israel Railways',
    hex: '#2457C5',
    note: 'Heavy rail trunk and suburban corridors.',
  },
  {
    name: 'Dankal',
    hex: '#D63B3B',
    note: 'Jerusalem and Tel Aviv light rail services.',
  },
  {
    name: 'Egged',
    hex: '#1B8E5A',
    note: 'Regional and intercity bus families.',
  },
]

export const architectureSections: ArchitectureSection[] = [
  {
    title: 'GTFS ingestion pipeline',
    summary: 'Normalize MOT feeds into an operator-aware graph before rendering.',
    bullets: [
      'Parse routes, trips, stop_times, stops, shapes, frequencies, calendar, translations, and accessibility fields.',
      'Build canonical station, trip-pattern, and hub indexes so rail, bus, and light rail can share transfer logic.',
      'Validate raw CSV rows with Zod before persisting a compact client cache for fast reloads.',
    ],
  },
  {
    title: 'Schematic graph engine',
    summary: 'Transform geographic routes into an editable octilinear topology.',
    bullets: [
      'Project stops into screen coordinates, cluster transfer hubs, and derive simplified polylines from GTFS shapes.',
      'Run octilinear snapping with edge penalties so line geometry prefers 0°, 45°, 90°, and 135° bearings.',
      'Persist user edits as deltas on top of generated coordinates so manual adjustments survive feed refreshes.',
    ],
  },
  {
    title: 'Interactive map workspace',
    summary: 'Use a node/edge canvas with sidebar-driven filtering, editing, and export flows.',
    bullets: [
      'React Flow powers node dragging, selection, and custom overlays for POIs, accessibility, and pathfinding.',
      'URL-synced state keeps selected lines, language, layers, and viewport shareable without a backend dependency.',
      'SVG/PDF export reuses the same scene graph to keep print output faithful to the interactive map.',
    ],
  },
]

export const packageGroups: PackageGroup[] = [
  {
    category: 'App shell',
    packages: ['react', 'react-dom', 'typescript', 'vite', 'tailwindcss', '@tailwindcss/vite'],
  },
  {
    category: 'Transit graph + state',
    packages: ['@xyflow/react', 'zustand', 'nuqs'],
  },
  {
    category: 'GTFS parsing + validation',
    packages: ['papaparse', 'zod', '@turf/turf'],
  },
  {
    category: 'Localization + export',
    packages: ['i18next', 'react-i18next', 'jspdf', 'svg2pdf.js'],
  },
  {
    category: 'Testing to add next',
    packages: ['vitest', '@testing-library/react', '@testing-library/user-event'],
  },
]

export const algorithmPlans: AlgorithmPlan[] = [
  {
    title: 'Octilinear snapping',
    goal: 'Generate a classic metro-map geometry while preserving route order and transfer readability.',
    steps: [
      'Start from GTFS stop coordinates and simplify each shape into anchor segments using Douglas-Peucker with a transit-safe tolerance.',
      'Map each segment bearing to the nearest octilinear angle and score alternatives with penalties for detours, crossings, and stop displacement.',
      'Use iterative relaxation: lock major hubs first, then solve adjacent segments while keeping station spacing above a minimum visual threshold.',
      'Snap manual drag operations back onto the same grid so hand-tuned edits remain consistent with auto-generated geometry.',
    ],
  },
  {
    title: 'Hub clustering',
    goal: 'Merge adjacent stop platforms and terminals into a single transfer node without losing operator detail.',
    steps: [
      'Create candidate groups using spatial proximity, shared station names, and GTFS parent_station relationships when present.',
      'Score every pair by walking distance, route overlap, accessibility parity, and transfer demand inferred from timed connections.',
      'Promote dense groups into one Transfer Hub node with child stop metadata retained for labels, accessibility icons, and pathfinding.',
      'Expose an override list for exceptional Israeli interchanges where planners want manual grouping or separation.',
    ],
  },
]

export const demoRoutes: DemoRoute[] = [
  {
    id: 'ir-a1',
    label: 'Israel Railways A1',
    mode: 'rail',
    operator: 'Israel Railways',
    frequency: 'Every 30 min',
    serviceWindow: 'Weekday + Friday daytime',
  },
  {
    id: 'jlr-red',
    label: 'Jerusalem Red Line',
    mode: 'light-rail',
    operator: 'Dankal',
    frequency: 'Every 6 min',
    serviceWindow: 'Extended evenings',
  },
  {
    id: 'egged-480',
    label: 'Egged 480',
    mode: 'bus',
    operator: 'Egged',
    frequency: 'Every 10 min',
    serviceWindow: 'Night + weekend variants',
  },
]
