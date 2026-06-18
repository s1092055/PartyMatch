import Badge from '../../../shared/ui/Badge'
import Button from '../../../shared/ui/Button'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { CONFIRMED_STATUSES } from '../../../shared/constants/paymentStatus'
import { getGroupDisplayStatus } from '../utils/groupActionMap'

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

function getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget }) {
  if (['paused', 'cancelled', 'ended'].includes(group.status)) return '已結束'
  if (hasMarkedPaid) return '待確認'
  if (['pending_confirmation', 'pending_activation', 'full'].includes(group.status)) return '待處理'
  if (paymentTarget > 0 && paidCount < paymentTarget && group.status === 'active') return '追蹤中'
  return '正常'
}

function StatCell({ label, children, onClick, highlight }) {
  const content = (
    <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
      <span className="text-2xs font-bold text-ink-3">{label}</span>
      <span className={`text-sm font-black leading-tight ${highlight ?? 'text-ink'}`}>{children}</span>
    </div>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick() }}
        className="w-full rounded-lg hover:bg-raised transition-colors"
      >
        {content}
      </button>
    )
  }
  return content
}

export default function HostedGroupCard({
  group,
  members,
  pendingAppCount,
  paymentCount,
  onViewGroup,
}) {
  const displayStatus = getGroupDisplayStatus(group)

  const hasMarkedPaid = members.some(m => m.paymentStatus === 'markedPaid')
  const paidCount     = members.filter(m => CONFIRMED_STATUSES.includes(m.paymentStatus)).length
  const paymentValue  = `${paidCount}/${members.length}`
  const paymentState  = getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget: members.length })

  const paymentStateHighlight = {
    '正常':  'text-success-text',
    '已結束': 'text-ink-3',
  }[paymentState] ?? 'text-warning-text'

  const isActivated = ['active', 'paused', 'cancelled', 'ended'].includes(group.status)

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)]"
      onClick={onViewGroup}
    >

      <div className="flex justify-center">
        <Badge variant={group.status} className={STATUS_BADGE_CLASS[displayStatus] ?? ''} />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={group.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{group.serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{group.planName}</p>
        <p className="mt-1 text-base font-extrabold text-ink">
          NT${group.pricePerSeat}
          <span className="ml-1 text-xs font-normal text-ink-4">/席/月</span>
        </p>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        {isActivated ? (
          <StatCell label="付款紀錄">
            {paymentCount} 筆
          </StatCell>
        ) : (
          <StatCell
            label="待處理申請"
            highlight={pendingAppCount > 0 ? 'text-brand' : undefined}
          >
            {pendingAppCount} 件{pendingAppCount > 0 ? ' ●' : ''}
          </StatCell>
        )}
        <StatCell
          label="收款紀錄"
          highlight={hasMarkedPaid ? 'text-warning-text' : undefined}
        >
          {paymentValue}
        </StatCell>
        <StatCell label="付款狀態" highlight={paymentStateHighlight}>
          {paymentState}
        </StatCell>
      </div>

      <div className="mt-auto pt-5">
        <Button
          onClick={e => { e.stopPropagation(); onViewGroup?.() }}
          className="w-full"
        >
          查看群組
        </Button>
      </div>
    </article>
  )
}
