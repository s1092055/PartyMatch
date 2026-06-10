import { Sliders, ShieldCheck } from 'lucide-react'
import { getServiceById } from '../../../shared/services/serviceTypes'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'

const GROUP_AGE_LABEL = { any: '不限', new: '三個月內', established: '三個月至一年', veteran: '一年以上' }

export default function MatchSummaryPanel({ conditions }) {
  const { services, selectedPlans = {}, maxPrice, minRating, groupAge } = conditions
  const isEmpty = services.length === 0

  return (
    <div className="sticky top-[7rem] panel overflow-hidden border-success/30">

      <div className="flex items-center border-b border-success/20 bg-success-subtle px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-success-text">
          <Sliders size={18} />
          你的配對條件
        </div>
      </div>

      <div className="p-5 space-y-5">

        <div>
          <p className="text-xs text-slate-400 mb-2">選擇的服務</p>
          {isEmpty ? (
            <p className="text-sm text-slate-300 italic">尚未選擇</p>
          ) : (
            <div className="space-y-2">
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
                    <span className="text-xs text-ink-3 shrink-0">{plan && plan !== 'any' ? plan : '不限'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <Row label="預算上限" value={`NT$${maxPrice} 以下`} />
          <Row label="最低評分" value={`${minRating} 以上`} />
          <Row label="群組年資" value={GROUP_AGE_LABEL[groupAge] ?? '不限'} />
        </div>

<div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success-subtle px-4 py-3 text-xs font-bold leading-relaxed text-success-text">
          <ShieldCheck size={18} className="shrink-0" />
          設定條件後點擊「開始配對」，系統將篩選所有符合條件的群組，並依推薦分數排列，前三名會標示排名。
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  )
}
