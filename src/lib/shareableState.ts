import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { z } from 'zod'

import type { CanvasEdge, POICanvasNode } from './canvasGraph'
import type { TransitLanguage } from './gtfs'

const shareableMapStateSchema = z.object({
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

export type ShareableMapState = z.infer<typeof shareableMapStateSchema>

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
      state: shareableMapStateSchema.parse(JSON.parse(decompressed)),
    }
  } catch {
    return { error: 'The shared map link could not be restored.', state: null }
  }
}

export function buildShareableMapState({
  language,
  manualEdges,
  networkNodePositions,
  poiNodes,
  selectedRouteIds,
}: {
  language: TransitLanguage
  manualEdges: CanvasEdge[]
  networkNodePositions: Record<string, { x: number; y: number }>
  poiNodes: POICanvasNode[]
  selectedRouteIds: string[]
}): ShareableMapState {
  return {
    version: 1,
    language,
    manualEdges: manualEdges.map((edge) => ({
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
  const [hashPath] = currentHash.split('?')
  const resolvedHashPath = hashPath || '/'

  url.hash = `${resolvedHashPath}?state=${encodedState}`

  return url.toString()
}
