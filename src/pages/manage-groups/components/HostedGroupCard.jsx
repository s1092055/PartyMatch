import {
  Calendar,
  ChevronRight,
  DollarSign,
  History,
  Monitor,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { CONFIRMED_STATUSES } from '../../../shared/constants/paymentStatus'
import { getGroupDisplayStatus, GROUP_ACTION_MAP } from '../config/groupActionMap'
import { formatMonthDay } from '../../../shared/utils/date'

const ACTION_ICONS = {
  prepareRenewal: RefreshCw,
  viewHistory:    History,
}

const STATUS_BADGE_CLASS = {
  active:               'bg-success-subtle text-success-text',
  active_renewal:       'bg-success-subtle text-success-text',
  recruiting:           'bg-success-subtle text-success-text',
  pending_confirmation: 'bg-warning-subtle text-warning-text',
  pending_activation:   'bg-warning-subtle text-warning-text',
  full:                 'bg-brand-subtle text-brand',
  paused:               'bg-slate-100 text-slate-500',
  cancelled:            'bg-danger-subtle text-danger-text',
  ended:                'bg-slate-100 text-slate-400',
}

function buildFeatureChips(group) {
  const tags = group.tags ?? []
  const source = `${group.planName} ${tags.join(' ')}`
  const labels = []

  if (/4K|HDR/i.test(source) || (group.serviceId === 'disney' && group.planName.includes('高級'))) {
    labels.push({ label: '4K 畫質', Icon: Monitor })
  }

  if (/家庭|Family|共享/.test(source)) {
    labels.push({ label: '家庭方案', Icon: Users })
  }

  labels.push({
    label: group.billingCycle === 'yearly' ? '年度續訂' : '自動續訂',
    Icon: RotateCw,
  })

  return labels.slice(0, 3)
}


function getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget }) {
  if (['paused', 'cancelled', 'ended'].includes(group.status)) return '已停止'
  if (hasMarkedPaid) return '待確認'
  if (['pending_confirmation', 'pending_activation', 'full'].includes(group.status)) return '待處理'
  if (paymentTarget > 0 && paidCount < paymentTarget && group.status === 'active') return '追蹤中'
  return '正常'
}

function StatusRow({ Icon, label, value, valueClass = 'text-ink', onClick }) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3">
        <Icon size={24} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{label}</span>
      <span className={`shrink-0 text-lg font-black ${valueClass}`}>{value}</span>
      <ChevronRight size={21} className="shrink-0 text-ink-3" strokeWidth={2.3} />
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 border-b border-line-subtle py-3 text-left last:border-b-0 hover:text-brand"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 border-b border-line-subtle py-3 last:border-b-0">
      {content}
    </div>
  )
}

export default function HostedGroupCard({
  group,
  members,
  pendingAppCount,
  onViewGroup,
  onViewHistory,
  onRenewal,
  onViewApplications,
}) {
  const displayStatus = getGroupDisplayStatus(group)
  const { menu: menuActionDefs = [] } = GROUP_ACTION_MAP[displayStatus] ?? {}
  const hasMarkedPaid = members.some(m => m.paymentStatus === 'markedPaid')
  const isRenewalDue  = displayStatus === 'active_renewal'
  const featureChips = buildFeatureChips(group)
  const paidCount = members.filter(m => CONFIRMED_STATUSES.includes(m.paymentStatus)).length
  const paymentTarget = Math.max(members.length, group.usedSeats - 1, 0)
  const paymentValue = paymentTarget > 0 ? `${paidCount}/${paymentTarget}` : `${group.usedSeats}/${group.totalSeats}`
  const paymentState = getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget })

  const menuItems = menuActionDefs.map(action => ({
    label:   action.label,
    Icon:    ACTION_ICONS[action.key],
    onClick: ({ prepareRenewal: onRenewal, viewHistory: onViewHistory })[action.key],
  }))

  const viewBtnVariant = (hasMarkedPaid || isRenewalDue) ? 'primary' : 'ink'

  function handleMenuAction(e, item) {
    e.stopPropagation()
    item.onClick?.()
  }

  return (
    <article className="card flex min-h-full flex-col overflow-hidden rounded-card border-line bg-surface p-0">
      <div className="p-5 sm:p-6">
        <Badge
          variant={group.status}
          className={`${STATUS_BADGE_CLASS[displayStatus] ?? ''} px-3.5 py-1 text-sm font-extrabold`}
        />

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.95fr)] lg:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-4">
              <ServiceLogo
                serviceId={group.serviceId}
                size={88}
                className="rounded-logo border-line-strong"
              />
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-black leading-tight text-ink">{group.serviceName}</h2>
                <p className="mt-2 truncate text-xl font-semibold text-ink-3">{group.planName}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {featureChips.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-subtle px-3 py-1.5 text-sm font-bold text-brand"
                >
                  <Icon size={18} strokeWidth={2.1} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface px-4 py-2 shadow-[0_12px_26px_-22px_rgb(20_44_91_/_0.42)]">
            <StatusRow
              Icon={UserRound}
              label="待處理申請"
              value={pendingAppCount}
              valueClass={pendingAppCount > 0 ? 'text-brand' : 'text-ink'}
              onClick={onViewApplications}
            />
            <StatusRow
              Icon={DollarSign}
              label="本期收款"
              value={paymentValue}
              valueClass={hasMarkedPaid ? 'text-brand' : 'text-ink'}
              onClick={onViewGroup}
            />
            <StatusRow
              Icon={Calendar}
              label="下次扣款"
              value={formatMonthDay(group.nextBillingDate)}
              onClick={isRenewalDue ? onRenewal : onViewGroup}
            />
            <StatusRow
              Icon={ShieldCheck}
              label="付款狀態"
              value={paymentState}
              valueClass={paymentState === '正常' ? 'rounded-full bg-success-subtle px-3 py-1 text-base text-success-text' : 'text-warning-text'}
              onClick={onViewGroup}
            />
          </div>
        </div>

        {menuItems.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {menuItems.map(item => (
              <button
                key={item.label}
                type="button"
                onClick={e => handleMenuAction(e, item)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink-3 transition-colors hover:border-brand-border hover:bg-brand-subtle hover:text-brand"
              >
                {item.Icon && <item.Icon size={13} />}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex justify-center gap-3 border-t border-line px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onViewGroup}
          className={`inline-flex min-h-12 w-full max-w-[11.5rem] items-center justify-center rounded-panel px-5 text-base font-black shadow-[0_16px_28px_-18px_rgb(8_18_38_/_0.75)] transition-all hover:-translate-y-0.5 ${
            viewBtnVariant === 'primary'
              ? 'bg-brand text-white hover:bg-brand-hover'
              : 'bg-ink text-white hover:bg-slate-800'
          }`}
        >
          查看群組
        </button>
      </div>
    </article>
  )
}
