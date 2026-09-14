import {
  applyNodeChanges,
  ReactFlowProvider,
  type Connection,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
  type XYPosition,
} from '@xyflow/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { CanvasEdge, CanvasNode, EdgeCustomization, EdgeRoutingStyle, POICanvasNode } from '../lib/canvasGraph'
import { applyEdgePresentation, buildTransitGraph, connectCanvasEdge } from '../lib/canvasGraph'
import { exportFlowAsSvg } from '../lib/exportFlowAsSvg'
import type { ParsedFeed, ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { parseGtfsArchive } from '../lib/gtfs'
import { buildShareableMapState, buildShareableMapUrl, readSharedStateFromUrl } from '../lib/shareableState'
import { getDirection, getTextAlignment, interfaceText } from '../lib/uiText'
import { MapCanvasPlaceholder } from './MapCanvasPlaceholder'
import { Sidebar } from './Sidebar'

const defaultLanguage: TransitLanguage = 'English'

export function TransitMapLayout() {
  const initialSharedState = useMemo(() => readSharedStateFromUrl(), [])
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<TransitLanguage>(initialSharedState.state?.language ?? defaultLanguage)
  const [feed, setFeed] = useState<ParsedFeed | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(initialSharedState.error)
  const [exportError, setExportError] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [poiNodes, setPoiNodes] = useState<POICanvasNode[]>([])
  const [manualEdges, setManualEdges] = useState<CanvasEdge[]>([])
  const [routeEdgeCustomizations, setRouteEdgeCustomizations] = useState<Record<string, EdgeCustomization>>({})
  const [globalEdgeStyle, setGlobalEdgeStyle] = useState<EdgeRoutingStyle>(initialSharedState.state?.globalEdgeStyle ?? 'schematic')
  const [transitNodePositions, setTransitNodePositions] = useState<Record<string, XYPosition>>({})
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const latestRequestId = useRef(0)
  const nodesRef = useRef<CanvasNode[]>([])
  const poiCounterRef = useRef(1)
  const hasAppliedSharedStateRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const text = interfaceText[language]

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
  const routeNodeCount = selectedRoute?.stops.length ?? 0

  const baseGraph = useMemo(() => buildTransitGraph(selectedRoute, language), [language, selectedRoute])

  const nodes = useMemo<CanvasNode[]>(() => {
    const poiDirection = getDirection(language)
    const poiTextAlign = getTextAlignment(language)
    const transitNodes = baseGraph.nodes.map((node) => ({
      ...node,
      position: transitNodePositions[node.id] ?? node.position,
    }))
    const localizedPoiNodes = poiNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        direction: poiDirection,
        textAlign: poiTextAlign,
      },
    }))

    return [...transitNodes, ...localizedPoiNodes]
  }, [baseGraph.nodes, language, poiNodes, transitNodePositions])

  const edges = useMemo<CanvasEdge[]>(
    () => [
      ...baseGraph.edges.map((edge) =>
        applyEdgePresentation(
          {
            ...edge,
            data: {
              ...edge.data,
              ...routeEdgeCustomizations[edge.id],
            },
          },
          globalEdgeStyle,
        ),
      ),
      ...manualEdges.map((edge) => applyEdgePresentation(edge, globalEdgeStyle)),
    ],
    [baseGraph.edges, globalEdgeStyle, manualEdges, routeEdgeCustomizations],
  )

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  const selectedPoiLabel = useMemo(() => {
    const selectedNode = nodes.find((node) => node.id === selectedPoiId)
    return selectedNode?.type === 'poi' ? selectedNode.data.label : ''
  }, [nodes, selectedPoiId])
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId) ?? null, [edges, selectedEdgeId])

  useEffect(() => {
    document.documentElement.dir = getDirection(language)
    document.body.dir = getDirection(language)
    document.documentElement.lang = language === 'English' ? 'en' : language === 'עברית' ? 'he' : 'ar'
  }, [language])

  useEffect(() => {
    if (!shareMessage && !shareError) {
      return
    }

    const timeout = window.setTimeout(() => {
      setShareMessage(null)
      setShareError(null)
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [shareError, shareMessage])

  useEffect(() => {
    if (!reactFlowInstance || routeNodeCount === 0) {
      return
    }

    void (async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await reactFlowInstance.fitView({ duration: 250, includeHiddenNodes: true, padding: 0.18 })
    })()
  }, [reactFlowInstance, routeNodeCount, selectedRouteId])

  function resetCanvasState() {
    hasAppliedSharedStateRef.current = false
    setGlobalEdgeStyle('schematic')
    setRouteEdgeCustomizations({})
    setPoiNodes([])
    setManualEdges([])
    setSelectedEdgeId(null)
    setTransitNodePositions({})
    setSelectedPoiId(null)
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
      const sharedState = initialSharedState.state
      const sharedRouteId = sharedState?.selectedRouteIds.find((routeId) => parsedFeed.routes.some((route) => route.id === routeId)) ?? null
      const nextSelectedRouteId = sharedRouteId ?? parsedFeed.routes[0]?.id ?? null

      setSelectedRouteId(nextSelectedRouteId)

      if (sharedState && !hasAppliedSharedStateRef.current) {
        setLanguage(sharedState.language)
        const selectedRoute = parsedFeed.routes.find((route) => route.id === nextSelectedRouteId)
        const restoredEdgeCustomizations = Object.fromEntries(
          sharedState.edgeCustomizations.map(({ id, ...customization }) => [id, customization]),
        )
        const restoredPoiNodes: POICanvasNode[] = sharedState.poiNodes.map((node) => ({
          data: {
            direction: getDirection(sharedState.language),
            label: node.label,
            textAlign: getTextAlignment(sharedState.language),
          },
          id: node.id,
          position: { x: node.x, y: node.y },
          type: 'poi',
        }))
        const availableNodeIds = new Set([
          ...(selectedRoute?.stops.map((stop) => stop.id) ?? []),
          ...restoredPoiNodes.map((node) => node.id),
        ])
        const restoredPoiIdNumbers = restoredPoiNodes
          .map((node) => Number(node.id.replace('poi-', '')))
          .filter((value) => Number.isFinite(value))
        const highestPoiIndex = restoredPoiIdNumbers.length > 0 ? Math.max(...restoredPoiIdNumbers) : 0
        const routeStopIds = new Set(selectedRoute?.stops.map((stop) => stop.id) ?? [])
        const restoredTransitNodePositions = Object.fromEntries(
          Object.entries(sharedState.nodePositions).filter(([nodeId]) => routeStopIds.has(nodeId)),
        )

        setTransitNodePositions(restoredTransitNodePositions)
        setRouteEdgeCustomizations(restoredEdgeCustomizations)
        setGlobalEdgeStyle(sharedState.globalEdgeStyle)
        setPoiNodes(restoredPoiNodes)
        setManualEdges(
          sharedState.manualEdges
            .filter((edge) => {
              if (!availableNodeIds.has(edge.source) || !availableNodeIds.has(edge.target)) {
                return false
              }

              const sourceIsPoi = restoredPoiNodes.some((node) => node.id === edge.source)
              const targetIsPoi = restoredPoiNodes.some((node) => node.id === edge.target)

              return sourceIsPoi !== targetIsPoi
            })
            .map((edge, index) => ({
              data: {
                customColor: edge.customColor,
                customStrokeWidth: edge.customStrokeWidth,
                isManual: true,
              },
              id: `shared-edge-${edge.source}-${edge.target}-${index + 1}`,
              source: edge.source,
              style: {
                stroke: edge.customColor ?? '#f8fafc',
                strokeDasharray: '10 6',
                strokeWidth: edge.customStrokeWidth ?? 3,
              },
              target: edge.target,
              type: 'schematic',
            })),
        )
        poiCounterRef.current = highestPoiIndex + 1
        hasAppliedSharedStateRef.current = true
      }
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
    const nextRoute = allRoutes.find((route) => route.id === routeId)
    const nextRouteStopIds = new Set(nextRoute?.stops.map((stop) => stop.id) ?? [])

    setTransitNodePositions((currentPositions) =>
      Object.fromEntries(Object.entries(currentPositions).filter(([stopId]) => nextRouteStopIds.has(stopId))),
    )
    setManualEdges((currentEdges) =>
      currentEdges.filter((edge) => {
        const sourceIsPoi = poiNodes.some((node) => node.id === edge.source)
        const targetIsPoi = poiNodes.some((node) => node.id === edge.target)
        const sourceIsRouteStop = nextRouteStopIds.has(edge.source)
        const targetIsRouteStop = nextRouteStopIds.has(edge.target)

        return (sourceIsPoi && targetIsRouteStop) || (targetIsPoi && sourceIsRouteStop)
      }),
    )
    setSelectedEdgeId(null)
    setSelectedRouteId(routeId)
    setExportError(null)
    setLoadError(null)
  }

  async function handleShareMap() {
    try {
      setIsSharing(true)
      setShareError(null)

      const networkNodePositions = nodes
        .filter((node) => node.type === 'transit' || node.type === 'hub')
        .reduce<Record<string, XYPosition>>((positions, node) => {
          positions[node.id] = node.position
          return positions
        }, {})
      const shareState = buildShareableMapState({
        edgeCustomizations: Object.fromEntries(
          Object.entries(routeEdgeCustomizations).filter(
            ([edgeId, customization]) =>
              baseGraph.edges.some((edge) => edge.id === edgeId) &&
              (Boolean(customization.customColor) || typeof customization.customStrokeWidth === 'number'),
          ),
        ),
        globalEdgeStyle,
        language,
        manualEdges,
        networkNodePositions,
        poiNodes,
        selectedRouteIds: selectedRouteId ? [selectedRouteId] : [],
      })
      const shareUrl = buildShareableMapUrl(shareState)

      await navigator.clipboard.writeText(shareUrl)
      window.history.replaceState(null, '', shareUrl)
      setShareMessage(text.shareCopied)
    } catch {
      setShareError(text.shareCopyFailed)
    } finally {
      setIsSharing(false)
    }
  }

  function handleNodesChange(changes: Parameters<typeof applyNodeChanges<CanvasNode>>[0]) {
    const nextNodes = applyNodeChanges(changes, nodesRef.current)
    const nextTransitPositions: Record<string, XYPosition> = {}

    for (const node of nextNodes) {
      if (node.type === 'transit' || node.type === 'hub') {
        nextTransitPositions[node.id] = node.position
      }
    }

    setPoiNodes(nextNodes.filter((node): node is POICanvasNode => node.type === 'poi'))
    setTransitNodePositions(nextTransitPositions)
  }

  function handleConnect(connection: Connection) {
    setManualEdges((currentEdges) => connectCanvasEdge(connection, currentEdges, nodesRef.current, globalEdgeStyle))
  }

  function handleSelectionChange({ edges: selectedEdges, nodes: selectedNodes }: OnSelectionChangeParams<CanvasNode, CanvasEdge>) {
    setSelectedEdgeId(selectedEdges[0]?.id ?? null)
    const selectedPoi = selectedNodes.find((node): node is POICanvasNode => node.type === 'poi')
    setSelectedPoiId(selectedPoi?.id ?? null)
  }

  function updateSelectedEdgeCustomization(nextCustomization: EdgeCustomization) {
    if (!selectedEdge) {
      return
    }

    if (selectedEdge.data?.isManual) {
      setManualEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.id !== selectedEdge.id) {
            return edge
          }

          return {
            ...edge,
            data: {
              ...edge.data,
              ...nextCustomization,
            },
            style: {
              ...edge.style,
              stroke: nextCustomization.customColor ?? edge.data?.customColor ?? edge.style?.stroke ?? '#f8fafc',
              strokeWidth:
                nextCustomization.customStrokeWidth ?? edge.data?.customStrokeWidth ?? edge.style?.strokeWidth ?? 3,
            },
          }
        }),
      )
      return
    }

    setRouteEdgeCustomizations((currentCustomizations) => ({
      ...currentCustomizations,
      [selectedEdge.id]: {
        ...currentCustomizations[selectedEdge.id],
        ...nextCustomization,
      },
    }))
  }

  function handleEdgeColorChange(customColor: string) {
    updateSelectedEdgeCustomization({ customColor })
  }

  function handleEdgeStrokeWidthChange(customStrokeWidth: number) {
    updateSelectedEdgeCustomization({ customStrokeWidth })
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
        data: {
          direction: getDirection(language),
          label: `Point of Interest ${poiIndex}`,
          textAlign: getTextAlignment(language),
        },
        id: poiId,
        position,
        type: 'poi',
      },
    ])
    setSelectedPoiId(poiId)
  }

  function handlePoiLabelChange(value: string) {
    setPoiNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedPoiId) {
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
    <ReactFlowProvider>
      <main
        className="mx-auto grid min-h-screen w-full max-w-[1800px] gap-6 px-4 py-4 text-start xl:grid-cols-[420px_minmax(0,1fr)] xl:px-6 xl:py-6"
        dir={getDirection(language)}
      >
        <Sidebar
          activeLanguage={language}
          exportError={exportError}
          feed={feed}
          isExporting={isExporting}
          isSharing={isSharing}
          isLoading={isLoading}
          loadError={loadError}
          globalEdgeStyle={globalEdgeStyle}
          selectedEdge={selectedEdge}
          poiLabel={selectedPoiLabel}
          query={query}
          routes={filteredRoutes}
          selectedRouteId={selectedRouteId}
          shareError={shareError}
          shareMessage={shareMessage ?? (initialSharedState.state && !feed ? text.loadFeedToRestoreSharedMap : null)}
          onAddPoi={handleAddPoi}
          onEdgeColorChange={handleEdgeColorChange}
          onEdgeStrokeWidthChange={handleEdgeStrokeWidthChange}
          onExportSvg={handleExportSvg}
          onFileSelected={handleFileSelected}
          onGlobalEdgeStyleChange={setGlobalEdgeStyle}
          onLanguageChange={setLanguage}
          onPoiLabelChange={handlePoiLabelChange}
          onQueryChange={setQuery}
          onRouteSelect={handleRouteSelect}
          onShareMap={handleShareMap}
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
    </ReactFlowProvider>
  )
}
