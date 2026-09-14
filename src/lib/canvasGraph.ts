import { addEdge, Position, type Connection, type Edge, type Node } from '@xyflow/react'

import type { ParsedRoute, TransitLanguage } from './gtfs'
import type { POINodeData } from '../components/nodes/POINode'
import type { TransitStopNodeData } from '../components/nodes/TransitStopNode'

export type TransitCanvasNode = Node<TransitStopNodeData, 'transit'>
export type HubCanvasNode = Node<TransitStopNodeData, 'hub'>
export type POICanvasNode = Node<POINodeData, 'poi'>
export type CanvasNode = TransitCanvasNode | HubCanvasNode | POICanvasNode
export type CanvasEdge = Edge

function isTransitNetworkNode(node: CanvasNode): node is TransitCanvasNode | HubCanvasNode {
  return node.type === 'transit' || node.type === 'hub'
}

function getDirection(activeLanguage: TransitLanguage): 'ltr' | 'rtl' {
  return activeLanguage === 'English' ? 'ltr' : 'rtl'
}

function getAlignment(activeLanguage: TransitLanguage): 'left' | 'right' {
  return activeLanguage === 'English' ? 'left' : 'right'
}

export function buildTransitGraph(
  route: ParsedRoute | null,
  activeLanguage: TransitLanguage,
): { edges: CanvasEdge[]; nodes: CanvasNode[] } {
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
        wheelchairStatus: stop.wheelchairStatus,
        label: stop.name,
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

  const edges = route.stops.slice(1).map<CanvasEdge>((stop, index) => ({
    animated: false,
    id: `${route.id}-edge-${index}`,
    label: route.mode === 'rail' ? route.trainTemplateLabel ?? undefined : undefined,
    source: route.stops[index].id,
    style: { stroke: route.operatorColor, strokeWidth: stop.isTransferHub || route.stops[index].isTransferHub ? 6 : 5 },
    target: stop.id,
    type: 'schematic',
  }))

  return { edges, nodes }
}

export function connectCanvasEdge(connection: Connection, currentEdges: CanvasEdge[], nodes: CanvasNode[]) {
  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode || sourceNode.type === targetNode.type) {
    return currentEdges
  }

  const connectsPoiAndTransit = (sourceNode.type === 'poi' && isTransitNetworkNode(targetNode)) || (targetNode.type === 'poi' && isTransitNetworkNode(sourceNode))

  if (!connectsPoiAndTransit) {
    return currentEdges
  }

  return addEdge(
    {
      ...connection,
      id: `manual-edge-${connection.source ?? 'unknown'}-${connection.target ?? 'unknown'}-${currentEdges.length + 1}`,
      style: { stroke: '#f8fafc', strokeDasharray: '10 6', strokeWidth: 3 },
      type: 'schematic',
    },
    currentEdges,
  )
}
