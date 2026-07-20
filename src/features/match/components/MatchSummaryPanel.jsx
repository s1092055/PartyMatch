import { Sliders } from 'lucide-react'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import ServiceLogo from '../../../shared/ui/ServiceLogo'

const GROUP_AGE_LABEL = { any: '不限', new: '三個月內', established: '三個月至一年', veteran: '一年以上' }

export default function MatchSummaryPanel({ conditions, filtersChosen }) {
  const { services, selectedPlans = {}, maxPrice, minRating, groupAge } = conditions
  const isEmpty = services.length === 0

  return (
    <div className="flex h-full flex-col gap-5 rounded-xl bg-surface p-5">
      <div className="flex shrink-0 items-center gap-2">
        <Sliders size={15} className="text-ink-4" />
        <span className="text-sm font-semibold text-ink-2">你的選擇內容</span>
      </div>

      <div className="min-h-0 flex-1">
        <p className="mb-2 text-xs text-ink-4">選擇的服務</p>
        {isEmpty ? (
          <p className="text-sm italic text-ink-4">尚未選擇</p>
        ) : (
          <div className="h-[calc(100%-1.25rem)] space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {services.map(id => {
              const s = getServiceById(id)
              if (!s) return null
              const plan = selectedPlans[id]
              return (
                <div key={id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ServiceLogo serviceId={id} size={20} />
                    <span className="text-xs font-bold text-ink">{s.name}</span>
                  </div>
                  <span className="shrink-0 text-xs text-ink-3">{plan && plan !== 'any' ? plan : '不限'}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-4 border-t border-line-subtle pt-4">
        <Row label="每人申請費用" value={filtersChosen ? `NT$${maxPrice} 以下` : '尚未選擇'} muted={!filtersChosen} />
        <Row label="團主信用分數" value={filtersChosen ? `${minRating} 分以上` : '尚未選擇'} muted={!filtersChosen} />
        <Row label="群組年資" value={filtersChosen ? (GROUP_AGE_LABEL[groupAge] ?? '不限') : '尚未選擇'} muted={!filtersChosen} />
      </div>
    </div>
  )
}

function Row({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-4">{label}</span>
      <span className={muted ? 'text-xs italic text-ink-4' : 'text-xs font-semibold text-ink-2'}>{value}</span>
    </div>
  )
}
