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
        className={`pointer-events-none absolute rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
          selected
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : isManual
              ? 'border-gray-200 bg-white text-gray-700'
              : 'border-gray-200 bg-gray-50 text-gray-700'
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
