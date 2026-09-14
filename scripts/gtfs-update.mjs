#!/usr/bin/env node

import AdmZip from 'adm-zip'
import axios from 'axios'
import Papa from 'papaparse'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const GTFS_SOURCE_URL = process.env.GTFS_SOURCE_URL ?? 'https://gtfs.mot.gov.il/gtfsfiles/israel-public-transportation.zip'
const OUTPUT_FILE = process.env.GTFS_OUTPUT_FILE ?? join(process.cwd(), 'public', 'transit_graph.json')
const REQUIRED_FILES = ['routes.txt', 'trips.txt', 'stop_times.txt', 'stops.txt']
const OPTIONAL_FILES = ['agency.txt', 'translations.txt']
const STRIPPED_NAME_PATTERNS = [/\bplatform\b/gi, /\bterminal\b/gi, /\bstation\b/gi, /\bstop\b/gi, /\bbay\b/gi, /מסוף/gi, /רציף/gi]
const expectedGtfsHeaders = {
  'agency.txt': ['agency_name'],
  'routes.txt': ['route_id', 'route_type'],
  'stop_times.txt': ['trip_id', 'stop_id', 'stop_sequence'],
  'stops.txt': ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
  'trips.txt': ['route_id', 'trip_id'],
}
const textDecoderSpecs = [
  { encoding: 'utf-8', options: { fatal: true } },
  { encoding: 'utf-16le', options: { fatal: true } },
  { encoding: 'utf-16be', options: { fatal: true } },
  { encoding: 'windows-1255', options: { fatal: true } },
  { encoding: 'windows-1252', options: { fatal: true } },
]

class GtfsDecodeError extends Error {}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeBaseStopName(name) {
  let normalized = name.normalize('NFKC').toLowerCase()

  for (const pattern of STRIPPED_NAME_PATTERNS) {
    normalized = normalized.replace(pattern, ' ')
  }

  normalized = normalized.replace(/[()[\]{}'"._,\-/]+/g, ' ')
  return normalizeWhitespace(normalized)
}

function haversineDistanceMeters(sourceLatitude, sourceLongitude, targetLatitude, targetLongitude) {
  const earthRadiusMeters = 6371000
  const toRadians = (value) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(targetLatitude - sourceLatitude)
  const longitudeDelta = toRadians(targetLongitude - sourceLongitude)
  const sourceLatitudeRadians = toRadians(sourceLatitude)
  const targetLatitudeRadians = toRadians(targetLatitude)

  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(sourceLatitudeRadians) * Math.cos(targetLatitudeRadians) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
}

function areBaseNamesSimilar(leftName, rightName) {
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

function pickLocalizedClusterName(stops, language) {
  return (
    stops
      .map((stop) => stop.names[language])
      .filter(Boolean)
      .sort((left, right) => left.length - right.length || left.localeCompare(right))[0] ?? ''
  )
}

function buildLocalizedHubNames(stops) {
  return {
    English: pickLocalizedClusterName(stops, 'English') || stops[0]?.stop_name || '',
    'עברית': pickLocalizedClusterName(stops, 'עברית') || pickLocalizedClusterName(stops, 'English') || stops[0]?.stop_name || '',
    'العربية': pickLocalizedClusterName(stops, 'العربية') || pickLocalizedClusterName(stops, 'English') || stops[0]?.stop_name || '',
  }
}

function getClusterWheelchairStatus(stops) {
  if (stops.some((stop) => stop.wheelchairStatus === 'accessible')) {
    return 'accessible'
  }

  if (stops.some((stop) => stop.wheelchairStatus === 'inaccessible')) {
    return 'inaccessible'
  }

  return 'unknown'
}

function createStableHubId(stops, prefix) {
  const sortedStopIds = stops.map((stop) => stop.stop_id).sort()
  return `${prefix}-${sortedStopIds.join('-')}`
}

function createSingleStopNode(stop) {
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

function createHubNode(hubId, stops) {
  const sortedStops = [...stops].sort((left, right) => left.stop_id.localeCompare(right.stop_id) || left.stop_name.localeCompare(right.stop_name))
  const constituentStopIds = sortedStops.map((stop) => stop.stop_id)
  const centroidLatitude = sortedStops.reduce((total, stop) => total + stop.stop_lat, 0) / sortedStops.length
  const centroidLongitude = sortedStops.reduce((total, stop) => total + stop.stop_lon, 0) / sortedStops.length
  const clusterName =
    sortedStops.map((stop) => stop.stop_name).sort((left, right) => left.length - right.length || left.localeCompare(right))[0] ?? hubId
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

function buildParentStationClusters(stops) {
  const clusters = new Map()

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

function buildProximityCluster(seedStop, unassignedStops, mergeRadiusMeters) {
  const cluster = []
  const queue = [seedStop]
  const remainingStops = new Map(unassignedStops.map((stop) => [stop.stop_id, stop]))
  remainingStops.delete(seedStop.stop_id)

  while (queue.length > 0) {
    const currentStop = queue.shift()
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

function clusterStopsIntoTransferHubs(stops, mergeRadiusMeters = 200) {
  const stopToHubMap = {}
  const hubNodes = []
  const clusteredStopIds = new Set()
  const parentStationClusters = buildParentStationClusters(stops)

  for (const [parentStationId, clusterStops] of parentStationClusters.entries()) {
    const hubId = parentStationId ? `hub-parent-${parentStationId}` : createStableHubId(clusterStops, 'hub-parent')
    const hubNode = clusterStops.length === 1 ? createSingleStopNode(clusterStops[0]) : createHubNode(hubId, clusterStops)

    hubNodes.push(hubNode)

    for (const stop of clusterStops) {
      stopToHubMap[stop.stop_id] = hubNode.id
      clusteredStopIds.add(stop.stop_id)
    }
  }

  let proximityCandidates = stops.filter((stop) => stop.location_type === '0' && !stop.parent_station && !clusteredStopIds.has(stop.stop_id))

  while (proximityCandidates.length > 0) {
    const seedStop = proximityCandidates[0]
    const { cluster, remainingStops } = buildProximityCluster(seedStop, proximityCandidates, mergeRadiusMeters)
    proximityCandidates = remainingStops

    const hubNode = cluster.length > 1 ? createHubNode(createStableHubId(cluster, 'hub-geo'), cluster) : createSingleStopNode(cluster[0])
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

function getHeaderLine(text) {
  return stripLeadingBom(text).split(/\r?\n/u, 1)[0]?.trim() ?? ''
}

function stripLeadingBom(text) {
  return text.replace(/^\uFEFF/, '')
}

function getTextDecoderSpec(encoding) {
  const decoder = textDecoderSpecs.find((candidate) => candidate.encoding === encoding)

  if (!decoder) {
    throw new Error(`Unsupported decoder preference: ${encoding}`)
  }

  return decoder
}

function getCsvDelimiter(text, fileName) {
  const headerLine = getHeaderLine(text)

  if (fileName === 'translations.txt' && headerLine.includes(';') && !headerLine.includes(',')) {
    return ';'
  }

  return ','
}

function isLikelyGtfsCsv(text, fileName) {
  const headerLine = getHeaderLine(text)
  const delimiter = getCsvDelimiter(text, fileName)

  if (!headerLine || !headerLine.includes(delimiter) || headerLine.includes('\u0000')) {
    return false
  }

  const columns = headerLine.split(delimiter).map((value) => value.trim()).filter(Boolean)
  const expectedHeaders = expectedGtfsHeaders[fileName]

  if (!expectedHeaders) {
    return columns.length >= 1
  }

  const availableHeaders = new Set(columns)
  return expectedHeaders.every((header) => availableHeaders.has(header))
}

function getPreferredTextDecoders(buffer) {
  const leadingBytes = buffer.subarray(0, 4)

  if (leadingBytes[0] === 0xef && leadingBytes[1] === 0xbb && leadingBytes[2] === 0xbf) {
    const preferredDecoder = getTextDecoderSpec('utf-8')
    return [preferredDecoder, ...textDecoderSpecs.filter((decoder) => decoder.encoding !== preferredDecoder.encoding)]
  }

  if (leadingBytes[0] === 0xff && leadingBytes[1] === 0xfe) {
    const preferredDecoder = getTextDecoderSpec('utf-16le')
    return [preferredDecoder, ...textDecoderSpecs.filter((decoder) => decoder.encoding !== preferredDecoder.encoding)]
  }

  if (leadingBytes[0] === 0xfe && leadingBytes[1] === 0xff) {
    const preferredDecoder = getTextDecoderSpec('utf-16be')
    return [preferredDecoder, ...textDecoderSpecs.filter((decoder) => decoder.encoding !== preferredDecoder.encoding)]
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 128))
  let evenZeroBytes = 0
  let oddZeroBytes = 0

  for (let index = 0; index < sample.length; index += 1) {
    if (sample[index] !== 0) {
      continue
    }

    if (index % 2 === 0) {
      evenZeroBytes += 1
    } else {
      oddZeroBytes += 1
    }
  }

  if (oddZeroBytes >= 8 && oddZeroBytes >= evenZeroBytes * 2) {
    const preferredDecoder = getTextDecoderSpec('utf-16le')
    return [preferredDecoder, ...textDecoderSpecs.filter((decoder) => decoder.encoding !== preferredDecoder.encoding)]
  }

  if (evenZeroBytes >= 8 && evenZeroBytes >= oddZeroBytes * 2) {
    const preferredDecoder = getTextDecoderSpec('utf-16be')
    return [preferredDecoder, ...textDecoderSpecs.filter((decoder) => decoder.encoding !== preferredDecoder.encoding)]
  }

  return textDecoderSpecs
}

function decodeGtfsText(buffer, fileName) {
  const attemptedEncodings = []

  for (const { encoding, options } of getPreferredTextDecoders(buffer)) {
    try {
      const decoder = new TextDecoder(encoding, options)
      const decoded = stripLeadingBom(decoder.decode(buffer))

      if (!isLikelyGtfsCsv(decoded, fileName)) {
        attemptedEncodings.push(`${encoding} (decoded text did not match GTFS CSV headers)`)
        continue
      }

      return decoded
    } catch (error) {
      attemptedEncodings.push(`${encoding} (${error instanceof Error ? error.message : 'unknown decode error'})`)
      continue
    }
  }

  throw new GtfsDecodeError(`Unable to decode ${fileName}. Tried: ${attemptedEncodings.join(', ')}`)
}

function parseCsv(content, fileName) {
  const parsed = Papa.parse(stripLeadingBom(content), {
    delimiter: getCsvDelimiter(content, fileName),
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    throw new Error(`Failed to parse ${fileName}: ${parsed.errors[0]?.message ?? 'Invalid CSV structure.'}`)
  }

  return parsed.data
}

function findZipEntry(zip, fileName) {
  return zip.getEntries().find((entry) => entry.entryName.endsWith(`/${fileName}`) || entry.entryName === fileName)
}

function getMode(routeType) {
  if (routeType === '2') {
    return 'rail'
  }

  if (routeType === '0') {
    return 'light-rail'
  }

  return 'bus'
}

function buildRouteLabel(route) {
  const parts = [route.route_short_name ?? '', route.route_long_name ?? ''].filter(Boolean)
  return parts.join(' — ') || route.route_id
}

function mapTranslationLanguage(value) {
  const normalizedValue = String(value ?? '').trim().toLowerCase()

  if (normalizedValue.startsWith('en')) {
    return 'English'
  }

  if (normalizedValue.startsWith('he') || normalizedValue.startsWith('iw')) {
    return 'עברית'
  }

  if (normalizedValue.startsWith('ar')) {
    return 'العربية'
  }

  return null
}

function buildTranslationMap(translations) {
  const translationMap = new Map()

  for (const translation of translations) {
    if (translation.table_name !== 'stops' || translation.field_name !== 'stop_name' || !translation.record_id) {
      continue
    }

    const language = mapTranslationLanguage(translation.language || translation.lang)

    if (!language || !translation.translation) {
      continue
    }

    const localizedNames = translationMap.get(translation.record_id) ?? {}
    localizedNames[language] = translation.translation
    translationMap.set(translation.record_id, localizedNames)
  }

  return translationMap
}

function buildStopNames(stop, translationMap) {
  const translatedNames = translationMap.get(stop.stop_id)

  return {
    English: translatedNames?.English || stop.stop_name_en || stop.stop_name,
    'עברית': translatedNames?.['עברית'] || stop.stop_name_he || stop.stop_name_iw || stop.stop_name,
    'العربية': translatedNames?.['العربية'] || stop.stop_name_ar || stop.stop_name,
  }
}

function normalizeTrainTemplate(value) {
  const cleaned = String(value ?? '').trim().toUpperCase()

  if (!cleaned) {
    return null
  }

  const directTemplate = cleaned.match(/\b\dX{2,3}\b/)

  if (directTemplate) {
    return directTemplate[0]
  }

  const numberMatch = cleaned.match(/\b\d{3,4}\b/)

  if (!numberMatch) {
    return null
  }

  const digits = numberMatch[0]
  return `${digits[0]}${'X'.repeat(digits.length - 1)}`
}

function extractTrainTemplates(route, trips) {
  const candidates = new Set()

  for (const value of [route.route_short_name, ...trips.map((trip) => trip.trip_short_name)]) {
    const template = normalizeTrainTemplate(value)

    if (template) {
      candidates.add(template)
    }
  }

  return [...candidates].sort()
}

function parseWheelchairStatus(value) {
  if (value === '1') {
    return 'accessible'
  }

  if (value === '2') {
    return 'inaccessible'
  }

  return 'unknown'
}

function buildClusterableStop(stop, translationMap) {
  return {
    location_type: stop.location_type ?? '0',
    names: buildStopNames(stop, translationMap),
    parent_station: stop.parent_station ?? '',
    stop_code: stop.stop_code ?? '',
    stop_id: stop.stop_id,
    stop_lat: Number(stop.stop_lat ?? 0),
    stop_lon: Number(stop.stop_lon ?? 0),
    stop_name: stop.stop_name,
    wheelchairStatus: parseWheelchairStatus(stop.wheelchair_boarding ?? '0'),
  }
}

function getOperatorColor(operatorName) {
  const normalizedName = String(operatorName ?? '').toLowerCase()
  const isNtaOperator = /\bdankal\b/.test(normalizedName) || /\bnta\b/.test(normalizedName) || /נת["”״']?ע/.test(String(operatorName ?? '')) || normalizedName.includes('light rail')

  if (normalizedName.includes('israel rail') || normalizedName.includes('railways') || normalizedName.includes('רכבת')) {
    return '#0033A0'
  }

  if (isNtaOperator) {
    return '#E31837'
  }

  if (normalizedName.includes('egged')) {
    return '#007A33'
  }

  if (normalizedName.includes('דן') || normalizedName.includes(' dan ') || normalizedName.startsWith('dan')) {
    return '#FF7900'
  }

  if (normalizedName.includes('kavim') || normalizedName.includes('קווים')) {
    return '#00AEEF'
  }

  if (normalizedName.includes('bus')) {
    return '#F59E0B'
  }

  return '#38BDF8'
}

function classifyFrequencyTier(tripCount) {
  if (tripCount >= 120) {
    return 'HIGH_FREQUENCY'
  }

  if (tripCount >= 40) {
    return 'MEDIUM_FREQUENCY'
  }

  return 'LOW_FREQUENCY'
}

async function downloadGtfsArchive() {
  console.log(`Downloading GTFS archive from ${GTFS_SOURCE_URL}`)
  const response = await axios.get(GTFS_SOURCE_URL, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxRedirects: 5,
  })

  return Buffer.from(response.data)
}

async function extractFilesToTempDirectory(buffer) {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'gtfs-update-'))
  const zip = new AdmZip(buffer)
  const extractedFiles = new Map()

  try {
    for (const fileName of [...REQUIRED_FILES, ...OPTIONAL_FILES]) {
      const entry = findZipEntry(zip, fileName)

      if (!entry) {
        if (REQUIRED_FILES.includes(fileName)) {
          throw new Error(`Missing ${fileName} in the GTFS archive.`)
        }
        continue
      }

      const filePath = join(tempDirectory, fileName)
      await writeFile(filePath, entry.getData())
      extractedFiles.set(fileName, filePath)
    }

    return { extractedFiles, tempDirectory }
  } catch (error) {
    await rm(tempDirectory, { force: true, recursive: true })
    throw error
  }
}

function handleOptionalFileError(fileName, error) {
  console.warn(`Skipping optional ${fileName}: ${error instanceof Error ? error.message : error}`)
}

function isDecodeFailure(error) {
  return error instanceof GtfsDecodeError
}

async function parseExtractedFile(extractedFiles, fileName, { required = true } = {}) {
  const filePath = extractedFiles.get(fileName)

  if (!filePath) {
    if (required) {
      throw new Error(`Missing ${fileName} in the extracted GTFS archive.`)
    }

    return null
  }

  let content

  try {
    content = decodeGtfsText(await readFile(filePath), fileName)
  } catch (error) {
    if (!required && isDecodeFailure(error)) {
      handleOptionalFileError(fileName, error)
      return null
    }

    throw error
  }

  return parseCsv(content, fileName)
}

async function buildTransitGraphPayload(extractedFiles) {
  const agencies = (await parseExtractedFile(extractedFiles, 'agency.txt', { required: false })) ?? []
  const routes = (await parseExtractedFile(extractedFiles, 'routes.txt')) ?? []
  const trips = (await parseExtractedFile(extractedFiles, 'trips.txt')) ?? []
  const stopTimes = (await parseExtractedFile(extractedFiles, 'stop_times.txt')) ?? []
  const stops = (await parseExtractedFile(extractedFiles, 'stops.txt')) ?? []
  const translations = (await parseExtractedFile(extractedFiles, 'translations.txt', { required: false })) ?? []
  const translationMap = buildTranslationMap(translations)

  const agencyMap = new Map()
  const tripsByRoute = new Map()
  const stopTimesByTrip = new Map()
  const clusteredStops = clusterStopsIntoTransferHubs(stops.map((stop) => buildClusterableStop(stop, translationMap)))
  const clusteredStopMap = new Map(clusteredStops.hubNodes.map((stop) => [stop.id, stop]))
  const singleAgency = agencies.length === 1 ? agencies[0] : null

  for (const agency of agencies) {
    const agencyId = agency.agency_id || agency.agency_name || 'unknown'
    agencyMap.set(agencyId, agency)
  }

  for (const trip of trips) {
    if (!trip.route_id || !trip.trip_id) {
      continue
    }

    const routeTrips = tripsByRoute.get(trip.route_id) ?? []
    routeTrips.push(trip)
    tripsByRoute.set(trip.route_id, routeTrips)
  }

  for (const stopTime of stopTimes) {
    if (!stopTime.trip_id || !stopTime.stop_id) {
      continue
    }

    const tripStops = stopTimesByTrip.get(stopTime.trip_id) ?? []
    tripStops.push(stopTime)
    stopTimesByTrip.set(stopTime.trip_id, tripStops)
  }

  const parsedRoutes = routes
    .map((route) => {
      if (!route.route_id) {
        return null
      }

      const routeTrips = tripsByRoute.get(route.route_id) ?? []
      const operator =
        (route.agency_id ? agencyMap.get(route.agency_id)?.agency_name : singleAgency?.agency_name) ??
        agencies[0]?.agency_name ??
        route.route_desc ??
        'Unknown operator'

      let representativeTrip = null
      let representativeStopIds = []

      for (const trip of routeTrips) {
        const orderedStops = [...(stopTimesByTrip.get(trip.trip_id) ?? [])]
          .sort((left, right) => Number(left.stop_sequence ?? 0) - Number(right.stop_sequence ?? 0))
          .map((stopTime) => stopTime.stop_id)

        if (orderedStops.length > representativeStopIds.length) {
          representativeTrip = trip
          representativeStopIds = orderedStops
        }
      }

      if (!representativeTrip || representativeStopIds.length < 2) {
        return null
      }

      const trainTemplates = getMode(route.route_type ?? '3') === 'rail' ? extractTrainTemplates(route, routeTrips) : []
      const tripCount = routeTrips.length
      const remappedStopIds = representativeStopIds
        .map((stopId) => clusteredStops.stopToHubMap[stopId] ?? stopId)
        .filter((stopId, index, allStopIds) => index === 0 || stopId !== allStopIds[index - 1])
      const seenStopIds = new Set()
      const orderedUniqueStopIds = remappedStopIds.filter((stopId) => {
        if (seenStopIds.has(stopId)) {
          return false
        }

        seenStopIds.add(stopId)
        return true
      })

      const uniqueStops = orderedUniqueStopIds
        .map((stopId) => clusteredStopMap.get(stopId))
        .filter(Boolean)
        .map((stop) => ({
          code: stop.code,
          constituent_stop_ids: stop.constituent_stop_ids,
          id: stop.id,
          isTransferHub: stop.isTransferHub,
          latitude: stop.latitude,
          longitude: stop.longitude,
          name: stop.name,
          names: stop.names,
          wheelchairStatus: stop.wheelchairStatus,
        }))

      if (uniqueStops.length < 2) {
        return null
      }

      return {
        id: route.route_id,
        label: buildRouteLabel(route),
        description: route.route_desc || representativeTrip.trip_headsign || '',
        frequencyTier: classifyFrequencyTier(tripCount),
        mode: getMode(route.route_type ?? '3'),
        operator,
        operatorColor: getOperatorColor(operator),
        representativeHeadsign: representativeTrip.trip_headsign || '',
        representativeTripId: representativeTrip.trip_id,
        stops: uniqueStops,
        tripCount,
        trainTemplateLabel: trainTemplates.length > 0 ? trainTemplates.join(' / ') : null,
        trainTemplates,
      }
    })
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label))

  return {
    agencies: agencies.length,
    fileName: 'israel-public-transportation.zip',
    hubStops: clusteredStops.hubNodes.length,
    routes: parsedRoutes,
    stops: stops.length,
    trips: trips.length,
  }
}

async function main() {
  const archiveBuffer = await downloadGtfsArchive()
  const { extractedFiles, tempDirectory } = await extractFilesToTempDirectory(archiveBuffer)

  try {
    const feed = await buildTransitGraphPayload(extractedFiles)
    await mkdir(dirname(OUTPUT_FILE), { recursive: true })
    await writeFile(OUTPUT_FILE, `${JSON.stringify(feed, null, 2)}\n`, 'utf8')
    console.log(`Wrote ${feed.routes.length} routes to ${OUTPUT_FILE}`)
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
