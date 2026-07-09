import { CalendarDays, Eye, FileText, ListChecks, Package, ShieldCheck, User, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { toISODate } from '../../../../shared/utils/date'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { formatMinCreditScore } from '../../../../shared/utils/creditScore'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'


function Field({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <p className="text-sm text-slate-600">{value}</p>
    </div>
  )
}

export default function Step3Preview({ form, agreedToTerms, onAgreeChange, onShowPreview }) {
  const service = getServiceById(form.serviceId)
  const user = useAuthStore(s => s.user)
  const activeUser = user ? useAuthStore.getState().getProfile() : null
  const today = toISODate().replace(/-/g, '/')

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
          <ServiceLogo serviceId={form.serviceId} size={44} className="shrink-0 rounded-logo border-line-strong" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-ink">{service?.fullName ?? '尚未選擇服務'}</h2>
            <p className="truncate text-sm text-ink-3">{form.planName || '尚未選擇方案'}</p>
          </div>
          <button
            onClick={onShowPreview}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          >
            <Eye size={15} />
            查看預覽
          </button>
        </div>

        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:space-y-0">
          <Field icon={User}    label="團主"     value={activeUser?.displayName ?? '使用者'} />
          <Field icon={Package} label="服務／方案" value={`${service?.fullName ?? ''} · ${form.planName}`} />
          <Field icon={Wallet}  label="每人費用" value={
            <TokenAmount
              amount={form.billingCycle === 'yearly' ? form.pricePerSeat * 12 : form.pricePerSeat}
              cycle={form.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
            />
          } />
          <Field icon={Users}       label="開放名額" value={`${form.totalSeats - 1} 人`} />
          <Field icon={ShieldCheck} label="信用分數" value={formatMinCreditScore(form.minCreditScore)} />
          <Field icon={CalendarDays} label="建立日期" value={today} />
          <Field icon={FileText} label="帳號需求" value={form.requirements.trim() || '無'} />

          {form.rules.some(r => r.trim()) && (
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={15} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">群組規則</span>
              </div>
              <ul className="space-y-1.5">
                {form.rules.filter(r => r.trim()).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-slate-400 shrink-0">{i + 1}.</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
