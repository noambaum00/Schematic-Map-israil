import { Handle, Position, type NodeProps } from '@xyflow/react'

import { interfaceText } from '../../lib/uiText'
import type { TransitCanvasNode } from '../../lib/canvasGraph'
import type { TransitLanguage } from '../../lib/gtfs'

export type TransitStopNodeData = {
  code: string
  constituentStopCount: number
  direction: 'ltr' | 'rtl'
  isTransferHub: boolean
  language: TransitLanguage
  wheelchairStatus: 'accessible' | 'inaccessible' | 'unknown'
  label: string
  operatorColor: string
  textAlign: 'left' | 'right'
}

export function TransitStopNode({ data, selected }: NodeProps<TransitCanvasNode>) {
  const text = interfaceText[data.language]

  return (
    <div
      className={`min-w-44 rounded-2xl border px-4 py-3 shadow-sm transition ${
        selected ? 'border-blue-500 bg-blue-50 text-gray-900 ring-2 ring-blue-200' : 'border-gray-200 bg-white text-gray-900'
      }`}
      dir={data.direction}
      style={{ textAlign: data.textAlign }}
    >
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Left} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Right} type="source" />
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Top} type="target" />
      <Handle className="!h-3 !w-3 !border-2 !border-white !bg-blue-600" position={Position.Bottom} type="source" />
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3.5 w-3.5 rounded-full border border-gray-200" style={{ backgroundColor: data.operatorColor }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data.label}</p>
          <p className="mt-1 text-xs text-gray-500">{data.code || text.gtfsStationFallback}</p>
          {data.wheelchairStatus === 'accessible' ? <p className="mt-1 text-xs text-blue-700">{text.wheelchairAccessible}</p> : null}
          {data.wheelchairStatus === 'inaccessible' ? <p className="mt-1 text-xs text-red-600">{text.wheelchairInaccessible}</p> : null}
        </div>
      </div>
    </div>
  )
}
