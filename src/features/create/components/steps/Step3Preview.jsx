import { CheckCircle2, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { toISODate } from '../../../../shared/utils/date'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import ExploreGroupCard from '../../../explore/components/ExploreGroupCard'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import { buildPreviewGroupId } from '../../utils/previewGroupId'


function Row({ label, value }) {
  return (
    <div className="flex items-center gap-4 py-2.5 lg:py-0 lg:flex-1 border-b border-slate-100 last:border-0">
      <span className="w-20 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="flex-1 text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}

export default function Step3Preview({ form, agreedToTerms, onAgreeChange }) {
  const service = getServiceById(form.serviceId)
  const user = useAuthStore(s => s.user)
  const activeUser = user ? useAuthStore.getState().getProfile() : null
  const today = toISODate().replace(/-/g, '/')

  const group = {
    id: buildPreviewGroupId(form),
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
    hostRating: null,
    status: 'recruiting',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        {/* 左側：資訊摘要 */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-5 lg:flex-1 lg:flex lg:flex-col">
            <Row label="團主"     value={activeUser?.displayName ?? '使用者'} />
            <Row label="服務"     value={service?.fullName} />
            <Row label="方案"     value={form.planName} />
            <Row label="每人費用" value={
              <TokenAmount
                amount={form.billingCycle === 'yearly' ? form.pricePerSeat * 12 : form.pricePerSeat}
                cycle={form.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
              />
            } />
            <Row label="開放名額" value={`${form.totalSeats - 1} 人`} />
            <Row label="帳號需求" value={form.requirements.trim() || '無'} />
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

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
        <input
          type="checkbox"
          checked={agreedToTerms ?? false}
          onChange={e => onAgreeChange?.(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        />
        <span className="text-xs leading-relaxed text-ink-2">
          我已閱讀並同意 PartyMatch 的{' '}
          <Link to="/terms" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">服務條款</Link>
          {' '}與{' '}
          <Link to="/privacy" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">隱私政策</Link>
          ，並確認以上群組資訊正確無誤。
        </span>
      </label>
    </div>
  )
}
