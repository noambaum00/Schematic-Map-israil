import { useMemo, useState } from 'react'

import type { ParsedFeed, ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { parseGtfsArchive } from '../lib/gtfs'
import { MapCanvasPlaceholder } from './MapCanvasPlaceholder'
import { Sidebar } from './Sidebar'

const defaultLanguage: TransitLanguage = 'English'

export function TransitMapLayout() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<TransitLanguage>(defaultLanguage)
  const [feed, setFeed] = useState<ParsedFeed | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const routes = feed?.routes ?? []

    if (!normalizedQuery) {
      return routes
    }

    return routes.filter((route) => {
      const haystack = [
        route.label,
        route.operator,
        route.mode,
        route.description,
        route.trainTemplateLabel ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [feed?.routes, query])

  const resolvedSelectedRouteId = useMemo(() => {
    if (selectedRouteId && filteredRoutes.some((route) => route.id === selectedRouteId)) {
      return selectedRouteId
    }

    return filteredRoutes[0]?.id ?? null
  }, [filteredRoutes, selectedRouteId])

  const selectedRoute = useMemo<ParsedRoute | null>(
    () => filteredRoutes.find((route) => route.id === resolvedSelectedRouteId) ?? null,
    [filteredRoutes, resolvedSelectedRouteId],
  )

  async function handleFileSelected(file: File | null) {
    if (!file) {
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const parsedFeed = await parseGtfsArchive(file)
      setFeed(parsedFeed)
      setSelectedRouteId(parsedFeed.routes[0]?.id ?? null)
    } catch (error) {
      setFeed(null)
      setSelectedRouteId(null)
      setLoadError(error instanceof Error ? error.message : 'Failed to parse GTFS archive.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 text-left xl:grid-cols-[420px_minmax(0,1fr)] xl:px-6 xl:py-6">
      <Sidebar
        activeLanguage={language}
        feed={feed}
        isLoading={isLoading}
        loadError={loadError}
        query={query}
        routes={filteredRoutes}
        selectedRouteId={resolvedSelectedRouteId}
        onFileSelected={handleFileSelected}
        onLanguageChange={setLanguage}
        onQueryChange={setQuery}
        onRouteSelect={setSelectedRouteId}
      />
      <MapCanvasPlaceholder activeLanguage={language} isLoading={isLoading} route={selectedRoute} />
    </main>
  )
}
