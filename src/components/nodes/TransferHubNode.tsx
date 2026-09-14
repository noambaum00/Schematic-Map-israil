import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { HubCanvasNode } from '../../lib/canvasGraph'
import { interfaceText } from '../../lib/uiText'

export function TransferHubNode({ data, selected }: NodeProps<HubCanvasNode>) {
  const text = interfaceText[data.language]
  const summary =
    data.constituentStopCount === 1
      ? text.singleStopHub
      : text.transferHubStops.replace('{count}', String(data.constituentStopCount))

  return (
    <div className="relative flex min-w-44 flex-col items-center gap-3 px-3 py-2">
      <Handle className="!h-3.5 !w-3.5 !border-[3px] !border-slate-950 !bg-white" position={Position.Left} type="target" />
      <Handle className="!h-3.5 !w-3.5 !border-[3px] !border-slate-950 !bg-white" position={Position.Right} type="source" />
      <Handle className="!h-3.5 !w-3.5 !border-[3px] !border-slate-950 !bg-white" position={Position.Top} type="target" />
      <Handle className="!h-3.5 !w-3.5 !border-[3px] !border-slate-950 !bg-white" position={Position.Bottom} type="source" />
      <div
        className={`flex min-w-[7.5rem] items-center justify-center rounded-full border-4 bg-white px-5 py-4 shadow-xl transition ${
          selected ? 'border-cyan-500 ring-4 ring-cyan-300/35' : 'border-slate-900'
        }`}
      >
        <div className="relative flex items-center gap-3">
          <span className="h-8 w-8 rounded-full border-[3px] border-slate-900 bg-white" />
          <span className="-ml-5 h-8 w-8 rounded-full border-[3px] border-slate-900 bg-white" />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: data.operatorColor }} />
        </div>
      </div>
      <div className="flex max-w-[13rem] flex-col items-center text-center" dir={data.direction}>
        <p className="text-sm font-semibold text-white" style={{ textAlign: data.textAlign }}>
          {data.label}
        </p>
        <p className="mt-1 text-xs text-slate-300">{summary}</p>
        {data.wheelchairStatus === 'accessible' ? <p className="mt-1 text-xs text-emerald-300">{text.wheelchairAccessible}</p> : null}
        {data.wheelchairStatus === 'inaccessible' ? <p className="mt-1 text-xs text-rose-300">{text.wheelchairInaccessible}</p> : null}
      </div>
    </div>
  )
}
