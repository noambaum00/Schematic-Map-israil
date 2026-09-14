import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  type EdgeTypes,
  type Connection,
  type NodeTypes,
  type OnNodesChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import type { CanvasEdge, CanvasNode } from '../lib/canvasGraph'
import type { ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { interfaceText, isRtlLanguage } from '../lib/uiText'
import { Legend } from './Legend'
import { FlowEdge } from './edges/FlowEdge'
import { RoundedStepEdge } from './edges/RoundedStepEdge'
import { SchematicEdge } from './edges/SchematicEdge'
import { StraightLineEdge } from './edges/StraightLineEdge'
import { POINode } from './nodes/POINode'
import { TransferHubNode } from './nodes/TransferHubNode'
import { TransitStopNode } from './nodes/TransitStopNode'

type MapCanvasPlaceholderProps = {
  activeLanguage: TransitLanguage
  edges: CanvasEdge[]
  isLoading: boolean
  loadError: string | null
  nodes: CanvasNode[]
  onConnect: (connection: Connection) => void
  onInit: (instance: ReactFlowInstance<CanvasNode, CanvasEdge>) => void
  onNodesChange: OnNodesChange<CanvasNode>
  onSelectionChange: (params: OnSelectionChangeParams<CanvasNode, CanvasEdge>) => void
  route: ParsedRoute | null
  wrapperRef: RefObject<HTMLDivElement | null>
}

const emptyStates: Record<TransitLanguage, string> = {
  English: 'Loading map',
  'עברית': 'טוען מפה',
  'العربية': 'جارٍ تحميل الخريطة',
}

const nodeTypes: NodeTypes = {
  hub: TransferHubNode,
  poi: POINode,
  transit: TransitStopNode,
}

const edgeTypes: EdgeTypes = {
  default: FlowEdge,
  schematic: SchematicEdge,
  smoothstep: RoundedStepEdge,
  straight: StraightLineEdge,
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  )
}

function CanvasInner({
  activeLanguage,
  edges,
  isLoading,
  loadError,
  nodes,
  onConnect,
  onInit,
  onNodesChange,
  onSelectionChange,
  route,
  wrapperRef,
}: MapCanvasPlaceholderProps) {
  const activeText = interfaceText[activeLanguage]
  const isRtl = isRtlLanguage(activeLanguage)
  const miniMapNodeColor = useMemo(
    () => (node: CanvasNode) => {
      if (node.type === 'poi') {
        return '#2563eb'
      }

      return node.data.operatorColor
    },
    [],
  )

  const routeTitle = route?.label ?? activeText.interactiveWorkspace

  return (
    <section className="relative flex min-h-[760px] flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_18px_48px_rgba(37,99,235,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(191,219,254,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(191,219,254,0.28)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_70%)]" />

      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-blue-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{activeText.reactFlowCanvas}</p>
          <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">{routeTitle}</h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-xs text-blue-700">
          {route ? <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{route.mode}</span> : null}
          {route?.trainTemplateLabel ? <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{route.trainTemplateLabel}</span> : null}
          {route ? <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{route.operator}</span> : null}
        </div>
      </div>

      <div className="relative z-10 grid flex-1 gap-5 p-5 lg:grid-cols-[minmax(0,1.75fr)_320px]">
        <div className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-slate-50">
          <div
            ref={wrapperRef}
            aria-describedby="canvas-region-description"
            aria-label={activeText.canvasRegionLabel}
            className="h-[720px] w-full"
            role="region"
          >
            <p className="sr-only" id="canvas-region-description">
              {activeText.canvasRegionDescription}
            </p>
            <ReactFlow<CanvasNode, CanvasEdge>
              attributionPosition="bottom-left"
              connectionMode={ConnectionMode.Loose}
              defaultEdgeOptions={{ style: { stroke: '#64748b', strokeWidth: 3 }, type: 'schematic' }}
              elementsSelectable
              edgeTypes={edgeTypes}
              edges={edges}
              nodeTypes={nodeTypes}
              nodes={nodes}
              nodesDraggable
              onConnect={onConnect}
              onInit={onInit}
              onNodesChange={onNodesChange}
              onSelectionChange={onSelectionChange}
              panOnScroll
              snapGrid={[20, 20]}
              snapToGrid
            >
              <Background color="#bfdbfe" gap={20} size={1} />
              <MiniMap className="!border !border-blue-100 !bg-white !shadow-sm" maskColor="rgba(219, 234, 254, 0.68)" nodeBorderRadius={16} nodeColor={miniMapNodeColor} pannable zoomable />
              <Controls className="!rounded-2xl !border !border-blue-100 !bg-white !shadow-sm" showInteractive={false} />
            </ReactFlow>
            <Legend activeLanguage={activeLanguage} route={route} />
          </div>
        </div>

        <aside className="grid gap-4">
          <article className="rounded-[1.5rem] border border-blue-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{activeText.routeMetadata}</p>
            {!route ? (
              loadError ? (
                <div aria-live="assertive" className="mt-4 space-y-2" role="alert">
                  <p className="text-sm font-semibold text-red-600">{activeText.bundledFeedUnavailable}</p>
                  <p className="text-sm text-slate-600">{loadError}</p>
                </div>
              ) : (
                <p aria-live="polite" className="mt-4 text-sm text-slate-600" role="status">
                  {isLoading ? activeText.parsingGtfs : emptyStates[activeLanguage]}
                </p>
              )
            ) : (
              <div className="mt-4 grid gap-2">
                <StatRow label={activeText.routeMode} value={route.mode} />
                <StatRow label={activeText.routeOperator} value={route.operator} />
                <StatRow label={activeText.tripId} value={route.representativeTripId} />
                <StatRow label={activeText.headsign} value={route.representativeHeadsign || activeText.notProvided} />
                <StatRow label={activeText.wheelchairAccessibleStops} value={route.stops.filter((stop) => stop.wheelchairStatus === 'accessible').length} />
                <StatRow label={activeText.wheelchairInaccessibleStops} value={route.stops.filter((stop) => stop.wheelchairStatus === 'inaccessible').length} />
              </div>
            )}
          </article>

          {route?.trainTemplateLabel ? (
            <article className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">{activeText.trainNumberTemplate}</p>
              <p className={`mt-3 text-lg font-semibold text-blue-900 ${isRtl ? 'text-right' : 'text-left'}`}>{route.trainTemplateLabel}</p>
            </article>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

export function MapCanvasPlaceholder(props: MapCanvasPlaceholderProps) {
  return <CanvasInner {...props} />
}
