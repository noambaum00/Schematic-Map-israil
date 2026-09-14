import type { LocalizedStopNames, TransitLanguage, WheelchairStatus } from './gtfs'

export const DEFAULT_MERGE_RADIUS_METERS = 200

const STRIPPED_NAME_PATTERNS = [
  /\bplatform\b/gi,
  /\bterminal\b/gi,
  /\bstation\b/gi,
  /\bstop\b/gi,
  /\bbay\b/gi,
  /מסוף/gi,
  /רציף/gi,
]

export type RawStopForHubClustering = {
  names: LocalizedStopNames
  stop_id: string
  stop_name: string
  stop_lat: number
  stop_lon: number
  stop_code: string
  parent_station: string
  location_type: string
  wheelchairStatus: WheelchairStatus
}

export type HubNode = {
  id: string
  name: string
  names: LocalizedStopNames
  latitude: number
  longitude: number
  code: string
  wheelchairStatus: WheelchairStatus
  isTransferHub: boolean
  constituent_stop_ids: string[]
}

export type HubEdge = {
  id: string
  source: string
  target: string
}

export type HubClusteringResult = {
  hubNodes: HubNode[]
  stopToHubMap: Record<string, string>
}

type EdgeRemapOptions = {
  preserveDirection?: boolean
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeBaseStopName(name: string) {
  let normalized = name.normalize('NFKC').toLowerCase()

  for (const pattern of STRIPPED_NAME_PATTERNS) {
    normalized = normalized.replace(pattern, ' ')
  }

  normalized = normalized.replace(/[[\](){}'".,_/-]+/g, ' ')
  return normalizeWhitespace(normalized)
}

export function haversineDistanceMeters(
  sourceLatitude: number,
  sourceLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const earthRadiusMeters = 6371000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(targetLatitude - sourceLatitude)
  const longitudeDelta = toRadians(targetLongitude - sourceLongitude)
  const sourceLatitudeRadians = toRadians(sourceLatitude)
  const targetLatitudeRadians = toRadians(targetLatitude)

  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(sourceLatitudeRadians) * Math.cos(targetLatitudeRadians) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
}

export function areBaseNamesSimilar(leftName: string, rightName: string) {
  const normalizedLeft = normalizeBaseStopName(leftName)
  const normalizedRight = normalizeBaseStopName(rightName)

  if (!normalizedLeft || !normalizedRight) {
    return false
  }

  if (normalizedLeft === normalizedRight) {
    return true
  }

  const leftTokens = new Set(normalizedLeft.split(' '))
  const rightTokens = new Set(normalizedRight.split(' '))
  const sharedTokenCount = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const minimumTokenCount = Math.min(leftTokens.size, rightTokens.size)

  return minimumTokenCount > 0 && sharedTokenCount / minimumTokenCount >= 0.75
}

function pickLocalizedClusterName(stops: RawStopForHubClustering[], language: TransitLanguage) {
  return (
    stops
      .map((stop) => stop.names[language])
      .filter(Boolean)
      .sort((left, right) => left.length - right.length || left.localeCompare(right))[0] ?? ''
  )
}

function buildLocalizedHubNames(stops: RawStopForHubClustering[]): LocalizedStopNames {
  return {
    English: pickLocalizedClusterName(stops, 'English') || stops[0]?.stop_name || '',
    'עברית': pickLocalizedClusterName(stops, 'עברית') || pickLocalizedClusterName(stops, 'English') || stops[0]?.stop_name || '',
    'العربية': pickLocalizedClusterName(stops, 'العربية') || pickLocalizedClusterName(stops, 'English') || stops[0]?.stop_name || '',
  }
}

function getClusterWheelchairStatus(stops: RawStopForHubClustering[]): WheelchairStatus {
  if (stops.some((stop) => stop.wheelchairStatus === 'accessible')) {
    return 'accessible'
  }

  if (stops.some((stop) => stop.wheelchairStatus === 'inaccessible')) {
    return 'inaccessible'
  }

  return 'unknown'
}

function createStableHubId(stops: RawStopForHubClustering[], prefix: 'hub-parent' | 'hub-geo') {
  const sortedStopIds = stops.map((stop) => stop.stop_id).sort()
  return `${prefix}-${sortedStopIds.join('-')}`
}

function createSingleStopNode(stop: RawStopForHubClustering): HubNode {
  return {
    code: stop.stop_code,
    constituent_stop_ids: [stop.stop_id],
    id: stop.stop_id,
    isTransferHub: false,
    latitude: stop.stop_lat,
    longitude: stop.stop_lon,
    name: stop.stop_name,
    names: stop.names,
    wheelchairStatus: stop.wheelchairStatus,
  }
}

function createHubNode(hubId: string, stops: RawStopForHubClustering[]): HubNode {
  const sortedStops = [...stops].sort((left, right) => left.stop_id.localeCompare(right.stop_id) || left.stop_name.localeCompare(right.stop_name))
  const constituentStopIds = sortedStops.map((stop) => stop.stop_id)
  const centroidLatitude = sortedStops.reduce((total, stop) => total + stop.stop_lat, 0) / sortedStops.length
  const centroidLongitude = sortedStops.reduce((total, stop) => total + stop.stop_lon, 0) / sortedStops.length
  const clusterName =
    sortedStops
      .map((stop) => stop.stop_name)
      .sort((left, right) => left.length - right.length || left.localeCompare(right))[0] ??
    hubId
  const names = buildLocalizedHubNames(sortedStops)

  return {
    code: sortedStops.find((stop) => stop.stop_code)?.stop_code ?? '',
    constituent_stop_ids: constituentStopIds,
    id: hubId,
    isTransferHub: stops.length > 1,
    latitude: centroidLatitude,
    longitude: centroidLongitude,
    name: names.English || clusterName,
    names,
    wheelchairStatus: getClusterWheelchairStatus(sortedStops),
  }
}

function buildParentStationClusters(stops: RawStopForHubClustering[]) {
  const clusters = new Map<string, RawStopForHubClustering[]>()

  for (const stop of stops) {
    if (!stop.parent_station) {
      continue
    }

    const hubStops = clusters.get(stop.parent_station) ?? []
    hubStops.push(stop)
    clusters.set(stop.parent_station, hubStops)
  }

  return clusters
}

function buildProximityCluster(
  seedStop: RawStopForHubClustering,
  unassignedStops: RawStopForHubClustering[],
  mergeRadiusMeters: number,
) {
  const cluster: RawStopForHubClustering[] = []
  const queue: RawStopForHubClustering[] = [seedStop]
  const remainingStops = new Map(unassignedStops.map((stop) => [stop.stop_id, stop]))
  remainingStops.delete(seedStop.stop_id)

  while (queue.length > 0) {
    const currentStop = queue.shift()!
    cluster.push(currentStop)

    for (const candidateStop of [...remainingStops.values()]) {
      const areCloseEnough =
        haversineDistanceMeters(currentStop.stop_lat, currentStop.stop_lon, candidateStop.stop_lat, candidateStop.stop_lon) <= mergeRadiusMeters

      if (!areCloseEnough || !areBaseNamesSimilar(currentStop.stop_name, candidateStop.stop_name)) {
        continue
      }

      queue.push(candidateStop)
      remainingStops.delete(candidateStop.stop_id)
    }
  }

  return {
    cluster,
    remainingStops: unassignedStops.filter((stop) => remainingStops.has(stop.stop_id)),
  }
}

export function clusterStopsIntoTransferHubs(
  stops: RawStopForHubClustering[],
  mergeRadiusMeters = DEFAULT_MERGE_RADIUS_METERS,
): HubClusteringResult {
  const stopToHubMap: Record<string, string> = {}
  const hubNodes: HubNode[] = []
  const clusteredStopIds = new Set<string>()

  const parentStationClusters = buildParentStationClusters(stops)

  for (const [parentStationId, clusterStops] of parentStationClusters.entries()) {
    const hubId = parentStationId ? `hub-parent-${parentStationId}` : createStableHubId(clusterStops, 'hub-parent')
    const hubNode = clusterStops.length === 1 ? createSingleStopNode(clusterStops[0]!) : createHubNode(hubId, clusterStops)

    hubNodes.push(hubNode)

    for (const stop of clusterStops) {
      stopToHubMap[stop.stop_id] = hubNode.id
      clusteredStopIds.add(stop.stop_id)
    }
  }

  let proximityCandidates = stops.filter(
    (stop) => stop.location_type === '0' && !stop.parent_station && !clusteredStopIds.has(stop.stop_id),
  )

  while (proximityCandidates.length > 0) {
    const seedStop = proximityCandidates[0]!
    const { cluster, remainingStops } = buildProximityCluster(seedStop, proximityCandidates, mergeRadiusMeters)
    proximityCandidates = remainingStops

    const hubNode = cluster.length > 1 ? createHubNode(createStableHubId(cluster, 'hub-geo'), cluster) : createSingleStopNode(cluster[0]!)
    hubNodes.push(hubNode)

    for (const stop of cluster) {
      stopToHubMap[stop.stop_id] = hubNode.id
      clusteredStopIds.add(stop.stop_id)
    }
  }

  for (const stop of stops) {
    if (stop.location_type !== '0' || clusteredStopIds.has(stop.stop_id)) {
      continue
    }

    const hubNode = createSingleStopNode(stop)
    hubNodes.push(hubNode)
    stopToHubMap[stop.stop_id] = stop.stop_id
  }

  return { hubNodes, stopToHubMap }
}

export function remapEdgesToHubs(
  edges: HubEdge[],
  stopToHubMap: Record<string, string>,
  options: EdgeRemapOptions = {},
) {
  const remappedEdges: HubEdge[] = []
  const seenPairs = new Set<string>()
  const preserveDirection = options.preserveDirection ?? false

  for (const edge of edges) {
    const remappedSource = stopToHubMap[edge.source] ?? edge.source
    const remappedTarget = stopToHubMap[edge.target] ?? edge.target
    const pairKey = preserveDirection ? `${remappedSource}->${remappedTarget}` : [remappedSource, remappedTarget].sort().join('<->')

    if (remappedSource === remappedTarget || seenPairs.has(pairKey)) {
      continue
    }

    seenPairs.add(pairKey)
    remappedEdges.push({
      ...edge,
      source: remappedSource,
      target: remappedTarget,
    })
  }

  return remappedEdges
}
