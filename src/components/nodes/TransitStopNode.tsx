import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { TransitCanvasNode } from '../../lib/canvasGraph'

export type TransitStopNodeData = {
  code: string
  direction: 'ltr' | 'rtl'
  isAccessible: boolean
  label: string
  operatorColor: string
  textAlign: 'left' | 'right'
}

export function TransitStopNode({ data, selected }: NodeProps<TransitCanvasNode>) {
  return (
    <div
      className={`min-w-44 rounded-2xl border px-4 py-3 shadow-lg transition ${
        selected
          ? 'border-cyan-300 bg-slate-900 text-white'
          : 'border-white/10 bg-slate-950/90 text-slate-100'
      }`}
      dir={data.direction}
      style={{ textAlign: data.textAlign }}
    >
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-200" position={Position.Left} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-200" position={Position.Right} type="source" />
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-200" position={Position.Top} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-200" position={Position.Bottom} type="source" />
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: data.operatorColor }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data.label}</p>
          <p className="mt-1 text-xs text-slate-400">{data.code || 'GTFS station'}</p>
          {data.isAccessible ? <p className="mt-1 text-xs text-emerald-300">Wheelchair accessible</p> : null}
        </div>
      </div>
    </div>
  )
}
