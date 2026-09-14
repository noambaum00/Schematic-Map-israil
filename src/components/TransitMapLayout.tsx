import {
  applyNodeChanges,
  type Connection,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
  type XYPosition,
} from '@xyflow/react'
import { useMemo, useRef, useState } from 'react'

import type { CanvasEdge, CanvasNode, POICanvasNode } from '../lib/canvasGraph'
import { buildTransitGraph, connectCanvasEdge } from '../lib/canvasGraph'
import { exportFlowAsSvg } from '../lib/exportFlowAsSvg'
import type { ParsedFeed, ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { parseGtfsArchive } from '../lib/gtfs'
import { MapCanvasPlaceholder } from './MapCanvasPlaceholder'
import { Sidebar } from './Sidebar'

const defaultLanguage: TransitLanguage = 'English'

export function TransitMapLayout() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<TransitLanguage>(defaultLanguage)
  const [feed, setFeed] = useState<ParsedFeed | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [poiNodes, setPoiNodes] = useState<POICanvasNode[]>([])
  const [manualEdges, setManualEdges] = useState<CanvasEdge[]>([])
  const [transitNodePositions, setTransitNodePositions] = useState<Record<string, XYPosition>>({})
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const latestRequestId = useRef(0)
  const poiCounterRef = useRef(1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const allRoutes = useMemo(() => feed?.routes ?? [], [feed?.routes])

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return allRoutes
    }

    return allRoutes.filter((route) => {
      const haystack = [
        route.label,
        route.operator,
        route.mode,
        route.description,
        route.trainTemplateLabel ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [allRoutes, query])

  const selectedRoute = useMemo<ParsedRoute | null>(
    () => allRoutes.find((route) => route.id === selectedRouteId) ?? null,
    [allRoutes, selectedRouteId],
  )

  const baseGraph = useMemo(() => buildTransitGraph(selectedRoute), [selectedRoute])

  const nodes = useMemo<CanvasNode[]>(() => {
    const transitNodes = baseGraph.nodes.map((node) => ({
      ...node,
      position: transitNodePositions[node.id] ?? node.position,
    }))

    return [...transitNodes, ...poiNodes]
  }, [baseGraph.nodes, poiNodes, transitNodePositions])

  const edges = useMemo<CanvasEdge[]>(() => [...baseGraph.edges, ...manualEdges], [baseGraph.edges, manualEdges])

  const selectedPoiLabel = useMemo(() => {
    const selectedNode = nodes.find((node) => node.id === selectedNodeId)
    return selectedNode?.type === 'poi' ? selectedNode.data.label : ''
  }, [nodes, selectedNodeId])

  function resetCanvasState() {
    setPoiNodes([])
    setManualEdges([])
    setTransitNodePositions({})
    setSelectedNodeId(null)
    poiCounterRef.current = 1
  }

  async function handleFileSelected(file: File | null) {
    if (!file) {
      return
    }

    const requestId = latestRequestId.current + 1
    latestRequestId.current = requestId

    setIsLoading(true)
    setLoadError(null)
    resetCanvasState()

    try {
      const parsedFeed = await parseGtfsArchive(file)

      if (latestRequestId.current !== requestId) {
        return
      }

      setFeed(parsedFeed)
      setSelectedRouteId(parsedFeed.routes[0]?.id ?? null)
    } catch (error) {
      if (latestRequestId.current !== requestId) {
        return
      }

      setFeed(null)
      setSelectedRouteId(null)
      setLoadError(error instanceof Error ? error.message : 'Failed to parse GTFS archive.')
    } finally {
      if (latestRequestId.current === requestId) {
        setIsLoading(false)
      }
    }
  }

  function handleRouteSelect(routeId: string) {
    setSelectedRouteId(routeId)
    resetCanvasState()
    setExportError(null)
  }

  function handleNodesChange(changes: Parameters<typeof applyNodeChanges<CanvasNode>>[0]) {
    const nextNodes = applyNodeChanges(changes, nodes)
    const nextTransitPositions: Record<string, XYPosition> = {}

    for (const node of nextNodes) {
      if (node.type === 'transit') {
        nextTransitPositions[node.id] = node.position
      }
    }

    setPoiNodes(nextNodes.filter((node): node is POICanvasNode => node.type === 'poi'))
    setTransitNodePositions(nextTransitPositions)
  }

  function handleConnect(connection: Connection) {
    setManualEdges((currentEdges) => connectCanvasEdge(connection, currentEdges))
  }

  function handleSelectionChange({ nodes: selectedNodes }: OnSelectionChangeParams<CanvasNode, CanvasEdge>) {
    setSelectedNodeId(selectedNodes[0]?.id ?? null)
  }

  function handleAddPoi() {
    if (!reactFlowInstance || !wrapperRef.current) {
      setExportError('The canvas is still loading. Please try adding the POI again in a moment.')
      return
    }

    setExportError(null)
    const poiIndex = poiCounterRef.current
    poiCounterRef.current += 1

    const bounds = wrapperRef.current.getBoundingClientRect()
    const position = reactFlowInstance.screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    })
    const poiId = `poi-${poiIndex}`

    setPoiNodes((currentNodes) => [
      ...currentNodes,
      {
        data: { label: `Point of Interest ${poiIndex}` },
        id: poiId,
        position,
        type: 'poi',
      },
    ])
    setSelectedNodeId(poiId)
  }

  function handlePoiLabelChange(value: string) {
    setPoiNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNodeId) {
          return node
        }

        return {
          ...node,
          data: {
            ...node.data,
            label: value,
          },
        }
      }),
    )
  }

  async function handleExportSvg() {
    if (!reactFlowInstance) {
      setExportError('The canvas is not ready to export yet.')
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      const routeFileName = selectedRoute?.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase() ?? 'transit-map'
      await exportFlowAsSvg({
        fileName: `${routeFileName}-canvas.svg`,
        reactFlow: reactFlowInstance,
        wrapper: wrapperRef.current,
      })
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export SVG.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1800px] gap-6 px-4 py-4 text-left xl:grid-cols-[420px_minmax(0,1fr)] xl:px-6 xl:py-6">
      <Sidebar
        activeLanguage={language}
        exportError={exportError}
        feed={feed}
        isExporting={isExporting}
        isLoading={isLoading}
        loadError={loadError}
        poiLabel={selectedPoiLabel}
        query={query}
        routes={filteredRoutes}
        selectedRouteId={selectedRouteId}
        onAddPoi={handleAddPoi}
        onExportSvg={handleExportSvg}
        onFileSelected={handleFileSelected}
        onLanguageChange={setLanguage}
        onPoiLabelChange={handlePoiLabelChange}
        onQueryChange={setQuery}
        onRouteSelect={handleRouteSelect}
      />
      <MapCanvasPlaceholder
        activeLanguage={language}
        edges={edges}
        isLoading={isLoading}
        nodes={nodes}
        route={selectedRoute}
        wrapperRef={wrapperRef}
        onConnect={handleConnect}
        onInit={setReactFlowInstance}
        onNodesChange={handleNodesChange}
        onSelectionChange={handleSelectionChange}
      />
    </main>
  )
}
