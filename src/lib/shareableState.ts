import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { z } from 'zod'

import { edgeRoutingStyles, type CanvasEdge, type EdgeCustomization, type EdgeRoutingStyle, type POICanvasNode } from './canvasGraph'
import type { TransitLanguage } from './gtfs'

const edgeCustomizationSchema = z.object({
  customColor: z.string().min(1).optional(),
  customStrokeWidth: z.number().min(1).max(15).optional(),
})

const version2ShareableMapStateSchema = z.object({
  version: z.literal(2),
  edgeCustomizations: z
    .array(
      z.object({
        ...edgeCustomizationSchema.shape,
        id: z.string().min(1),
      }),
    )
    .default([]),
  globalEdgeStyle: z.enum(edgeRoutingStyles).default('schematic'),
  language: z.enum(['English', 'עברית', 'العربية']),
  manualEdges: z.array(
    z.object({
      ...edgeCustomizationSchema.shape,
      source: z.string().min(1),
      target: z.string().min(1),
    }),
  ),
  nodePositions: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
    }),
  ),
  poiNodes: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  ),
  selectedRouteIds: z.array(z.string().min(1)),
})

const version1ShareableMapStateSchema = z.object({
  version: z.literal(1),
  language: z.enum(['English', 'עברית', 'العربية']),
  manualEdges: z.array(
    z.object({
      source: z.string().min(1),
      target: z.string().min(1),
    }),
  ),
  nodePositions: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
    }),
  ),
  poiNodes: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  ),
  selectedRouteIds: z.array(z.string().min(1)),
})

export type ShareableMapState = z.infer<typeof version2ShareableMapStateSchema>

type ReadSharedStateResult = {
  error: string | null
  state: ShareableMapState | null
}

function getEncodedStateFromLocation(location: Location) {
  const searchParams = new URLSearchParams(location.search)
  const searchState = searchParams.get('state')

  if (searchState) {
    return searchState
  }

  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
  const hashQueryIndex = hash.indexOf('?')

  if (hashQueryIndex === -1) {
    return null
  }

  const hashSearch = hash.slice(hashQueryIndex + 1)
  return new URLSearchParams(hashSearch).get('state')
}

function normalizeShareableMapState(parsedState: unknown): ShareableMapState {
  const candidate = z.object({ version: z.number() }).safeParse(parsedState)

  if (candidate.success && candidate.data.version === 1) {
    const version1State = version1ShareableMapStateSchema.parse(parsedState)

    return {
      ...version1State,
      edgeCustomizations: [],
      globalEdgeStyle: 'schematic',
      manualEdges: version1State.manualEdges.map((edge) => ({
        customColor: undefined,
        customStrokeWidth: undefined,
        source: edge.source,
        target: edge.target,
      })),
      version: 2,
    }
  }

  return version2ShareableMapStateSchema.parse(parsedState)
}

export function readSharedStateFromUrl(): ReadSharedStateResult {
  try {
    const encodedState = getEncodedStateFromLocation(window.location)

    if (!encodedState) {
      return { error: null, state: null }
    }

    const decompressed = decompressFromEncodedURIComponent(encodedState)

    if (!decompressed) {
      return { error: 'The shared map link is invalid or corrupted.', state: null }
    }

    return {
      error: null,
      state: normalizeShareableMapState(JSON.parse(decompressed)),
    }
  } catch {
    return { error: 'The shared map link could not be restored.', state: null }
  }
}

export function buildShareableMapState({
  edgeCustomizations,
  globalEdgeStyle,
  language,
  manualEdges,
  networkNodePositions,
  poiNodes,
  selectedRouteIds,
}: {
  edgeCustomizations: Record<string, EdgeCustomization>
  globalEdgeStyle: EdgeRoutingStyle
  language: TransitLanguage
  manualEdges: CanvasEdge[]
  networkNodePositions: Record<string, { x: number; y: number }>
  poiNodes: POICanvasNode[]
  selectedRouteIds: string[]
}): ShareableMapState {
  return {
    version: 2,
    edgeCustomizations: Object.entries(edgeCustomizations).map(([id, customization]) => ({
      ...customization,
      id,
    })),
    globalEdgeStyle,
    language,
    manualEdges: manualEdges.map((edge) => ({
      customColor: edge.data?.customColor,
      customStrokeWidth: edge.data?.customStrokeWidth,
      source: edge.source,
      target: edge.target,
    })),
    nodePositions: networkNodePositions,
    poiNodes: poiNodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      x: node.position.x,
      y: node.position.y,
    })),
    selectedRouteIds,
  }
}

export function buildShareableMapUrl(state: ShareableMapState) {
  const url = new URL(window.location.href)
  const encodedState = compressToEncodedURIComponent(JSON.stringify(state))
  const currentHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const [hashPath, hashQuery = ''] = currentHash.split('?')
  const resolvedHashPath = hashPath || '/'
  const hashSearchParams = new URLSearchParams(hashQuery)
  const searchParams = new URLSearchParams(url.search)

  hashSearchParams.set('state', encodedState)
  searchParams.delete('state')
  url.search = searchParams.toString()

  url.hash = `${resolvedHashPath}?${hashSearchParams.toString()}`

  return url.toString()
}
