import { EdgeLabelRenderer } from '@xyflow/react'

type EdgeLabelProps = {
  isManual?: boolean
  label: string
  labelX: number
  labelY: number
  selected: boolean
}

export function EdgeLabel({ isManual, label, labelX, labelY, selected }: EdgeLabelProps) {
  return (
    <EdgeLabelRenderer>
      <div
        className={`pointer-events-none absolute rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.24em] uppercase ${
          selected
            ? 'border-cyan-300 bg-slate-900 text-cyan-100'
            : isManual
              ? 'border-slate-500 bg-slate-950/95 text-slate-100'
              : 'border-slate-700 bg-slate-950/95 text-slate-200'
        }`}
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
      >
        {label}
      </div>
    </EdgeLabelRenderer>
  )
}
