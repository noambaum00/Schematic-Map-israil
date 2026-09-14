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
  const horizontalAnchor = isRtlLanguage(activeLanguage) ? 'right-6' : 'left-6'

  if (!route) {
    return null
  }

  return (
    <aside
      aria-label={text.legendTitle}
      className={`pointer-events-none absolute bottom-6 ${horizontalAnchor} z-20 w-72 rounded-[1.5rem] border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur`}
      role="note"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{text.legendTitle}</p>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">{text.operatorLegend}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-3 w-10 rounded-full" style={{ backgroundColor: route.operatorColor }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{route.operator}</p>
              <p className="text-xs text-gray-500">{text.visibleRouteTrips.replace('{count}', String(route.tripCount))}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">{text.frequencyLegend}</p>
          <div className="mt-2 space-y-2">
            {frequencyTiers.map((tier) => {
              const style = getFrequencyStrokeStyle(tier)
              const isActive = route.frequencyTier === tier

              return (
                <div key={tier} className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <span
                      className="block w-12 border-t"
                      style={{
                        borderColor: route.operatorColor,
                        borderStyle: style.strokeDasharray ? 'dashed' : 'solid',
                        borderTopWidth: `${style.strokeWidth}px`,
                      }}
                    />
                    <span className="text-sm text-gray-700">{text.frequencyTierLabels[tier]}</span>
                  </div>
                  {isActive ? <span className="text-xs font-medium text-blue-700">{text.activeLegendBadge}</span> : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
