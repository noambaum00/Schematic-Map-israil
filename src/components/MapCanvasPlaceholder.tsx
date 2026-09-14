import { useMemo } from 'react'

import type { ParsedRoute, TransitLanguage } from '../lib/gtfs'

type MapCanvasPlaceholderProps = {
  activeLanguage: TransitLanguage
  isLoading: boolean
  route: ParsedRoute | null
}

type Point = {
  x: number
  y: number
}

const emptyStates: Record<TransitLanguage, { title: string; description: string }> = {
  English: {
    title: 'Upload a GTFS zip to start',
    description: 'The schematic preview switches from mock content to live GTFS routes as soon as you load an MOT archive.',
  },
  'עברית': {
    title: 'העלו קובץ GTFS כדי להתחיל',
    description: 'התצוגה הסכמטית תעבור לנתוני GTFS אמיתיים מיד לאחר טעינת ארכיון MOT.',
  },
  'العربية': {
    title: 'حمّل ملف GTFS للبدء',
    description: 'ستنتقل المعاينة التخطيطية إلى بيانات GTFS الحقيقية فور تحميل أرشيف MOT.',
  },
}

function getStopName(route: ParsedRoute, index: number) {
  const stop = route.stops[index]
  return stop.code ? `${stop.name} · ${stop.code}` : stop.name
}

function buildPoints(stopCount: number): Point[] {
  const perRow = 6
  const startX = 120
  const startY = 110
  const colWidth = 130
  const rowHeight = 120

  return Array.from({ length: stopCount }, (_, index) => {
    const row = Math.floor(index / perRow)
    const col = index % perRow
    const isForward = row % 2 === 0
    const resolvedCol = isForward ? col : perRow - 1 - col

    return {
      x: startX + resolvedCol * colWidth,
      y: startY + row * rowHeight,
    }
  })
}

function getSegmentLabel(route: ParsedRoute) {
  if (route.mode !== 'rail' || !route.trainTemplateLabel) {
    return null
  }

  return route.trainTemplateLabel
}

export function MapCanvasPlaceholder({ activeLanguage, isLoading, route }: MapCanvasPlaceholderProps) {
  const points = useMemo(() => (route ? buildPoints(route.stops.length) : []), [route])
  const segmentLabel = route ? getSegmentLabel(route) : null

  return (
    <section className="relative flex min-h-[700px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Live GTFS canvas</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Interactive schematic workspace</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-200">
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5">Real GTFS feed</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Rail series labels</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">GitHub Pages ready</span>
        </div>
      </div>

      {!route ? (
        <div className="relative z-10 flex flex-1 items-center justify-center p-6">
          <div className="max-w-xl rounded-[2rem] border border-dashed border-cyan-400/30 bg-slate-950/50 p-10 text-center">
            <p className="text-2xl font-semibold text-white">
              {isLoading ? 'Parsing GTFS archive…' : emptyStates[activeLanguage].title}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              {isLoading ? 'Reading routes, trips, stop_times, and stops from the uploaded archive.' : emptyStates[activeLanguage].description}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 grid flex-1 gap-6 p-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6">
            <div className="flex h-full flex-col gap-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Representative GTFS trip</p>
                  <h3 className="text-xl font-semibold text-white">{route.label}</h3>
                  <p className="mt-1 max-w-xl text-sm text-slate-300">{route.description || route.representativeHeadsign || 'Live route schematic preview'}</p>
                </div>
                <div className="space-y-2 text-sm text-slate-200">
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                    Operator: <span className="font-medium text-white">{route.operator}</span>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                    Stops: <span className="font-medium text-white">{route.stops.length}</span>
                  </div>
                  {route.trainTemplateLabel ? (
                    <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-cyan-100">
                      Train series: <span className="font-semibold">{route.trainTemplateLabel}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="overflow-auto rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                <svg
                  aria-label={`Schematic route preview for ${route.label}`}
                  className="min-h-[420px] min-w-[920px]"
                  role="img"
                  viewBox="0 0 920 520"
                >
                  {points.slice(1).map((point, index) => {
                    const previous = points[index]
                    const midX = (previous.x + point.x) / 2
                    const midY = (previous.y + point.y) / 2

                    return (
                      <g key={`${route.id}-segment-${route.stops[index]?.id ?? index}`}>
                        <line
                          stroke={route.operatorColor}
                          strokeLinecap="round"
                          strokeWidth="10"
                          x1={previous.x}
                          x2={point.x}
                          y1={previous.y}
                          y2={point.y}
                        />
                        {segmentLabel ? (
                          <>
                            <rect
                              fill="rgba(2, 6, 23, 0.9)"
                              height="28"
                              rx="14"
                              width={Math.max(80, segmentLabel.length * 12)}
                              x={midX - Math.max(40, (segmentLabel.length * 12) / 2)}
                              y={midY - 38}
                            />
                            <text
                              fill="#E2E8F0"
                              fontSize="14"
                              fontWeight="600"
                              textAnchor="middle"
                              x={midX}
                              y={midY - 20}
                            >
                              {segmentLabel}
                            </text>
                          </>
                        ) : null}
                      </g>
                    )
                  })}

                  {points.map((point, index) => {
                    const stop = route.stops[index]

                    return (
                      <g key={stop.id}>
                        <circle cx={point.x} cy={point.y} fill="#0F172A" r="17" stroke="#E2E8F0" strokeWidth="4" />
                        <circle cx={point.x} cy={point.y} fill={route.operatorColor} r="8" />
                        <text fill="#F8FAFC" fontSize="13" fontWeight="500" x={point.x} y={point.y + 34}>
                          {getStopName(route, index)}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Route metadata</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>• Mode: {route.mode}</li>
                <li>• Trip ID: {route.representativeTripId}</li>
                <li>• Headsign: {route.representativeHeadsign || 'Not provided'}</li>
                <li>• Wheelchair-ready stops: {route.stops.filter((stop) => stop.wheelchairBoarding === '1').length}</li>
              </ul>
            </article>

            <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Train number template</p>
              <p className="mt-4 text-sm text-slate-300">
                {route.mode === 'rail'
                  ? route.trainTemplateLabel || 'No train number template was found in route_short_name or trip_short_name.'
                  : 'Train-series labels are only rendered for Israel Railways routes.'}
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Deployment</p>
              <p className="mt-4 text-sm text-slate-300">
                This build is configured for GitHub Pages with the repository base path set to <code>/Schematic-Map-israil/</code>.
              </p>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
