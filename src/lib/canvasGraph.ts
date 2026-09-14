import { addEdge, Position, type Connection, type Edge, type Node } from '@xyflow/react'

import { getFrequencyStrokeStyle } from '../data/transitPlan'
import type { POINodeData } from '../components/nodes/POINode'
import type { TransitStopNodeData } from '../components/nodes/TransitStopNode'
import type { ParsedRoute, TransitLanguage } from './gtfs'
import { buildSchematicPath } from './schematicPath'

export type TransitCanvasNode = Node<TransitStopNodeData, 'transit'>
export type HubCanvasNode = Node<TransitStopNodeData, 'hub'>
export type POICanvasNode = Node<POINodeData, 'poi'>
export type CanvasNode = TransitCanvasNode | HubCanvasNode | POICanvasNode

export const edgeRoutingStyles = ['schematic', 'default', 'smoothstep', 'straight'] as const

export type EdgeRoutingStyle = (typeof edgeRoutingStyles)[number]

export type CanvasEdgeData = {
  customColor?: string
  customStrokeWidth?: number
  frequencyTier?: ParsedRoute['frequencyTier']
  isManual?: boolean
  operatorColor?: string
}

export type CanvasEdge = Edge<CanvasEdgeData, EdgeRoutingStyle>

export type EdgeCustomization = Pick<CanvasEdgeData, 'customColor' | 'customStrokeWidth'>

function buildUndirectedConnectionKey(source: string, target: string) {
  return [source, target].sort().join('<->')
}

function isTransitNetworkNode(node: CanvasNode): node is TransitCanvasNode | HubCanvasNode {
  return node.type === 'transit' || node.type === 'hub'
}

function getDirection(activeLanguage: TransitLanguage): 'ltr' | 'rtl' {
  return activeLanguage === 'English' ? 'ltr' : 'rtl'
}

function getAlignment(activeLanguage: TransitLanguage): 'left' | 'right' {
  return activeLanguage === 'English' ? 'left' : 'right'
}

function getStopLabel(route: ParsedRoute, stopId: string, activeLanguage: TransitLanguage) {
  const stop = route.stops.find((routeStop) => routeStop.id === stopId)
  return stop?.names[activeLanguage] || stop?.name || stopId
}

export function buildTransitGraph(route: ParsedRoute | null, activeLanguage: TransitLanguage): { edges: CanvasEdge[]; nodes: CanvasNode[] } {
  if (!route) {
    return { edges: [], nodes: [] }
  }

  const direction = getDirection(activeLanguage)
  const textAlign = getAlignment(activeLanguage)

  const nodes = route.stops.map<TransitCanvasNode | HubCanvasNode>((stop, index) => {
    const perRow = 5
    const row = Math.floor(index / perRow)
    const column = index % perRow
    const isForward = row % 2 === 0
    const resolvedColumn = isForward ? column : perRow - 1 - column

    return {
      data: {
        code: stop.code,
        constituentStopCount: stop.constituent_stop_ids.length,
        direction,
        isTransferHub: stop.isTransferHub,
        language: activeLanguage,
        wheelchairStatus: stop.wheelchairStatus,
        label: getStopLabel(route, stop.id, activeLanguage),
        operatorColor: route.operatorColor,
        textAlign,
      },
      draggable: true,
      id: stop.id,
      position: {
        x: 80 + resolvedColumn * 220,
        y: 80 + row * 160,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      type: stop.isTransferHub ? 'hub' : 'transit',
    }
  })
  const edgeDescriptors = route.stops.slice(1).map((stop, index) => ({
    id: `${route.id}-edge-${index}`,
    source: route.stops[index]!.id,
    stop,
    target: stop.id,
  }))
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  let labeledEdgeId: string | null = null

  if (route.mode === 'rail' && route.trainTemplateLabel) {
    let longestEdgeLength = -1

    for (const edge of edgeDescriptors) {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)

      if (!sourceNode || !targetNode) {
        continue
      }

      const path = buildSchematicPath(sourceNode.position.x, sourceNode.position.y, targetNode.position.x, targetNode.position.y)
      const edgeLength = path.segments.reduce((total, segment) => total + segment.length, 0)

      if (edgeLength > longestEdgeLength) {
        longestEdgeLength = edgeLength
        labeledEdgeId = edge.id
      }
    }
  }

  const edges = edgeDescriptors.map<CanvasEdge>(({ id, source, target }) => ({
    data: {
      frequencyTier: route.frequencyTier,
      operatorColor: route.operatorColor,
    },
    animated: false,
    id,
    label: labeledEdgeId === id ? route.trainTemplateLabel ?? undefined : undefined,
    source,
    style: {
      stroke: route.operatorColor,
      ...getFrequencyStrokeStyle(route.frequencyTier),
    },
    target,
    type: 'schematic',
  }))

  return { edges, nodes }
}

export function connectCanvasEdge(
  connection: Connection,
  currentEdges: CanvasEdge[],
  nodes: CanvasNode[],
  routingStyle: EdgeRoutingStyle,
) {
  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode || sourceNode.type === targetNode.type) {
    return currentEdges
  }

  const connectsPoiAndTransit = (sourceNode.type === 'poi' && isTransitNetworkNode(targetNode)) || (targetNode.type === 'poi' && isTransitNetworkNode(sourceNode))

  if (!connectsPoiAndTransit) {
    return currentEdges
  }

  const source = connection.source ?? ''
  const target = connection.target ?? ''

  if (!source || !target) {
    return currentEdges
  }

  const nextConnectionKey = buildUndirectedConnectionKey(source, target)
  const hasDuplicateEdge = currentEdges.some(
    (edge) => edge.data?.isManual && buildUndirectedConnectionKey(edge.source, edge.target) === nextConnectionKey,
  )

  if (hasDuplicateEdge) {
    return currentEdges
  }

  return addEdge(
    {
      ...connection,
      data: {
        customColor: undefined,
        customStrokeWidth: undefined,
        isManual: true,
      },
      id: `manual-edge-${source}-${target}-${currentEdges.length + 1}`,
      style: { stroke: '#2563eb', strokeDasharray: '10 6', strokeWidth: 3 },
      type: routingStyle,
    },
    currentEdges,
  )
}

export function getCanvasEdgeStrokeWidth(edge: Pick<CanvasEdge, 'data' | 'style'>) {
  if (typeof edge.data?.customStrokeWidth === 'number') {
    return edge.data.customStrokeWidth
  }

  if (typeof edge.style?.strokeWidth === 'number') {
    return edge.style.strokeWidth
  }

  const numericStrokeWidth = Number(edge.style?.strokeWidth)
  return Number.isFinite(numericStrokeWidth) && numericStrokeWidth > 0 ? numericStrokeWidth : 3
}

export function getCanvasEdgeStroke(edge: Pick<CanvasEdge, 'data' | 'style'>) {
  if (edge.data?.customColor) {
    return edge.data.customColor
  }

  if (typeof edge.style?.stroke === 'string') {
    return edge.style.stroke
  }

  return edge.data?.operatorColor ?? '#64748b'
}

export function applyEdgePresentation(edge: CanvasEdge, routingStyle: EdgeRoutingStyle): CanvasEdge {
  return {
    ...edge,
    data: {
      ...edge.data,
    },
    style: {
      ...edge.style,
      stroke: getCanvasEdgeStroke(edge),
      strokeWidth: getCanvasEdgeStrokeWidth(edge),
    },
    type: routingStyle,
  }
}
