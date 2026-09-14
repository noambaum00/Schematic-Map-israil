import { SmoothStepEdge, type EdgeProps } from '@xyflow/react'

import type { CanvasEdge } from '../../lib/canvasGraph'
import { EdgeLabel } from './EdgeLabel'

export function RoundedStepEdge({
  data,
  label,
  selected,
  sourceX,
  sourceY,
  style,
  targetX,
  targetY,
  ...edgeProps
}: EdgeProps<CanvasEdge>) {
  const isManual = data?.isManual
  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2

  return (
    <>
      <SmoothStepEdge
        {...edgeProps}
        sourceX={sourceX}
        sourceY={sourceY}
        style={style}
        targetX={targetX}
        targetY={targetY}
      />
      {typeof label === 'string' && label.length > 0 ? (
        <EdgeLabel isManual={isManual} label={label} labelX={labelX} labelY={labelY} selected={Boolean(selected)} />
      ) : null}
    </>
  )
}
