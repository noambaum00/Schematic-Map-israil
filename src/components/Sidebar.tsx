import type { ParsedFeed, ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { algorithmPlans, architectureSections, operatorColors, packageGroups } from '../data/transitPlan'
import type { CanvasEdge, EdgeRoutingStyle } from '../lib/canvasGraph'
import { interfaceText } from '../lib/uiText'

type SidebarProps = {
  activeLanguage: TransitLanguage
  exportError: string | null
  feed: ParsedFeed | null
  globalEdgeStyle: EdgeRoutingStyle
  isExporting: boolean
  isSharing: boolean
  isLoading: boolean
  loadError: string | null
  onAddPoi: () => void
  onEdgeColorChange: (color: string) => void
  onEdgeStrokeWidthChange: (strokeWidth: number) => void
  onExportSvg: () => void
  onFileSelected: (file: File | null) => void
  onGlobalEdgeStyleChange: (style: EdgeRoutingStyle) => void
  onLanguageChange: (language: TransitLanguage) => void
  onPoiLabelChange: (value: string) => void
  onRouteSelect: (routeId: string) => void
  onShareMap: () => void
  poiLabel: string
  query: string
  routes: ParsedRoute[]
  selectedRouteId: string | null
  selectedEdge: CanvasEdge | null
  shareError: string | null
  shareMessage: string | null
  onQueryChange: (value: string) => void
}

const languages = ['English', 'עברית', 'العربية'] as const
const edgeColorPalette = ['#0033A0', '#E31837', '#007A33', '#FF7900', '#00AEEF', '#f8fafc', '#f59e0b', '#a855f7'] as const
const edgeStyleOptions: EdgeRoutingStyle[] = ['schematic', 'default', 'smoothstep', 'straight']

export function Sidebar({
  activeLanguage,
  exportError,
  feed,
  globalEdgeStyle,
  isExporting,
  isSharing,
  isLoading,
  loadError,
  onAddPoi,
  onEdgeColorChange,
  onEdgeStrokeWidthChange,
  onExportSvg,
  onFileSelected,
  onGlobalEdgeStyleChange,
  onLanguageChange,
  onPoiLabelChange,
  onRouteSelect,
  onShareMap,
  poiLabel,
  query,
  routes,
  selectedRouteId,
  selectedEdge,
  shareError,
  shareMessage,
  onQueryChange,
}: SidebarProps) {
  const text = interfaceText[activeLanguage]
  const resultLabel =
    activeLanguage === 'English'
      ? `${routes.length} route${routes.length === 1 ? '' : 's'} shown from the loaded GTFS feed`
      : text.resultLabel.replace('{count}', String(routes.length))
  const hasSelectedPoi = poiLabel.length > 0
  const selectedEdgeColor =
    selectedEdge?.data?.customColor ??
    (typeof selectedEdge?.style?.stroke === 'string' ? selectedEdge.style.stroke : '#94a3b8')
  const selectedEdgeStrokeWidth = Number(selectedEdge?.data?.customStrokeWidth ?? selectedEdge?.style?.strokeWidth ?? 3)
  const selectedEdgeLabel = selectedEdge?.data?.isManual ? text.manualEdge : text.transitEdge

  return (
    <aside
      className={`flex h-full flex-col gap-6 overflow-y-auto border-b border-white/10 bg-slate-950/70 p-6 backdrop-blur xl:border-b-0 ${
        activeLanguage === 'English' ? 'xl:border-r' : 'xl:border-l'
      }`}
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{text.phase}</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Israel schematic map planner</h1>
          <p className="mt-2 text-sm text-slate-300">
            {text.canvasRegionDescription}
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.gtfsSource}</h2>
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{text.realDataOnly}</span>
        </div>
        <label className="block text-sm text-slate-300" htmlFor="gtfs-file">
          {text.uploadGtfs}
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
            ? text.parsingGtfs
            : feed
              ? text.loadedFeedNotice
                  .replace('{fileName}', feed.fileName)
                  .replace('{routes}', String(feed.routes.length))
                  .replace('{trips}', String(feed.trips))
                  .replace('{stops}', String(feed.stops))
                  .replace('{hubs}', String(feed.hubStops))
              : text.noFeedLoaded}
        </p>
        {shareMessage ? <p className="text-sm text-cyan-200">{shareMessage}</p> : null}
        {loadError ? <p className="text-sm text-rose-300">{loadError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.searchAndSelection}</h2>
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{text.gtfsAware}</span>
        </div>
        <label className="block text-sm text-slate-300" htmlFor="route-query">
          {text.searchRailLightBus}
        </label>
        <input
          aria-describedby="route-query-status"
          id="route-query"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
          placeholder={text.searchPlaceholder}
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
                className={`block w-full rounded-2xl border p-3 text-start transition ${
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
                  <span className="rounded-full border border-white/10 px-2 py-1">
                    {text.stopsCount.replace('{count}', String(route.stops.length))}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1">
                    {text.tripsCount.replace('{count}', String(route.tripCount))}
                  </span>
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
            <p className="text-sm text-slate-500">{feed ? text.noRoutesMatch : text.loadFeedToBrowse}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.poiNodes}</h2>
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{text.reactFlowBadge}</span>
        </div>
        <button
          className="w-full rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:border-amber-200 hover:bg-amber-400/20"
          type="button"
          onClick={onAddPoi}
        >
          {text.addPoi}
        </button>
        <label className="block text-sm text-slate-300" htmlFor="poi-label">
          {text.selectPoiLabel}
        </label>
        <input
          id="poi-label"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasSelectedPoi}
          placeholder={text.selectPoiLabel}
          type="text"
          value={poiLabel}
          onChange={(event) => onPoiLabelChange(event.target.value)}
        />
        <p className="text-sm text-slate-400">{text.poiDescription}</p>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.export}</h2>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{text.vectorSvg}</span>
        </div>
        <button
          className="w-full rounded-2xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isExporting}
          type="button"
          onClick={onExportSvg}
        >
          {isExporting ? text.exportingSvg : text.exportSvg}
        </button>
        <p className="text-sm text-slate-400">{text.exportDescription}</p>
        {exportError ? <p className="text-sm text-rose-300">{exportError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.shareMap}</h2>
          <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs text-violet-200">{text.urlBadge}</span>
        </div>
        <button
          className="w-full rounded-2xl border border-violet-300/40 bg-violet-400/10 px-4 py-3 text-sm font-medium text-violet-100 transition hover:border-violet-200 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSharing}
          type="button"
          onClick={onShareMap}
        >
          {text.shareMap}
        </button>
        <p className="text-sm text-slate-400">{text.shareDescription}</p>
        {shareError ? <p className="text-sm text-rose-300">{shareError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.mapLineStyle}</h2>
          <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-200">{text.globalSetting}</span>
        </div>
        <label className="block text-sm text-slate-300" htmlFor="map-line-style">
          {text.mapLineStyleDescription}
        </label>
        <select
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
          id="map-line-style"
          value={globalEdgeStyle}
          onChange={(event) => onGlobalEdgeStyleChange(event.target.value as EdgeRoutingStyle)}
        >
          {edgeStyleOptions.map((option) => (
            <option key={option} value={option}>
              {text.edgeStyleOptions[option]}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{text.edgeCustomization}</h2>
          <span className="rounded-full bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">{selectedEdge ? selectedEdgeLabel : text.selectEdgeBadge}</span>
        </div>
        {!selectedEdge ? (
          <p className="text-sm text-slate-400">{text.selectEdgeHint}</p>
        ) : (
          <>
            <p className="text-sm text-slate-300">{text.customizeEdgeLabel.replace('{edge}', selectedEdgeLabel)}</p>
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="selected-edge-color">
                {text.edgeColor}
              </label>
              <input
                id="selected-edge-color"
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-900 p-2"
                type="color"
                value={selectedEdgeColor}
                onChange={(event) => onEdgeColorChange(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {edgeColorPalette.map((color) => (
                  <button
                    key={color}
                    aria-label={text.edgeColorSwatch.replace('{color}', color)}
                    className={`h-8 w-8 rounded-full border transition ${selectedEdgeColor === color ? 'border-white' : 'border-white/20'}`}
                    style={{ backgroundColor: color }}
                    type="button"
                    onClick={() => onEdgeColorChange(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm text-slate-300" htmlFor="selected-edge-stroke-width">
                  {text.edgeStrokeWidth}
                </label>
                <span className="text-sm text-slate-400">
                  {text.edgeStrokeWidthValue.replace('{count}', String(selectedEdgeStrokeWidth))}
                </span>
              </div>
              <input
                id="selected-edge-stroke-width"
                className="w-full accent-cyan-300"
                max={15}
                min={1}
                step={1}
                type="range"
                value={selectedEdgeStrokeWidth}
                onChange={(event) => onEdgeStrokeWidthChange(Number(event.target.value))}
              />
            </div>
          </>
        )}
      </section>

      <fieldset className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-white">{text.language}</legend>
          <span className="text-xs text-slate-400">{text.rtlReady}</span>
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
          <h2 className="text-sm font-semibold text-white">{text.architecture}</h2>
          <span className="text-xs text-slate-400">{text.phase}</span>
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
        <h2 className="text-sm font-semibold text-white">{text.algorithms}</h2>
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
        <h2 className="text-sm font-semibold text-white">{text.installedPackages}</h2>
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
          <h2 className="text-sm font-semibold text-white">{text.operatorColorsHeading}</h2>
          <span className="text-xs text-slate-400">{text.liveRouteStyling}</span>
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
