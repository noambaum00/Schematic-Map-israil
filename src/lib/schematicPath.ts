type Point = {
  x: number
  y: number
}

type Segment = {
  end: Point
  length: number
  start: Point
}

export type SchematicPathResult = {
  labelX: number
  labelY: number
  path: string
  segments: Segment[]
}

function getSegmentLength(start: Point, end: Point) {
  return Math.hypot(end.x - start.x, end.y - start.y)
}

function getMidpoint(start: Point, end: Point) {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  }
}

export function buildSchematicPath(sourceX: number, sourceY: number, targetX: number, targetY: number): SchematicPathResult {
  const start = { x: sourceX, y: sourceY }
  const end = { x: targetX, y: targetY }
  const deltaX = targetX - sourceX
  const deltaY = targetY - sourceY
  const absoluteDeltaX = Math.abs(deltaX)
  const absoluteDeltaY = Math.abs(deltaY)
  const horizontalDirection = deltaX >= 0 ? 1 : -1
  const verticalDirection = deltaY >= 0 ? 1 : -1

  const points = [start]

  if (absoluteDeltaX !== 0 && absoluteDeltaY !== 0 && absoluteDeltaX !== absoluteDeltaY) {
    if (absoluteDeltaX > absoluteDeltaY) {
      points.push({
        x: targetX - horizontalDirection * absoluteDeltaY,
        y: sourceY,
      })
    } else {
      points.push({
        x: sourceX,
        y: targetY - verticalDirection * absoluteDeltaX,
      })
    }
  }

  points.push(end)
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  const segments = points.slice(1).map<Segment>((point, index) => ({
    end: point,
    length: getSegmentLength(points[index], point),
    start: points[index],
  }))

  if (segments.length === 0) {
    return {
      labelX: sourceX,
      labelY: sourceY,
      path,
      segments,
    }
  }

  const labelSegment = segments.reduce((longest, segment) => (segment.length > longest.length ? segment : longest), segments[0]!)
  const labelPosition = getMidpoint(labelSegment.start, labelSegment.end)

  return {
    labelX: labelPosition.x,
    labelY: labelPosition.y,
    path,
    segments,
  }
}
