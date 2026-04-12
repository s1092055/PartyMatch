import { CalendarDays, FileText, ListChecks, Package, ShieldCheck, User, Users, Wallet } from 'lucide-react'
import { getServiceById } from '../../../../common/utils/serviceUtils'
import { toISODate } from '../../../../common/utils/date'
import { useAuthStore } from '../../../../common/stores/useAuthStore'
import CreditScoreValue from '../../../../components/ui/CreditScoreValue'
import TokenAmount from '../../../../components/ui/TokenAmount'
import ServiceLogo from '../../../../components/ui/ServiceLogo'
import LivePreviewPanel from '../LivePreviewPanel'
import { calcDisplayPrice } from '../../../../common/utils/pricingUtils'


function InfoField({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} strokeWidth={1.5} className="text-ink-4" />
        <span className="text-sm font-semibold text-ink-2">{label}</span>
      </div>
      <p className="pl-6 text-sm text-ink-3">{value}</p>
    </div>
  )
}

export default function Step4Preview({ form }) {
  const service = getServiceById(form.serviceId)
  const user = useAuthStore(s => s.user)
  const activeUser = user ? useAuthStore.getState().getProfile() : null
  const today = toISODate().replace(/-/g, '/')

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row lg:items-start lg:gap-6">
      <div className="flex h-full min-h-0 flex-1 flex-col bg-surface border border-line rounded-2xl p-4">
        <div className="flex shrink-0 items-center gap-3 mb-4 pb-4 border-b border-line-subtle">
          <ServiceLogo serviceId={form.serviceId} size={44} className="shrink-0 border-line-strong" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-ink">{service?.fullName ?? '尚未選擇服務'}</h2>
            <p className="truncate text-sm text-ink-3">{form.planName || '尚未選擇方案'}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4 lg:space-y-0">
            <InfoField icon={User}    label="團主"     value={activeUser?.displayName ?? '使用者'} />
            <InfoField icon={Package} label="服務／方案" value={`${service?.fullName ?? ''} · ${form.planName}`} />
            <InfoField icon={Wallet}  label="每位價格" value={
              <TokenAmount
                amount={calcDisplayPrice(form.pricePerSeat, form.billingCycle)}
                cycle={form.billingCycle}
              />
            } />
            <InfoField icon={Users}       label="開放名額" value={`${form.recruitHeadcount - 1} 人`} />
            <InfoField icon={ShieldCheck} label="信用分數" value={<CreditScoreValue score={form.minCreditScore} />} />
            <InfoField icon={CalendarDays} label="建立日期" value={today} />
            <div className="lg:col-span-2">
              <InfoField icon={FileText} label="帳號需求" value={form.requirements.trim() || '無'} />
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks strokeWidth={1.5} size={15} className="text-ink-4" />
                <span className="text-sm font-semibold text-ink-2">群組規則</span>
              </div>
              {form.rules.some(r => r.trim()) ? (
                <ul className="space-y-1.5 pl-6">
                  {form.rules.filter(r => r.trim()).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-3">
                      <span className="text-ink-4 shrink-0">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pl-6 text-sm text-ink-3">無</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 hidden shrink-0 lg:mt-0 lg:block lg:w-72">
        <LivePreviewPanel form={form} />
      </div>
    </div>
  )
}
