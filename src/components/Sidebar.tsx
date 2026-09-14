import type { ReactElement } from 'react'

import type { ParsedFeed, ParsedRoute, TransitLanguage } from '../lib/gtfs'
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

type IconProps = {
  className?: string
}

function UploadIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function PinIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 21c3.5-4.1 5.25-7.1 5.25-9a5.25 5.25 0 1 0-10.5 0c0 1.9 1.75 4.9 5.25 9Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    </svg>
  )
}

function ExportIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4v10m0 0-3.5-3.5M12 14l3.5-3.5M5 20h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function ShareIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M15 8a3 3 0 1 0-2.82-4H12a3 3 0 0 0 .18 1.01L8.91 7.12a3 3 0 1 0 0 9.76l3.27 2.11A3 3 0 1 0 13 17.5l-3.27-2.11a3.02 3.02 0 0 0 0-6.78L13 6.5A3 3 0 0 0 15 8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function SettingsIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.06.06a1.9 1.9 0 1 1-2.69 2.69l-.06-.06a1 1 0 0 0-1.1-.2 1 1 0 0 0-.61.91V20a1.9 1.9 0 1 1-3.8 0v-.09a1 1 0 0 0-.65-.93 1 1 0 0 0-1.1.2l-.06.06a1.9 1.9 0 1 1-2.69-2.69l.06-.06a1 1 0 0 0 .2-1.1 1 1 0 0 0-.91-.61H4a1.9 1.9 0 1 1 0-3.8h.09a1 1 0 0 0 .93-.65 1 1 0 0 0-.2-1.1l-.06-.06a1.9 1.9 0 1 1 2.69-2.69l.06.06a1 1 0 0 0 1.1.2h.03a1 1 0 0 0 .58-.91V4a1.9 1.9 0 1 1 3.8 0v.09a1 1 0 0 0 .61.91 1 1 0 0 0 1.1-.2l.06-.06a1.9 1.9 0 1 1 2.69 2.69l-.06.06a1 1 0 0 0-.2 1.1v.03a1 1 0 0 0 .91.58H20a1.9 1.9 0 1 1 0 3.8h-.09a1 1 0 0 0-.91.61Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  )
}

function ActionButton({
  disabled = false,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: ReactElement
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-blue-200 disabled:bg-blue-300"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function SectionTitle({ icon, title }: { icon: ReactElement; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</span>
      <h2>{title}</h2>
    </div>
  )
}

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
  const hasSelectedPoi = poiLabel.length > 0
  const selectedEdgeColor =
    selectedEdge?.data?.customColor ??
    (typeof selectedEdge?.style?.stroke === 'string' ? selectedEdge.style.stroke : '#64748b')
  const selectedEdgeStrokeWidth = Number(selectedEdge?.data?.customStrokeWidth ?? selectedEdge?.style?.strokeWidth ?? 3)
  const fileUploadLabel = feed ? text.replaceGtfs : text.uploadGtfs

  return (
    <aside
      className={`flex h-full flex-col gap-4 overflow-y-auto rounded-[1.75rem] border border-blue-100 bg-white p-4 shadow-[0_18px_48px_rgba(37,99,235,0.08)] ${
        activeLanguage === 'English' ? 'xl:border-r' : 'xl:border-l'
      }`}
    >
      <header className="flex items-start justify-between gap-3 rounded-[1.5rem] border border-blue-100 bg-blue-50/60 px-4 py-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Schematic Map</h1>
          <p className="mt-1 text-sm text-blue-700">{text.resultLabel.replace('{count}', String(routes.length))}</p>
        </div>
        <fieldset className="min-w-0">
          <legend className="sr-only">{text.language}</legend>
          <p className="mb-2 text-xs font-medium text-slate-500">{text.language}</p>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
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
                  <span className="flex min-w-12 items-center justify-center rounded-xl px-2 py-2 text-xs font-medium text-slate-500 transition peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500 hover:text-blue-700">
                    {language}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </header>

      <section className="space-y-3 rounded-[1.5rem] border border-blue-100 bg-slate-50 p-4">
        <SectionTitle icon={<UploadIcon />} title={text.gtfsSource} />
        <label className="block text-sm font-medium text-slate-700" htmlFor="gtfs-file">
          {fileUploadLabel}
        </label>
        <input
          accept=".zip,application/zip"
          className="block w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          id="gtfs-file"
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-slate-600">
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

      <section className="space-y-3 rounded-[1.5rem] border border-blue-100 bg-slate-50 p-4">
        <SectionTitle icon={<SettingsIcon />} title={text.mapLineStyle} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="map-line-style">
              {text.mapLineStyleDescription}
            </label>
            <select
              className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
          </div>
          <ActionButton icon={<PinIcon />} label={text.addPoi} onClick={onAddPoi} />
          <ActionButton disabled={isExporting} icon={<ExportIcon />} label={isExporting ? text.exportingSvg : text.exportSvg} onClick={onExportSvg} />
          <div className="sm:col-span-2">
            <ActionButton disabled={isSharing} icon={<ShareIcon />} label={isSharing ? text.sharingMap : text.shareMap} onClick={onShareMap} />
          </div>
        </div>
        {exportError ? <p className="text-sm text-red-600">{exportError}</p> : null}
        {shareError ? <p className="text-sm text-red-600">{shareError}</p> : null}
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-blue-100 bg-slate-50 p-4">
        <SectionTitle icon={<UploadIcon className="h-4 w-4 rotate-90" />} title={text.searchAndSelection} />
        <label className="block text-sm font-medium text-slate-700" htmlFor="route-query">
          {text.searchRailLightBus}
        </label>
        <input
          aria-describedby="route-query-status"
          id="route-query"
          className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          placeholder={text.searchPlaceholder}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <p aria-live="polite" className="text-sm text-slate-500" id="route-query-status">
          {text.resultLabel.replace('{count}', String(routes.length))}
        </p>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId

            return (
              <button
                key={route.id}
                className={`block w-full rounded-2xl border px-3 py-3 text-start transition ${
                  isSelected
                    ? 'border-blue-200 bg-blue-50 shadow-sm'
                    : 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/60'
                }`}
                type="button"
                onClick={() => onRouteSelect(route.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{route.label}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{route.operator}</p>
                  </div>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-white shadow-sm" style={{ backgroundColor: route.operatorColor }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full border border-blue-100 bg-white px-2 py-1">{route.mode}</span>
                  <span className="rounded-full border border-blue-100 bg-white px-2 py-1">{text.stopsCount.replace('{count}', String(route.stops.length))}</span>
                  <span className="rounded-full border border-blue-100 bg-white px-2 py-1">{text.tripsCount.replace('{count}', String(route.tripCount))}</span>
                </div>
              </button>
            )
          })}
          {routes.length === 0 ? <p className="text-sm text-slate-500">{feed ? text.noRoutesMatch : text.loadFeedToBrowse}</p> : null}
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-blue-100 bg-slate-50 p-4">
        <SectionTitle icon={<PinIcon />} title={text.poiNodes} />
        <label className="block text-sm font-medium text-slate-700" htmlFor="poi-label">
          {text.selectPoiLabel}
        </label>
        <input
          id="poi-label"
          className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          disabled={!hasSelectedPoi}
          placeholder={text.selectPoiLabel}
          type="text"
          value={poiLabel}
          onChange={(event) => onPoiLabelChange(event.target.value)}
        />
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-blue-100 bg-slate-50 p-4">
        <SectionTitle icon={<SettingsIcon />} title={text.edgeCustomization} />
        {!selectedEdge ? (
          <p className="text-sm text-slate-500">{text.selectEdgeHint}</p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="selected-edge-color">
                {text.edgeColor}
              </label>
              <input
                id="selected-edge-color"
                className="h-11 w-full rounded-2xl border border-blue-100 bg-white p-2"
                type="color"
                value={selectedEdgeColor}
                onChange={(event) => onEdgeColorChange(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {edgeColorPalette.map((color) => (
                  <button
                    key={color}
                    aria-label={text.edgeColorSwatch.replace('{color}', color)}
                    className={`h-8 w-8 rounded-full border transition ${selectedEdgeColor === color ? 'border-blue-600 ring-2 ring-blue-200' : 'border-blue-100'}`}
                    style={{ backgroundColor: color }}
                    type="button"
                    onClick={() => onEdgeColorChange(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700" htmlFor="selected-edge-stroke-width">
                  {text.edgeStrokeWidth}
                </label>
                <span className="text-sm text-slate-500">{text.edgeStrokeWidthValue.replace('{count}', String(selectedEdgeStrokeWidth))}</span>
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
    </aside>
  )
}
