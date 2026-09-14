import { useMemo, useState } from 'react'

import { demoRoutes } from '../data/transitPlan'
import { MapCanvasPlaceholder } from './MapCanvasPlaceholder'
import { Sidebar } from './Sidebar'

const defaultLanguage = 'English' as const

export function TransitMapLayout() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<'English' | 'עברית' | 'العربية'>(defaultLanguage)

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return demoRoutes
    }

    return demoRoutes.filter((route) => {
      const haystack = `${route.label} ${route.operator} ${route.mode}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [query])

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 text-left xl:grid-cols-[420px_minmax(0,1fr)] xl:px-6 xl:py-6">
      <Sidebar
        activeLanguage={language}
        query={query}
        selectedRoutes={filteredRoutes}
        onLanguageChange={setLanguage}
        onQueryChange={setQuery}
      />
      <MapCanvasPlaceholder activeLanguage={language} selectedRoutes={filteredRoutes} />
    </main>
  )
}
