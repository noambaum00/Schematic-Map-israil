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

export type FrequencyTier = 'HIGH_FREQUENCY' | 'MEDIUM_FREQUENCY' | 'LOW_FREQUENCY'

export type AlgorithmPlan = {
  title: string
  goal: string
  steps: string[]
}

export const operatorColors: OperatorColor[] = [
  {
    name: 'Israel Railways',
    hex: '#0033A0',
    note: 'Heavy rail trunk and suburban corridors.',
  },
  {
    name: 'Dankal / NTA',
    hex: '#E31837',
    note: 'Light rail corridors and urban rapid transit.',
  },
  {
    name: 'Egged',
    hex: '#007A33',
    note: 'Regional and intercity bus families.',
  },
  {
    name: 'Dan',
    hex: '#FF7900',
    note: 'Gush Dan urban and metropolitan bus services.',
  },
  {
    name: 'Kavim',
    hex: '#00AEEF',
    note: 'Urban and regional bus corridors.',
  },
]

export const architectureSections: ArchitectureSection[] = [
  {
    title: 'In-browser GTFS ingestion',
    summary: 'Load a real GTFS zip directly in the browser with no mock data layer.',
    bullets: [
      'Parse agency, routes, trips, stop_times, stops, and optional translations from the uploaded MOT GTFS archive.',
      'Validate required columns with Zod before building route summaries and stop sequences.',
      'Keep the feed ephemeral in client state so GitHub Pages can host the app without a backend.',
      'Derive official operator colors and rough trip-count frequency tiers directly from GTFS agencies and routes.',
    ],
  },
  {
    title: 'React Flow canvas',
    summary: 'Render the selected GTFS route as an editable schematic graph instead of a static SVG preview.',
    bullets: [
      'Map GTFS stops into regular station nodes and clustered transfer hub nodes with distinct styling.',
      'Render route segments as octilinear React Flow edges that keep to horizontal, vertical, and 45° diagonals.',
      'Style visible lines with operator-specific colors and thickness tiers that reflect route frequency.',
      'Register a distinct POI node type so user-authored landmarks can be styled and edited independently.',
      'Support grid-snapped drag, manual connect, selection, and export interactions directly on the graph canvas.',
    ],
  },
  {
    title: 'Client-side sharing + Pages hosting',
    summary: 'Keep collaboration and publishing compatible with a static GitHub Pages deployment.',
    bullets: [
      'Use html-to-image to capture the fitted React Flow canvas as a downloadable SVG.',
      'Serialize selected routes, POIs, and node positions into a compressed URL-safe permalink.',
      'Preserve the Vite base path and hash-based sharing required for repository-based GitHub Pages hosting.',
      'Avoid server-only dependencies so the same build works locally and on Pages.',
    ],
  },
]

export const packageGroups: PackageGroup[] = [
  {
    category: 'App shell',
    packages: ['react', 'react-dom', 'typescript', 'vite', 'tailwindcss', '@tailwindcss/vite'],
  },
  {
    category: 'GTFS parsing',
    packages: ['jszip', 'papaparse', 'zod'],
  },
  {
    category: 'Canvas + export',
    packages: ['@xyflow/react', 'html-to-image'],
  },
  {
    category: 'State sharing',
    packages: ['lz-string'],
  },
]

export const algorithmPlans: AlgorithmPlan[] = [
  {
    title: 'Representative trip selection',
    goal: 'Pick one GTFS trip pattern per route that produces a readable station sequence for the schematic.',
    steps: [
      'Group trips by route and collect stop_times for each trip from the uploaded GTFS feed.',
      'Prefer the trip with the most ordered stops as the base pattern for the route preview.',
      'Collapse duplicate consecutive stops so terminal loops do not create repeated station nodes.',
    ],
  },
  {
    title: 'Israel Railways train-series labels',
    goal: 'Display an edge label like 2XX or 4XX directly from route_short_name or trip_short_name.',
    steps: [
      'Scan rail route and trip short names for existing series tokens or 3-4 digit train numbers.',
      'Normalize matched train numbers into templates by keeping the first digit and replacing the rest with X.',
      'Render the resulting series string on each segment of the selected rail route in the graph.',
    ],
  },
  {
    title: 'POI placement + export',
    goal: 'Create new landmark nodes at the visible canvas center and export the full graph without cropping.',
    steps: [
      'Convert the center of the visible React Flow pane into flow coordinates before creating a POI node.',
      'Let React Flow handle manual onConnect edges between POI and GTFS nodes.',
      'Fit the graph into view before calling html-to-image on `.react-flow` so exports include the whole canvas and edge labels.',
    ],
  },
  {
    title: 'State serialization + restore',
    goal: 'Share the current schematic through a compressed GitHub Pages-safe URL and restore it later.',
    steps: [
      'Collect the selected route IDs, POI nodes, manual edges, and current node positions from the live canvas state.',
      'Compress the JSON payload with lz-string before writing it to a hash-based URL parameter.',
      'Read the shared payload on startup and re-apply it after the matching GTFS feed is loaded.',
    ],
  },
  {
    title: 'Operator styling + frequency tiers',
    goal: 'Match visible route styling to official operators and rough service levels from GTFS data.',
    steps: [
      'Resolve each route to its GTFS agency and map that operator to a recognizable hex color.',
      'Count route trips over the loaded feed and classify them into high, medium, or low frequency tiers.',
      'Use the resulting operator color and frequency tier in both line rendering and the floating legend.',
    ],
  },
  {
    title: 'Octilinear schematic routing',
    goal: 'Keep rendered route geometry aligned to classic transit-map angles while preserving train labels.',
    steps: [
      'Measure the horizontal and vertical offset between each connected node pair.',
      'Generate a path that uses either a direct segment or a horizontal/vertical segment followed by a 45° diagonal.',
      'Place the train-series label at the midpoint of the longest path segment so it stays legible.',
    ],
  },
]

export function getOperatorColor(operatorName: string) {
  const normalizedName = operatorName.toLowerCase()

  if (normalizedName.includes('israel rail') || normalizedName.includes('railways') || normalizedName.includes('רכבת')) {
    return '#0033A0'
  }

  if (normalizedName.includes('dankal') || normalizedName.includes('נת"ע') || normalizedName.includes('nta') || normalizedName.includes('light rail')) {
    return '#E31837'
  }

  if (normalizedName.includes('egged')) {
    return '#007A33'
  }

  if (normalizedName.includes('דן') || normalizedName.includes(' dan ') || normalizedName.startsWith('dan')) {
    return '#FF7900'
  }

  if (normalizedName.includes('kavim') || normalizedName.includes('קווים')) {
    return '#00AEEF'
  }

  if (normalizedName.includes('bus')) {
    return '#F59E0B'
  }

  return '#38BDF8'
}

export function classifyFrequencyTier(tripCount: number): FrequencyTier {
  if (tripCount >= 120) {
    return 'HIGH_FREQUENCY'
  }

  if (tripCount >= 40) {
    return 'MEDIUM_FREQUENCY'
  }

  return 'LOW_FREQUENCY'
}

export function getFrequencyStrokeStyle(frequencyTier: FrequencyTier) {
  if (frequencyTier === 'HIGH_FREQUENCY') {
    return { strokeDasharray: undefined, strokeWidth: 6 }
  }

  if (frequencyTier === 'MEDIUM_FREQUENCY') {
    return { strokeDasharray: undefined, strokeWidth: 4 }
  }

  return { strokeDasharray: '10 8', strokeWidth: 2 }
}
