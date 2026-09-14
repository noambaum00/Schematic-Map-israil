import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type OnNodesChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import type { CanvasEdge, CanvasNode } from '../lib/canvasGraph'
import type { ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { POINode } from './nodes/POINode'
import { TransitStopNode } from './nodes/TransitStopNode'

type MapCanvasPlaceholderProps = {
  activeLanguage: TransitLanguage
  edges: CanvasEdge[]
  isLoading: boolean
  nodes: CanvasNode[]
  onConnect: (connection: Connection) => void
  onInit: (instance: ReactFlowInstance<CanvasNode, CanvasEdge>) => void
  onNodesChange: OnNodesChange<CanvasNode>
  onSelectionChange: (params: OnSelectionChangeParams<CanvasNode, CanvasEdge>) => void
  route: ParsedRoute | null
  wrapperRef: RefObject<HTMLDivElement | null>
}

const rtlLanguages = new Set<TransitLanguage>(['עברית', 'العربية'])

const emptyStates: Record<TransitLanguage, { title: string; description: string }> = {
  English: {
    title: 'Upload a GTFS zip to start',
    description: 'The React Flow canvas switches from an empty graph to live GTFS routes as soon as you load an MOT archive.',
  },
  'עברית': {
    title: 'העלו קובץ GTFS כדי להתחיל',
    description: 'קנבס React Flow יעבור לנתוני GTFS אמיתיים מיד לאחר טעינת ארכיון MOT.',
  },
  'العربية': {
    title: 'حمّل ملف GTFS للبدء',
    description: 'ستنتقل لوحة React Flow إلى بيانات GTFS الحقيقية فور تحميل أرشيف MOT.',
  },
}

const nodeTypes = {
  poi: POINode,
  transit: TransitStopNode,
}

function getNodeLabelDirection(activeLanguage: TransitLanguage) {
  return rtlLanguages.has(activeLanguage) ? 'rtl' : 'ltr'
}

function getNodeLabelAlignment(activeLanguage: TransitLanguage) {
  return rtlLanguages.has(activeLanguage) ? 'end' : 'start'
}

function CanvasInner({
  activeLanguage,
  edges,
  isLoading,
  nodes,
  onConnect,
  onInit,
  onNodesChange,
  onSelectionChange,
  route,
  wrapperRef,
}: MapCanvasPlaceholderProps) {
  const isRtlLanguage = rtlLanguages.has(activeLanguage)
  const miniMapNodeColor = useMemo(
    () => (node: CanvasNode) => (node.type === 'poi' ? '#f59e0b' : node.data.operatorColor),
    [],
  )

  return (
    <section className="relative flex min-h-[760px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">React Flow canvas</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Interactive schematic workspace</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-200">
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5">Real GTFS feed</span>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5">POI nodes</span>
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5">SVG export</span>
        </div>
      </div>

      <div className="relative z-10 grid flex-1 gap-6 p-6 lg:grid-cols-[minmax(0,1.65fr)_340px]">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70">
          <div
            ref={wrapperRef}
            aria-label="Interactive transit map canvas"
            aria-describedby="canvas-region-description"
            className="h-[720px] w-full"
            role="region"
          >
            <p className="sr-only" id="canvas-region-description">
              Use the interactive graph to inspect GTFS station nodes, add POI nodes, draw manual connections, and export the full viewport as SVG.
            </p>
            <ReactFlow<CanvasNode, CanvasEdge>
              fitView
              attributionPosition="bottom-left"
              connectionMode={ConnectionMode.Loose}
              defaultEdgeOptions={{ style: { stroke: '#94a3b8', strokeWidth: 3 }, type: 'smoothstep' }}
              edges={edges}
              nodeTypes={nodeTypes}
              nodes={nodes}
              nodesDraggable
              onConnect={onConnect}
              onInit={onInit}
              onNodesChange={onNodesChange}
              onSelectionChange={onSelectionChange}
              panOnScroll
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1e293b" gap={32} size={1.2} />
              <MiniMap
                className="!bg-slate-950/90"
                maskColor="rgba(15, 23, 42, 0.75)"
                nodeBorderRadius={16}
                nodeColor={miniMapNodeColor}
                pannable
                zoomable
              />
              <Controls className="!rounded-2xl !border !border-white/10 !bg-slate-950/90 !shadow-xl" showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Route metadata</p>
            {!route ? (
              <>
                <p className="mt-4 text-sm font-semibold text-white">{isLoading ? 'Parsing GTFS archive…' : emptyStates[activeLanguage].title}</p>
                <p className="mt-3 text-sm text-slate-300">
                  {isLoading ? 'Reading routes, trips, stop_times, and stops from the uploaded archive.' : emptyStates[activeLanguage].description}
                </p>
              </>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>• Mode: {route.mode}</li>
                <li>• Operator: {route.operator}</li>
                <li>• Trip ID: {route.representativeTripId}</li>
                <li>• Headsign: {route.representativeHeadsign || 'Not provided'}</li>
                <li>• Wheelchair-ready stops: {route.stops.filter((stop) => stop.wheelchairBoarding === '1').length}</li>
              </ul>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Canvas tips</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Drag GTFS stations or POI nodes to refine the schematic.</li>
              <li>• Draw new links by dragging between any visible handles.</li>
              <li>• Select a POI node, then edit its label from the sidebar.</li>
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Active language</p>
            <p className="mt-4 text-sm text-slate-300">
              Canvas labels are aligned for {isRtlLanguage ? 'RTL' : 'LTR'} reading order using{' '}
              <code>{getNodeLabelDirection(activeLanguage)}</code> text direction and{' '}
              <code>{getNodeLabelAlignment(activeLanguage)}</code> alignment.
            </p>
          </article>

          {route?.trainTemplateLabel ? (
            <article className="rounded-[1.75rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Train number template</p>
              <p className="mt-4 text-sm text-cyan-50">Rendered on route edges: {route.trainTemplateLabel}</p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function MapCanvasPlaceholder(props: MapCanvasPlaceholderProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
