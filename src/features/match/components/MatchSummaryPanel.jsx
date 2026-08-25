import { Sliders, X } from 'lucide-react'
import { getServiceById } from '../../../common/utils/serviceUtils'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import PriceRangeAmount from '../../../components/ui/PriceRangeAmount'
import { formatPriceRangeLabel } from '../utils/priceRangeLabel'

const GROUP_AGE_LABEL = { any: '不限', new: '三個月內', established: '三個月至一年', veteran: '一年以上' }

export default function MatchSummaryPanel({ conditions, filtersChosen, onRemoveService }) {
  const { services, selectedPlans = {}, minPrice, maxPrice, minRating, groupAge } = conditions
  const priceLabel = formatPriceRangeLabel(minPrice, maxPrice)
  const isEmpty = services.length === 0

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl bg-surface p-5">
      <div className="flex shrink-0 items-center gap-2">
        <Sliders strokeWidth={1.5} size={15} className="text-ink-4" />
        <span className="text-sm font-semibold text-ink-2">你選擇的內容</span>
      </div>

      <div className="min-h-0 flex-1">
        <p className="mb-2 text-xs text-ink-4">選擇的服務</p>
        {isEmpty ? (
          <p className="text-sm text-ink-4">尚未選擇</p>
        ) : (
          <div className="h-[calc(100%-1.25rem)] space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {services.map(id => {
              const s = getServiceById(id)
              if (!s) return null
              const plan = selectedPlans[id]
              return (
                <div key={id} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ServiceLogo serviceId={id} size={20} className="shrink-0" />
                    <span className="truncate text-xs font-bold text-ink">{s.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-xs text-ink-3">{plan && plan !== 'any' ? plan : '不限'}</span>
                    {onRemoveService && (
                      <button
                        onClick={() => onRemoveService(id)}
                        aria-label={`移除${s.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-raised hover:text-ink"
                      >
                        <X size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-4 border-t border-line-subtle pt-4">
        <Row
          label="申請費用/人"
          value={!filtersChosen ? '尚未選擇' : <PriceRangeAmount label={priceLabel} badgeClassName="!h-3.5 !w-3.5" />}
          muted={!filtersChosen || priceLabel == null}
        />
        <Row label="團主信用分數" value={!filtersChosen ? '尚未選擇' : minRating > 0 ? `${minRating} 分以上` : '不限'} muted={!filtersChosen || minRating === 0} />
        <Row label="群組年資" value={filtersChosen ? (GROUP_AGE_LABEL[groupAge] ?? '不限') : '尚未選擇'} muted={!filtersChosen || groupAge === 'any'} />
      </div>
    </div>
  )
}

function Row({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-4">{label}</span>
      <span className={muted ? 'text-xs text-ink-4' : 'text-xs font-semibold text-ink-2'}>{value}</span>
    </div>
  )
}
