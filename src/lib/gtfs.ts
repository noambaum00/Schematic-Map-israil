import JSZip from 'jszip'
import Papa from 'papaparse'
import { z } from 'zod'

import { getOperatorColor } from '../data/transitPlan'

const agencySchema = z.object({
  agency_id: z.string().optional().default(''),
  agency_name: z.string().optional().default('Unknown operator'),
})

const routeSchema = z.object({
  route_id: z.string().min(1),
  agency_id: z.string().optional().default(''),
  route_short_name: z.string().optional().default(''),
  route_long_name: z.string().optional().default(''),
  route_desc: z.string().optional().default(''),
  route_type: z.string().optional().default('3'),
})

const tripSchema = z.object({
  route_id: z.string().min(1),
  service_id: z.string().optional().default(''),
  trip_id: z.string().min(1),
  trip_short_name: z.string().optional().default(''),
  trip_headsign: z.string().optional().default(''),
})

const stopTimeSchema = z.object({
  trip_id: z.string().min(1),
  stop_id: z.string().min(1),
  stop_sequence: z.string().optional().default('0'),
})

const stopSchema = z.object({
  stop_id: z.string().min(1),
  stop_name: z.string().min(1),
  stop_lat: z.string().optional().default('0'),
  stop_lon: z.string().optional().default('0'),
  stop_code: z.string().optional().default(''),
  wheelchair_boarding: z.string().optional().default('0'),
})

type AgencyRow = z.infer<typeof agencySchema>
type RouteRow = z.infer<typeof routeSchema>
type TripRow = z.infer<typeof tripSchema>
type StopTimeRow = z.infer<typeof stopTimeSchema>
type StopRow = z.infer<typeof stopSchema>

export type TransitMode = 'rail' | 'light-rail' | 'bus'
export type TransitLanguage = 'English' | 'עברית' | 'العربية'

export type ParsedStop = {
  id: string
  name: string
  code: string
  latitude: number
  longitude: number
  wheelchairBoarding: string
}

export type ParsedRoute = {
  id: string
  label: string
  description: string
  mode: TransitMode
  operator: string
  operatorColor: string
  trainTemplates: string[]
  trainTemplateLabel: string | null
  representativeTripId: string
  representativeHeadsign: string
  stops: ParsedStop[]
}

export type ParsedFeed = {
  fileName: string
  agencies: number
  routes: ParsedRoute[]
  stops: number
  trips: number
}

type ParsedCsvResult<T> = {
  data: T[]
}

function parseCsv<T extends z.ZodTypeAny>(content: string, schema: T): ParsedCsvResult<z.infer<T>> {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'Failed to parse GTFS CSV file.')
  }

  const data = parsed.data.map((row) => schema.parse(row))
  return { data }
}

function findZipEntry(zip: JSZip, fileName: string) {
  return Object.values(zip.files).find((entry) => entry.name.endsWith(`/${fileName}`) || entry.name === fileName)
}

function getMode(routeType: string): TransitMode {
  if (routeType === '2') {
    return 'rail'
  }

  if (routeType === '0') {
    return 'light-rail'
  }

  return 'bus'
}

function buildRouteLabel(route: RouteRow) {
  const parts = [route.route_short_name, route.route_long_name].filter(Boolean)
  return parts.join(' — ') || route.route_id
}

function normalizeTrainTemplate(value: string) {
  const cleaned = value.trim().toUpperCase()

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

function extractTrainTemplates(route: RouteRow, trips: TripRow[]) {
  const candidates = new Set<string>()

  for (const value of [route.route_short_name, ...trips.map((trip) => trip.trip_short_name)]) {
    const template = normalizeTrainTemplate(value)

    if (template) {
      candidates.add(template)
    }
  }

  return [...candidates].sort()
}

function dedupeConsecutiveStops(stopIds: string[]) {
  return stopIds.filter((stopId, index) => index === 0 || stopId !== stopIds[index - 1])
}

export async function parseGtfsArchive(file: File): Promise<ParsedFeed> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  const agencyEntry = findZipEntry(zip, 'agency.txt')
  const requiredEntries = {
    routes: ['routes.txt', findZipEntry(zip, 'routes.txt')] as const,
    trips: ['trips.txt', findZipEntry(zip, 'trips.txt')] as const,
    stopTimes: ['stop_times.txt', findZipEntry(zip, 'stop_times.txt')] as const,
    stops: ['stops.txt', findZipEntry(zip, 'stops.txt')] as const,
  }

  for (const [, [fileName, entry]] of Object.entries(requiredEntries)) {
    if (!entry) {
      throw new Error(`Missing ${fileName} in the GTFS archive.`)
    }
  }

  const [agencyText, routesText, tripsText, stopTimesText, stopsText] = await Promise.all([
    agencyEntry?.async('text') ?? Promise.resolve(''),
    requiredEntries.routes[1]!.async('text'),
    requiredEntries.trips[1]!.async('text'),
    requiredEntries.stopTimes[1]!.async('text'),
    requiredEntries.stops[1]!.async('text'),
  ])

  const agencies = agencyText ? parseCsv(agencyText, agencySchema).data : []
  const routes = parseCsv(routesText, routeSchema).data
  const trips = parseCsv(tripsText, tripSchema).data
  const stopTimes = parseCsv(stopTimesText, stopTimeSchema).data
  const stops = parseCsv(stopsText, stopSchema).data

  const agencyMap = new Map<string, AgencyRow>()
  const stopMap = new Map<string, StopRow>()
  const tripsByRoute = new Map<string, TripRow[]>()
  const stopTimesByTrip = new Map<string, StopTimeRow[]>()
  const singleAgency = agencies.length === 1 ? agencies[0] : null

  for (const agency of agencies) {
    agencyMap.set(agency.agency_id || agency.agency_name, agency)
  }

  for (const stop of stops) {
    stopMap.set(stop.stop_id, stop)
  }

  for (const trip of trips) {
    const routeTrips = tripsByRoute.get(trip.route_id) ?? []
    routeTrips.push(trip)
    tripsByRoute.set(trip.route_id, routeTrips)
  }

  for (const stopTime of stopTimes) {
    const tripStops = stopTimesByTrip.get(stopTime.trip_id) ?? []
    tripStops.push(stopTime)
    stopTimesByTrip.set(stopTime.trip_id, tripStops)
  }

  const parsedRoutes = routes
    .map((route) => {
      const routeTrips = tripsByRoute.get(route.route_id) ?? []
      const operator =
        (route.agency_id ? agencyMap.get(route.agency_id)?.agency_name : singleAgency?.agency_name) ??
        agencies[0]?.agency_name ??
        (route.route_desc || 'Unknown operator')

      let representativeTrip: TripRow | null = null
      let representativeStopIds: string[] = []

      for (const trip of routeTrips) {
        const orderedStops = (stopTimesByTrip.get(trip.trip_id) ?? [])
          .slice()
          .sort((left, right) => Number(left.stop_sequence) - Number(right.stop_sequence))
          .map((stopTime) => stopTime.stop_id)

        if (orderedStops.length > representativeStopIds.length) {
          representativeTrip = trip
          representativeStopIds = orderedStops
        }
      }

      if (!representativeTrip || representativeStopIds.length < 2) {
        return null
      }

      const trainTemplates = getMode(route.route_type) === 'rail' ? extractTrainTemplates(route, routeTrips) : []
      const uniqueStops = dedupeConsecutiveStops(representativeStopIds)
        .map((stopId) => stopMap.get(stopId))
        .filter((stop): stop is StopRow => Boolean(stop))
        .map((stop) => ({
          id: stop.stop_id,
          name: stop.stop_name,
          code: stop.stop_code,
          latitude: Number(stop.stop_lat),
          longitude: Number(stop.stop_lon),
          wheelchairBoarding: stop.wheelchair_boarding,
        }))

      return {
        id: route.route_id,
        label: buildRouteLabel(route),
        description: route.route_desc || representativeTrip.trip_headsign,
        mode: getMode(route.route_type),
        operator,
        operatorColor: getOperatorColor(operator),
        trainTemplates,
        trainTemplateLabel: trainTemplates.length > 0 ? trainTemplates.join(' / ') : null,
        representativeTripId: representativeTrip.trip_id,
        representativeHeadsign: representativeTrip.trip_headsign,
        stops: uniqueStops,
      } satisfies ParsedRoute
    })
    .filter((route): route is ParsedRoute => Boolean(route))
    .sort((left, right) => left.label.localeCompare(right.label))

  return {
    fileName: file.name,
    agencies: agencies.length,
    routes: parsedRoutes,
    stops: stops.length,
    trips: trips.length,
  }
}
