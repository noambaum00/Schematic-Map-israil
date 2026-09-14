import type { DemoRoute } from '../data/transitPlan'

type MapCanvasPlaceholderProps = {
  activeLanguage: 'English' | 'עברית' | 'العربية'
  selectedRoutes: DemoRoute[]
}

const languageLabels: Record<MapCanvasPlaceholderProps['activeLanguage'], string> = {
  English: 'Tel Aviv Savidor Central',
  'עברית': 'תל אביב סבידור מרכז',
  'العربية': 'تل أبيب سافيدور سنترال',
}

export function MapCanvasPlaceholder({ activeLanguage, selectedRoutes }: MapCanvasPlaceholderProps) {
  return (
    <section className="relative flex min-h-[700px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Map canvas placeholder</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Interactive schematic workspace</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-200">
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5">Octilinear drag snap</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Pathfinding</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">SVG / PDF export</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Permalink state</span>
        </div>
      </div>

      <div className="relative z-10 grid flex-1 gap-6 p-6 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Selected interchange preview</p>
                  <h3 className="text-xl font-semibold text-white">{languageLabels[activeLanguage]}</h3>
                  <p className="mt-1 max-w-xl text-sm text-slate-300">
                    Transfer hub combining heavy rail platforms, light rail stops, and nearby bus terminals
                    into one schematic node while preserving child-stop metadata.
                  </p>
                </div>
                <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  ♿ Accessibility layer available
                </div>
              </div>

              <div className="relative mx-auto mt-8 flex max-w-3xl items-center justify-center">
                <div className="absolute h-72 w-72 rounded-full border border-dashed border-cyan-400/30" />
                <div className="absolute h-[26rem] w-[26rem] rotate-45 rounded-full border border-dashed border-fuchsia-400/20" />
                <div className="relative grid gap-8">
                  <div className="flex items-center justify-center gap-6">
                    <div className="h-3 w-28 rounded-full bg-[#2457C5] shadow-[0_0_22px_rgba(36,87,197,0.45)]" />
                    <div className="rounded-full border border-white/15 bg-slate-800 px-4 py-3 text-center text-sm font-medium text-white">
                      Transfer hub
                    </div>
                    <div className="h-3 w-24 -rotate-45 rounded-full bg-[#D63B3B] shadow-[0_0_22px_rgba(214,59,59,0.35)]" />
                  </div>
                  <div className="flex items-center justify-center gap-8">
                    <div className="h-3 w-24 rotate-45 rounded-full border-2 border-dashed border-[#1B8E5A] bg-transparent" />
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        Night lines theme
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        Weekend service filter
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectedRoutes.map((route) => (
                <article key={route.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{route.mode}</p>
                  <h4 className="mt-2 text-base font-semibold text-white">{route.label}</h4>
                  <p className="mt-1 text-sm text-slate-300">{route.operator}</p>
                  <dl className="mt-3 space-y-2 text-sm text-slate-400">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Frequency</dt>
                      <dd>{route.frequency}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Service</dt>
                      <dd className="text-right">{route.serviceWindow}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Canvas layers</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Base transit graph from GTFS routes, stops, shapes, and frequencies</li>
              <li>• Hub overlays for clustered transfers and manual POIs</li>
              <li>• Accessibility highlighting from wheelchair boarding metadata</li>
              <li>• Active shortest-path highlight with transfer cost annotations</li>
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Editing model</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Node drags snap back to a 45° grid and preserve edge order</li>
              <li>• Edge click opens color, stroke, and label customization affordances</li>
              <li>• Map state serializes into URL params for shareable permalinks</li>
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Next implementation slices</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li>1. Replace placeholder scene with React Flow nodes and edges</li>
              <li>2. Stream parsed GTFS feed data into the canvas store</li>
              <li>3. Add export, persistence, and route-finding interactions</li>
            </ol>
          </article>
        </div>
      </div>
    </section>
  )
}
