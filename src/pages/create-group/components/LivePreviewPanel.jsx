import { Star, Users, Calendar, CheckCircle2, Eye } from 'lucide-react'
import { getServiceById } from '../../../shared/services/serviceTypes'
import { getActiveUserProfile } from '../../../shared/stores/userStore'
import Badge from '../../../shared/components/ui/Badge'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'

export default function LivePreviewPanel({ form }) {
  const service = getServiceById(form.serviceId)
  const activeUser = getActiveUserProfile()

  const hasBasic   = !!form.serviceId
  const hasPlan    = hasBasic && !!form.planName
  const hasDetails = hasPlan

  return (
    <div className="sticky top-[7rem] space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-1">
        <Eye size={14} className="text-blue-500" />
        即時預覽
      </div>

      {/* Preview card */}
      <div className="panel border-success/30 bg-gradient-to-br from-emerald-50 to-white p-5">
        {!hasBasic ? (
          <div className="py-10 text-center text-sm text-slate-300">
            請先選擇服務
          </div>
        ) : (
          <div className="space-y-3">
            {/* Service row */}
            <div className="flex items-center gap-3">
              <ServiceLogo serviceId={form.serviceId} size={58} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 text-sm truncate">
                    {service?.fullName ?? '服務名稱'}
                  </span>
                  <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {form.planName || '尚未選擇方案'}
                </p>
              </div>
              <Badge variant="recruiting" />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-brand">
                NT${form.pricePerSeat || '—'}
              </span>
              <span className="text-xs text-slate-400">/ 月 · 每人</span>
            </div>

            {/* Host */}
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ backgroundColor: activeUser?.avatarColor ?? '#3B82F6' }}
              >
                {activeUser?.avatarInitial ?? 'U'}
              </div>
              <span className="text-xs text-slate-600">{activeUser?.displayName ?? '使用者'}</span>
              <div className="flex items-center gap-0.5 ml-auto">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-500">新團主</span>
              </div>
            </div>

            {/* Seats */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users size={12} />
                  <span>1/{form.totalSeats} 人</span>
                </div>
                <span className="text-xs text-slate-400">
                  剩餘 {form.totalSeats - 1} 名額
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: `${(1 / form.totalSeats) * 100}%` }}
                />
              </div>
            </div>

            {/* Billing & join mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={11} />
                <span>
                  {form.nextBillingDay
                    ? `每月 ${form.nextBillingDay} 日扣款`
                    : '扣款日未設定'}
                </span>
              </div>
              <Badge variant={form.joinMode} />
            </div>
          </div>
        )}
      </div>

      {/* Completion hint */}
      <div className="text-xs text-slate-400 text-center">
        {!hasBasic  && '選擇服務後預覽將自動更新'}
        {hasBasic && !hasPlan    && '繼續填寫方案資料…'}
        {hasPlan  && !hasDetails && '繼續填寫群組設定…'}
        {hasDetails && '看起來不錯！'}
      </div>
    </div>
  )
}
