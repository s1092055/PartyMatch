import { CheckCircle2, ListChecks } from 'lucide-react'
import { getServiceById } from '../../../../shared/services/serviceTypes'
import { getActiveUserProfile } from '../../../../shared/stores/userStore'
import ExploreGroupCard from '../../../explore/components/ExploreGroupCard'

function todayLabel() {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function Row({ label, value }) {
  return (
    <div className="flex items-center gap-4 py-2.5 lg:py-0 lg:flex-1 border-b border-slate-100 last:border-0">
      <span className="w-20 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="flex-1 text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}

export default function Step4Preview({ form }) {
  const service = getServiceById(form.serviceId)
  const activeUser = getActiveUserProfile()
  const today = todayLabel()

  const group = {
    id: '__preview__',
    serviceId: form.serviceId,
    serviceName: service?.fullName ?? service?.name ?? form.serviceId ?? '',
    planName: form.planName || '尚未選擇方案',
    pricePerSeat: form.pricePerSeat || 0,
    billingCycle: form.billingCycle,
    totalSeats: form.totalSeats,
    usedSeats: 1,
    openSeats: Math.max(form.totalSeats - 1, 0),
    tags: [service?.category].filter(Boolean),
    hostName: activeUser?.displayName ?? '使用者',
    hostAvatarColor: activeUser?.avatarColor ?? '#94A3B8',
    hostAvatarInitial: activeUser?.avatarInitial ?? 'U',
    isHostVerified: false,
    hostRating: null,
    status: 'recruiting',
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-0.5 text-base font-extrabold text-ink">確認並送出</h2>
        <p className="text-xs text-ink-3">請確認以下群組資訊都正確後再送出</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        {/* 左側：資訊摘要 */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-5 lg:flex-1 lg:flex lg:flex-col">
            <Row label="團主"     value={activeUser?.displayName ?? '使用者'} />
            <Row label="服務"     value={`${service?.fullName} · ${form.planName}`} />
            <Row label="每人費用" value={`NT$${form.billingCycle === 'yearly' ? form.pricePerSeat * 12 : form.pricePerSeat}`} />
            <Row label="計費週期" value={form.billingCycle === 'monthly' ? '月繳' : '年繳'} />
            <Row label="開放名額" value={`${form.totalSeats - 1} 人`} />
            <Row label="建立日期" value={today} />
          </div>

          {form.rules.some(r => r.trim()) && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={15} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">群組規則</span>
              </div>
              <ul className="space-y-1.5">
                {form.rules.filter(r => r.trim()).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* 右側：群組卡片預覽 */}
        <div className="w-full shrink-0 pointer-events-none lg:w-72 lg:h-full">
          <ExploreGroupCard group={group} hideActions />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        送出後群組將立即上架並開始招募，你可以在「群組管理」中審核申請與管理成員。
      </div>
    </div>
  )
}
