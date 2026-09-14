import type { DemoRoute } from '../data/transitPlan'
import { algorithmPlans, architectureSections, operatorColors, packageGroups } from '../data/transitPlan'

type SidebarProps = {
  activeLanguage: 'English' | 'עברית' | 'العربية'
  onLanguageChange: (language: 'English' | 'עברית' | 'العربية') => void
  query: string
  onQueryChange: (value: string) => void
  selectedRoutes: DemoRoute[]
}

const languages = ['English', 'עברית', 'العربية'] as const

export function Sidebar({ activeLanguage, onLanguageChange, query, onQueryChange, selectedRoutes }: SidebarProps) {
  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto border-b border-white/10 bg-slate-950/70 p-6 backdrop-blur xl:border-b-0 xl:border-r">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Transit scope</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Israel schematic map planner</h1>
          <p className="mt-2 text-sm text-slate-300">
            A planning shell for GTFS-driven rail, light rail, and bus diagrams with octilinear layout,
            transfer hubs, accessibility overlays, and shareable state.
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Search &amp; selection</h2>
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">GTFS-aware</span>
        </div>
        <label className="block text-sm text-slate-300" htmlFor="route-query">
          Search rail, light rail, or bus lines
        </label>
        <input
          id="route-query"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
          placeholder="e.g. A1, Red Line, 480"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <div className="flex flex-wrap gap-2 text-xs text-slate-200">
          {selectedRoutes.map((route) => (
            <span key={route.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {route.label}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Language</h2>
          <span className="text-xs text-slate-400">RTL/LTR ready</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((language) => {
            const isActive = language === activeLanguage
            return (
              <button
                key={language}
                aria-pressed={isActive}
                className={`rounded-2xl border px-3 py-2 text-sm transition ${
                  isActive
                    ? 'border-cyan-300 bg-cyan-300/15 text-white'
                    : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/30'
                }`}
                type="button"
                onClick={() => onLanguageChange(language)}
              >
                {language}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Architecture</h2>
          <span className="text-xs text-slate-400">Phase 1</span>
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
        <h2 className="text-sm font-semibold text-white">Required npm packages</h2>
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
          <span className="text-xs text-slate-400">Auto-assigned</span>
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
