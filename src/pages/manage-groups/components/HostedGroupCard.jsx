import { useRef, useState } from 'react'
import { History, MoreHorizontal, RefreshCw } from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { useClickOutside } from '../../../shared/utils/hooks'
import { CONFIRMED_STATUSES } from '../../../shared/constants/paymentStatus'
import { getGroupDisplayStatus, GROUP_ACTION_MAP } from '../config/groupActionMap'

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

function getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget }) {
  if (['paused', 'cancelled', 'ended'].includes(group.status)) return '已停止'
  if (hasMarkedPaid) return '待確認'
  if (['pending_confirmation', 'pending_activation', 'full'].includes(group.status)) return '待處理'
  if (paymentTarget > 0 && paidCount < paymentTarget && group.status === 'active') return '追蹤中'
  return '正常'
}

function DropdownMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(open, [ref], () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="更多選項"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-line bg-surface py-1 shadow-lg">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={e => { e.stopPropagation(); item.onClick?.(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-raised"
            >
              {item.Icon && <item.Icon size={14} className="shrink-0 text-ink-3" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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
  onViewGroup,
  onViewHistory,
  onRenewal,
  onViewApplications,
}) {
  const displayStatus = getGroupDisplayStatus(group)
  const { menu: menuActionDefs = [] } = GROUP_ACTION_MAP[displayStatus] ?? {}

  const hasMarkedPaid = members.some(m => m.paymentStatus === 'markedPaid')
  const isRenewalDue  = displayStatus === 'active_renewal'
  const paidCount     = members.filter(m => CONFIRMED_STATUSES.includes(m.paymentStatus)).length
  const paymentTarget = Math.max(members.length, group.usedSeats - 1, 0)
  const paymentValue  = paymentTarget > 0 ? `${paidCount}/${paymentTarget}` : `${group.usedSeats}/${group.totalSeats}`
  const paymentState  = getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget })
  const monthlyIncome = group.pricePerSeat * paymentTarget

  const menuItems = menuActionDefs.map(action => ({
    label:   action.label,
    Icon:    ACTION_ICONS[action.key],
    onClick: ({ prepareRenewal: onRenewal, viewHistory: onViewHistory })[action.key],
  }))

  const paymentStateHighlight = {
    '正常':  'text-success-text',
    '已停止': 'text-ink-3',
  }[paymentState] ?? 'text-warning-text'

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)]"
      onClick={onViewGroup}
    >
      {menuItems.length > 0 && (
        <div className="absolute right-4 top-4 z-10">
          <DropdownMenu items={menuItems} />
        </div>
      )}

      <div className="flex justify-center">
        <Badge variant={group.status} className={STATUS_BADGE_CLASS[displayStatus] ?? ''} />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={group.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{group.serviceName}</h2>
        <p className="mt-1 text-base font-semibold text-ink-3">{group.planName}</p>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-2 divide-x divide-y divide-line-subtle rounded-lg border border-line-subtle">
        <StatCell
          label="待處理申請"
          onClick={onViewApplications}
          highlight={pendingAppCount > 0 ? 'text-brand' : undefined}
        >
          {pendingAppCount} 件{pendingAppCount > 0 ? ' →' : ''}
        </StatCell>
        <StatCell
          label="本期收款"
          onClick={onViewGroup}
          highlight={hasMarkedPaid ? 'text-warning-text' : undefined}
        >
          {paymentValue}
        </StatCell>
        <StatCell label="付款狀態" highlight={paymentStateHighlight}>
          {paymentState}
        </StatCell>
        <StatCell label="每月收入">
          NT${monthlyIncome}
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
