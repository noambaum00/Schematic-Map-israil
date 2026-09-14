import { BaseEdge, type EdgeProps } from '@xyflow/react'

import type { CanvasEdge } from '../../lib/canvasGraph'
import { buildSchematicPath } from '../../lib/schematicPath'
import { EdgeLabel } from './EdgeLabel'

export function SchematicEdge({
  data,
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
  const isManual = data?.isManual
  const stroke = data?.customColor ?? style?.stroke
  const strokeWidth = data?.customStrokeWidth ?? style?.strokeWidth

  return (
    <>
      <BaseEdge
        id={id}
        markerEnd={markerEnd}
        path={path}
        style={{
          ...style,
          stroke,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth,
        }}
      />
      {typeof label === 'string' && label.length > 0 ? (
        <EdgeLabel isManual={isManual} label={label} labelX={labelX} labelY={labelY} selected={Boolean(selected)} />
      ) : null}
    </>
  )
}
