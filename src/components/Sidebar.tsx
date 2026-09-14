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
const edgeColorPalette = ['#2563EB', '#0033A0', '#E31837', '#007A33', '#FF7900', '#00AEEF', '#F59E0B', '#A855F7'] as const
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
    (typeof selectedEdge?.style?.stroke === 'string' ? selectedEdge.style.stroke : '#64748b')
  const selectedEdgeStrokeWidth = Number(selectedEdge?.data?.customStrokeWidth ?? selectedEdge?.style?.strokeWidth ?? 3)
  const selectedEdgeLabel = selectedEdge?.data?.isManual ? text.manualEdge : text.transitEdge
  const fileUploadLabel = feed ? text.replaceGtfs : text.uploadGtfs

  return (
    <aside
      className={`flex h-full flex-col gap-6 overflow-y-auto rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm ${
        activeLanguage === 'English' ? 'xl:border-r' : 'xl:border-l'
      }`}
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">{text.phase}</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Israel schematic map planner</h1>
          <p className="mt-2 text-sm text-gray-600">{text.canvasRegionDescription}</p>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.gtfsSource}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{text.realDataOnly}</span>
        </div>
        <p className="text-sm text-gray-600">{text.bundledFeedDescription}</p>
        <label className="block text-sm font-medium text-gray-700" htmlFor="gtfs-file">
          {fileUploadLabel}
        </label>
        <input
          accept=".zip,application/zip"
          className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          id="gtfs-file"
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-gray-600">
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
        {shareMessage ? <p className="text-sm text-blue-700">{shareMessage}</p> : null}
        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.searchAndSelection}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{text.gtfsAware}</span>
        </div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="route-query">
          {text.searchRailLightBus}
        </label>
        <input
          aria-describedby="route-query-status"
          id="route-query"
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          placeholder={text.searchPlaceholder}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <p aria-live="polite" className="text-sm text-gray-500" id="route-query-status">
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
                    ? 'border-blue-200 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/60'
                }`}
                type="button"
                onClick={() => onRouteSelect(route.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{route.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{route.operator}</p>
                  </div>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-gray-200" style={{ backgroundColor: route.operatorColor }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1">{route.mode}</span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1">
                    {text.stopsCount.replace('{count}', String(route.stops.length))}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1">
                    {text.tripsCount.replace('{count}', String(route.tripCount))}
                  </span>
                  {route.trainTemplateLabel ? (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">{route.trainTemplateLabel}</span>
                  ) : null}
                </div>
              </button>
            )
          })}
          {routes.length === 0 ? <p className="text-sm text-gray-500">{feed ? text.noRoutesMatch : text.loadFeedToBrowse}</p> : null}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.poiNodes}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{text.reactFlowBadge}</span>
        </div>
        <button
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="button"
          onClick={onAddPoi}
        >
          {text.addPoi}
        </button>
        <label className="block text-sm font-medium text-gray-700" htmlFor="poi-label">
          {text.selectPoiLabel}
        </label>
        <input
          id="poi-label"
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          disabled={!hasSelectedPoi}
          placeholder={text.selectPoiLabel}
          type="text"
          value={poiLabel}
          onChange={(event) => onPoiLabelChange(event.target.value)}
        />
        <p className="text-sm text-gray-600">{text.poiDescription}</p>
      </section>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.export}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{text.vectorSvg}</span>
        </div>
        <button
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={isExporting}
          type="button"
          onClick={onExportSvg}
        >
          {isExporting ? text.exportingSvg : text.exportSvg}
        </button>
        <p className="text-sm text-gray-600">{text.exportDescription}</p>
        {exportError ? <p className="text-sm text-red-600">{exportError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.shareMap}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{text.urlBadge}</span>
        </div>
        <button
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={isSharing}
          type="button"
          onClick={onShareMap}
        >
          {text.shareMap}
        </button>
        <p className="text-sm text-gray-600">{text.shareDescription}</p>
        {shareError ? <p className="text-sm text-red-600">{shareError}</p> : null}
      </section>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.mapLineStyle}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{text.globalSetting}</span>
        </div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="map-line-style">
          {text.mapLineStyleDescription}
        </label>
        <select
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.edgeCustomization}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{selectedEdge ? selectedEdgeLabel : text.selectEdgeBadge}</span>
        </div>
        {!selectedEdge ? (
          <p className="text-sm text-gray-600">{text.selectEdgeHint}</p>
        ) : (
          <>
            <p className="text-sm text-gray-700">{text.customizeEdgeLabel.replace('{edge}', selectedEdgeLabel)}</p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="selected-edge-color">
                {text.edgeColor}
              </label>
              <input
                id="selected-edge-color"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white p-2"
                type="color"
                value={selectedEdgeColor}
                onChange={(event) => onEdgeColorChange(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {edgeColorPalette.map((color) => (
                  <button
                    key={color}
                    aria-label={text.edgeColorSwatch.replace('{color}', color)}
                    className={`h-8 w-8 rounded-full border transition ${selectedEdgeColor === color ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'}`}
                    style={{ backgroundColor: color }}
                    type="button"
                    onClick={() => onEdgeColorChange(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700" htmlFor="selected-edge-stroke-width">
                  {text.edgeStrokeWidth}
                </label>
                <span className="text-sm text-gray-500">{text.edgeStrokeWidthValue.replace('{count}', String(selectedEdgeStrokeWidth))}</span>
              </div>
              <input
                id="selected-edge-stroke-width"
                className="w-full accent-blue-600"
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

      <fieldset className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-gray-900">{text.language}</legend>
          <span className="text-xs text-gray-500">{text.rtlReady}</span>
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
                <span className="block rounded-2xl border border-gray-200 bg-white px-3 py-2 text-center text-sm text-gray-600 transition peer-checked:border-blue-200 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500 hover:border-blue-200 hover:text-blue-700">
                  {language}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <section className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{text.architecture}</h2>
          <span className="text-xs text-gray-500">{text.phase}</span>
        </div>
        {architectureSections.map((section) => (
          <article key={section.title} className="space-y-2">
            <h3 className="text-sm font-medium text-blue-700">{section.title}</h3>
            <p className="text-sm text-gray-700">{section.summary}</p>
            <ul className="space-y-1 text-sm text-gray-600">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">{text.algorithms}</h2>
        {algorithmPlans.map((plan) => (
          <article key={plan.title} className="space-y-2 rounded-2xl border border-gray-200 bg-white p-3">
            <div>
              <h3 className="text-sm font-medium text-blue-700">{plan.title}</h3>
              <p className="text-sm text-gray-700">{plan.goal}</p>
            </div>
            <ol className="space-y-1 text-sm text-gray-600">
              {plan.steps.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-medium text-blue-600">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">{text.installedPackages}</h2>
        {packageGroups.map((group) => (
          <article key={group.category} className="space-y-2">
            <h3 className="text-sm font-medium text-blue-700">{group.category}</h3>
            <div className="flex flex-wrap gap-2">
              {group.packages.map((pkg) => (
                <code key={pkg} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                  {pkg}
                </code>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{text.operatorColorsHeading}</h2>
          <span className="text-xs text-gray-500">{text.liveRouteStyling}</span>
        </div>
        <div className="space-y-3">
          {operatorColors.map((operator) => (
            <div key={operator.name} className="flex items-start gap-3">
              <span className="mt-1 h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: operator.hex }} />
              <div>
                <p className="text-sm font-medium text-gray-900">{operator.name}</p>
                <p className="text-sm text-gray-600">{operator.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
