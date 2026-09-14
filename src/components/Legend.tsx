import { getFrequencyStrokeStyle, type FrequencyTier } from '../data/transitPlan'
import type { ParsedRoute, TransitLanguage } from '../lib/gtfs'
import { interfaceText, isRtlLanguage } from '../lib/uiText'

type LegendProps = {
  activeLanguage: TransitLanguage
  route: ParsedRoute | null
}

const frequencyTiers: FrequencyTier[] = ['HIGH_FREQUENCY', 'MEDIUM_FREQUENCY', 'LOW_FREQUENCY']

export function Legend({ activeLanguage, route }: LegendProps) {
  const text = interfaceText[activeLanguage]
  const horizontalAnchor = isRtlLanguage(activeLanguage) ? 'right-5' : 'left-5'

  if (!route) {
    return null
  }

  return (
    <aside
      aria-label={text.legendTitle}
      className={`pointer-events-none absolute bottom-5 ${horizontalAnchor} z-20 w-64 rounded-[1.25rem] border border-blue-100 bg-white/95 p-3 shadow-sm backdrop-blur`}
      role="note"
    >
      <div className="flex items-center gap-3">
        <span className="h-3.5 w-10 rounded-full" style={{ backgroundColor: route.operatorColor }} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{route.operator}</p>
          <p className="text-xs text-slate-500">{text.visibleRouteTrips.replace('{count}', String(route.tripCount))}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {frequencyTiers.map((tier) => {
          const style = getFrequencyStrokeStyle(tier)
          const isActive = route.frequencyTier === tier

          return (
            <div key={tier} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${isActive ? 'bg-blue-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <span
                  className="block w-10 border-t"
                  style={{
                    borderColor: route.operatorColor,
                    borderStyle: style.strokeDasharray ? 'dashed' : 'solid',
                    borderTopWidth: `${style.strokeWidth}px`,
                  }}
                />
                <span className="text-sm text-slate-700">{text.frequencyTierLabels[tier]}</span>
              </div>
              {isActive ? <span className="text-xs font-medium text-blue-700">{text.activeLegendBadge}</span> : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
