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
import { getDirection, interfaceText, isRtlLanguage } from '../lib/uiText'
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
  nodes: CanvasNode[]
  onConnect: (connection: Connection) => void
  onInit: (instance: ReactFlowInstance<CanvasNode, CanvasEdge>) => void
  onNodesChange: OnNodesChange<CanvasNode>
  onSelectionChange: (params: OnSelectionChangeParams<CanvasNode, CanvasEdge>) => void
  route: ParsedRoute | null
  wrapperRef: RefObject<HTMLDivElement | null>
}

const emptyStates: Record<TransitLanguage, { title: string; description: string }> = {
  English: {
    title: 'Loading the built-in GTFS feed',
    description: 'The map auto-loads the latest processed MOT feed at build time, and you can still replace it with another archive from the sidebar.',
  },
  'עברית': {
    title: 'טוען את פיד ה‑GTFS המובנה',
    description: 'המפה טוענת אוטומטית את פיד משרד התחבורה שעובד בזמן הבנייה, ואפשר עדיין להחליף אותו מהסרגל הצדדי.',
  },
  'العربية': {
    title: 'جارٍ تحميل تغذية GTFS المدمجة',
    description: 'تقوم الخريطة بتحميل تغذية الوزارة المعالجة وقت البناء تلقائيًا، وما زال بإمكانك استبدالها من الشريط الجانبي.',
  },
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

function getNodeLabelDirection(activeLanguage: TransitLanguage) {
  return getDirection(activeLanguage)
}

function getNodeLabelAlignment(activeLanguage: TransitLanguage) {
  return isRtlLanguage(activeLanguage) ? 'end' : 'start'
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

  return (
    <section className="relative flex min-h-[760px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_70%)]" />

      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/90 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">{activeText.reactFlowCanvas}</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">{activeText.interactiveWorkspace}</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-blue-700">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{activeText.canvasBadgeFeed}</span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{activeText.canvasBadgeHubs}</span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{activeText.canvasBadgePoi}</span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">{activeText.canvasBadgeExport}</span>
        </div>
      </div>

      <div className="relative z-10 grid flex-1 gap-6 p-6 lg:grid-cols-[minmax(0,1.65fr)_340px]">
        <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-gray-50">
          <div
            ref={wrapperRef}
            aria-label={activeText.canvasRegionLabel}
            aria-describedby="canvas-region-description"
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
              <Background color="#cbd5e1" gap={20} size={1.1} />
              <MiniMap className="!border !border-gray-200 !bg-white !shadow-sm" maskColor="rgba(219, 234, 254, 0.65)" nodeBorderRadius={16} nodeColor={miniMapNodeColor} pannable zoomable />
              <Controls className="!rounded-2xl !border !border-gray-200 !bg-white !shadow-sm" showInteractive={false} />
            </ReactFlow>
            <Legend activeLanguage={activeLanguage} route={route} />
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{activeText.routeMetadata}</p>
            {!route ? (
              <>
                <p className="mt-4 text-sm font-semibold text-gray-900">{isLoading ? activeText.parsingGtfs : emptyStates[activeLanguage].title}</p>
                <p className="mt-3 text-sm text-gray-600">{isLoading ? activeText.readingArchive : emptyStates[activeLanguage].description}</p>
              </>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>• {activeText.routeMode}: {route.mode}</li>
                <li>• {activeText.routeOperator}: {route.operator}</li>
                <li>• {activeText.tripId}: {route.representativeTripId}</li>
                <li>• {activeText.headsign}: {route.representativeHeadsign || activeText.notProvided}</li>
                <li>• {activeText.wheelchairAccessibleStops}: {route.stops.filter((stop) => stop.wheelchairStatus === 'accessible').length}</li>
                <li>• {activeText.wheelchairInaccessibleStops}: {route.stops.filter((stop) => stop.wheelchairStatus === 'inaccessible').length}</li>
              </ul>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{activeText.canvasTips}</p>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>• {activeText.dragWithGrid}</li>
              <li>• {activeText.drawLinks}</li>
              <li>• {activeText.editPoi}</li>
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{activeText.activeLanguage}</p>
            <p className="mt-4 text-sm text-gray-700">
              {activeText.nodeLabelsDescription}{' '}
              {activeText.nodeLabelsBehavior
                .replace('{order}', isRtl ? 'RTL' : 'LTR')
                .replace('{direction}', getNodeLabelDirection(activeLanguage))
                .replace('{alignment}', getNodeLabelAlignment(activeLanguage))}
            </p>
          </article>

          {route?.trainTemplateLabel ? (
            <article className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">{activeText.trainNumberTemplate}</p>
              <p className="mt-4 text-sm text-blue-800">{activeText.trainTemplateRendered.replace('{label}', route.trainTemplateLabel)}</p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function MapCanvasPlaceholder(props: MapCanvasPlaceholderProps) {
  return <CanvasInner {...props} />
}
