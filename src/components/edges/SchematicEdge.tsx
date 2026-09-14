import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react'

import type { CanvasEdge } from '../../lib/canvasGraph'
import { buildSchematicPath } from '../../lib/schematicPath'

export function SchematicEdge({
  id,
  label,
  markerEnd,
  selected,
  sourceX,
  sourceY,
  style,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const { labelX, labelY, path } = buildSchematicPath(sourceX, sourceY, targetX, targetY)

  return (
    <>
      <BaseEdge
        id={id}
        markerEnd={markerEnd}
        path={path}
        style={{
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          ...style,
        }}
      />
      {typeof label === 'string' && label.length > 0 ? (
        <EdgeLabelRenderer>
          <div
            className={`pointer-events-none absolute rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.24em] uppercase ${
              selected
                ? 'border-cyan-300 bg-slate-900 text-cyan-100'
                : 'border-slate-700 bg-slate-950/95 text-slate-200'
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
