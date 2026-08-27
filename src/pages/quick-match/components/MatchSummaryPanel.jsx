import { X, Sliders, ShieldCheck } from 'lucide-react'
import { getServiceById } from '../../../shared/services/serviceTypes'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'

const JOIN_LABEL          = { any: '不限', instant: '立即加入', approval: '審核加入' }
const BILLING_PERIOD_LABEL = { any: '不限', early: '月初（1–10 日）', mid: '月中（11–20 日）', late: '月底（21–31 日）' }
const GROUP_AGE_LABEL      = { any: '不限', new: '三個月內', established: '三個月至一年', veteran: '一年以上' }

export default function MatchSummaryPanel({ conditions, onClear }) {
  const { services, maxPrice, joinMode, minRating, billingPeriod, groupAge } = conditions
  const isEmpty = services.length === 0

  return (
    <div className="sticky top-[7rem] panel overflow-hidden border-success/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-success/20 bg-success-subtle px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-success-text">
          <Sliders size={18} />
          你的配對條件
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <X size={12} /> 清除
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Services */}
        <div>
          <p className="text-xs text-slate-400 mb-2">選擇的服務</p>
          {isEmpty ? (
            <p className="text-sm text-slate-300 italic">尚未選擇</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map(id => {
                const s = getServiceById(id)
                if (!s) return null
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-full border border-line bg-white px-2 py-1 text-xs font-bold text-ink"
                  >
                    <ServiceLogo serviceId={id} size={22} />
                    <span>{s.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <Row label="預算上限" value={`NT$${maxPrice} 以下`} />
          <Row label="加入方式" value={JOIN_LABEL[joinMode] ?? '不限'} />
          <Row label="最低評分" value={`${minRating.toFixed(1)} 以上`} />
          <Row label="扣款日"   value={BILLING_PERIOD_LABEL[billingPeriod] ?? '不限'} />
          <Row label="群組年資" value={GROUP_AGE_LABEL[groupAge] ?? '不限'} />
        </div>

        {/* Match count hint */}
        <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success-subtle px-4 py-3 text-xs font-bold leading-relaxed text-success-text">
          <ShieldCheck size={18} className="shrink-0" />
          設定條件後點擊「開始配對」，系統將推薦最多 3 個最適合的群組。
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
