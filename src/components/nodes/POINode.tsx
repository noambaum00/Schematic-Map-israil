import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { POICanvasNode } from '../../lib/canvasGraph'

export type POINodeData = {
  label: string
}

export function POINode({ data, selected }: NodeProps<POICanvasNode>) {
  return (
    <div
      className={`min-w-36 rounded-2xl border-2 border-dashed px-4 py-3 text-center shadow-lg transition ${
        selected
          ? 'border-amber-300 bg-amber-400/20 text-amber-50'
          : 'border-amber-400/80 bg-slate-950/90 text-amber-100'
      }`}
    >
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-amber-300" position={Position.Left} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-amber-300" position={Position.Right} type="source" />
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-amber-300" position={Position.Top} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-amber-300" position={Position.Bottom} type="source" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">POI</p>
      <p className="mt-2 text-sm font-semibold">{data.label}</p>
    </div>
  )
}
