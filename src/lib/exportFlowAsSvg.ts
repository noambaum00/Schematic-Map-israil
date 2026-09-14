import { toSvg } from 'html-to-image'

import type { Edge, Node, ReactFlowInstance } from '@xyflow/react'

async function waitForPaint() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

type ExportFlowAsSvgOptions<NodeType extends Node = Node, EdgeType extends Edge = Edge> = {
  fileName: string
  reactFlow: ReactFlowInstance<NodeType, EdgeType>
  wrapper: HTMLDivElement | null
}

export async function exportFlowAsSvg<NodeType extends Node = Node, EdgeType extends Edge = Edge>({
  fileName,
  reactFlow,
  wrapper,
}: ExportFlowAsSvgOptions<NodeType, EdgeType>) {
  if (!wrapper) {
    throw new Error('The canvas is not ready for export yet.')
  }

  const viewport = wrapper.querySelector<HTMLDivElement>('.react-flow__viewport')

  if (!viewport) {
    throw new Error('Unable to find the React Flow viewport for export.')
  }

  const nodes = reactFlow.getNodes()
  const previousViewport = reactFlow.getViewport()

  try {
    if (nodes.length > 0) {
      await reactFlow.fitView({ duration: 0, includeHiddenNodes: true, padding: 0.2 })
      await waitForPaint()
    }

    const dataUrl = await toSvg(viewport, {
      backgroundColor: '#020617',
      cacheBust: true,
      pixelRatio: 2,
    })
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = blobUrl
    link.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)
  } finally {
    await reactFlow.setViewport(previousViewport, { duration: 0 })
  }
}
