import type { ParsedFeed, ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { algorithmPlans, architectureSections, operatorColors, packageGroups } from '../data/transitPlan'

type SidebarProps = {
  activeLanguage: TransitLanguage
  feed: ParsedFeed | null
  isLoading: boolean
  loadError: string | null
  onFileSelected: (file: File | null) => void
  onLanguageChange: (language: TransitLanguage) => void
  onRouteSelect: (routeId: string) => void
  query: string
  routes: ParsedRoute[]
  selectedRouteId: string | null
  onQueryChange: (value: string) => void
}

const languages = ['English', 'עברית', 'العربية'] as const

export function Sidebar({
  activeLanguage,
  feed,
  isLoading,
  loadError,
  onFileSelected,
  onLanguageChange,
  onRouteSelect,
  query,
  routes,
  selectedRouteId,
  onQueryChange,
}: SidebarProps) {
  const resultLabel = `${routes.length} route${routes.length === 1 ? '' : 's'} shown from the loaded GTFS feed`

  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto border-b border-white/10 bg-slate-950/70 p-6 backdrop-blur xl:border-b-0 xl:border-r">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Phase 2</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Israel schematic map planner</h1>
          <p className="mt-2 text-sm text-slate-300">
            Load a real GTFS zip, search routes, and inspect a live schematic preview with Israel Railways
            train-series labels rendered directly on route edges.
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">GTFS source</h2>
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Real data only</span>
        </div>
        <label className="block text-sm text-slate-300" htmlFor="gtfs-file">
          Upload an official Israel MOT GTFS zip archive
        </label>
        <input
          accept=".zip,application/zip"
          className="block w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-cyan-100"
          id="gtfs-file"
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-slate-400">
          {isLoading
            ? 'Parsing GTFS archive…'
            : feed
              ? `Loaded ${feed.fileName} · ${feed.routes.length} routes · ${feed.trips} trips · ${feed.stops} stops`
              : 'No feed loaded yet.'}
        </p>
        {loadError ? <p className="text-sm text-rose-300">{loadError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Search &amp; selection</h2>
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">GTFS-aware</span>
        </div>
        <label className="block text-sm text-slate-300" htmlFor="route-query">
          Search rail, light rail, or bus lines
        </label>
        <input
          aria-describedby="route-query-status"
          id="route-query"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
          placeholder="e.g. A1, Red Line, 480"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <p aria-live="polite" className="text-sm text-slate-400" id="route-query-status">
          {resultLabel}
        </p>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId

            return (
              <button
                key={route.id}
                className={`block w-full rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-cyan-300 bg-cyan-300/10'
                    : 'border-white/10 bg-slate-950/40 hover:border-white/30'
                }`}
                type="button"
                onClick={() => onRouteSelect(route.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{route.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{route.operator}</p>
                  </div>
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full border border-white/20"
                    style={{ backgroundColor: route.operatorColor }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 px-2 py-1">{route.mode}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1">{route.stops.length} stops</span>
                  {route.trainTemplateLabel ? (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-100">
                      {route.trainTemplateLabel}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
          {routes.length === 0 ? (
            <p className="text-sm text-slate-500">
              {feed ? 'No routes match the current search.' : 'Load a feed to browse routes.'}
            </p>
          ) : null}
        </div>
      </section>

      <fieldset className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-white">Language</legend>
          <span className="text-xs text-slate-400">RTL/LTR ready</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((language) => {
            const isActive = language === activeLanguage

            return (
              <label key={language} className="block cursor-pointer">
                <input
                  checked={isActive}
                  className="peer sr-only"
                  name="interface-language"
                  type="radio"
                  value={language}
                  onChange={() => onLanguageChange(language)}
                />
                <span className="block rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-center text-sm text-slate-300 transition peer-checked:border-cyan-300 peer-checked:bg-cyan-300/15 peer-checked:text-white peer-focus-visible:border-cyan-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-300 hover:border-white/30">
                  {language}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Architecture</h2>
          <span className="text-xs text-slate-400">Phase 2</span>
        </div>
        {architectureSections.map((section) => (
          <article key={section.title} className="space-y-2">
            <h3 className="text-sm font-medium text-cyan-100">{section.title}</h3>
            <p className="text-sm text-slate-300">{section.summary}</p>
            <ul className="space-y-1 text-sm text-slate-400">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-white">Algorithms</h2>
        {algorithmPlans.map((plan) => (
          <article key={plan.title} className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <div>
              <h3 className="text-sm font-medium text-cyan-100">{plan.title}</h3>
              <p className="text-sm text-slate-300">{plan.goal}</p>
            </div>
            <ol className="space-y-1 text-sm text-slate-400">
              {plan.steps.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-medium text-cyan-300">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-white">Installed npm packages</h2>
        {packageGroups.map((group) => (
          <article key={group.category} className="space-y-2">
            <h3 className="text-sm font-medium text-cyan-100">{group.category}</h3>
            <div className="flex flex-wrap gap-2">
              {group.packages.map((pkg) => (
                <code key={pkg} className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                  {pkg}
                </code>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Operator colors</h2>
          <span className="text-xs text-slate-400">Live route styling</span>
        </div>
        <div className="space-y-3">
          {operatorColors.map((operator) => (
            <div key={operator.name} className="flex items-start gap-3">
              <span className="mt-1 h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: operator.hex }} />
              <div>
                <p className="text-sm font-medium text-white">{operator.name}</p>
                <p className="text-sm text-slate-400">{operator.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
