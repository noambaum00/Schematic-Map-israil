import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { POICanvasNode } from '../../lib/canvasGraph'

export type POINodeData = {
  direction: 'ltr' | 'rtl'
  label: string
  textAlign: 'left' | 'right'
}

export function POINode({ data, selected }: NodeProps<POICanvasNode>) {
  return (
    <div
      className={`min-w-36 rounded-2xl border-2 border-dashed px-4 py-3 shadow-sm transition ${
        selected ? 'border-blue-500 bg-blue-50 text-gray-900 ring-2 ring-blue-200' : 'border-blue-300 bg-white text-gray-900'
      }`}
      dir={data.direction}
      style={{ textAlign: data.textAlign }}
    >
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Left} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Right} type="source" />
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Top} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Bottom} type="source" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-600">POI</p>
      <p className="mt-2 text-sm font-semibold">{data.label}</p>
    </div>
  )
}
