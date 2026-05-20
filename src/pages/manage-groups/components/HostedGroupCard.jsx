import { useRef, useState } from 'react'
import {
  Calendar,
  ChevronRight,
  DollarSign,
  History,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { useClickOutside } from '../../../shared/utils/hooks'
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
        onClick={() => setOpen(v => !v)}
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
              onClick={() => { item.onClick?.(); setOpen(false) }}
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

function InfoRow({ Icon, label, value, valueClass = 'text-ink', onClick }) {
  const inner = (
    <>
      <Icon size={12} className="shrink-0 text-ink-3" />
      <span className="text-ink-3">{label}</span>
      <span className={`ml-auto font-semibold ${valueClass}`}>{value}</span>
      {onClick && <ChevronRight size={10} className="shrink-0 text-ink-3" />}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex w-full items-center gap-1.5 text-xs hover:text-brand">
        {inner}
      </button>
    )
  }
  return <div className="flex items-center gap-1.5 text-xs">{inner}</div>
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

  const hasMarkedPaid  = members.some(m => m.paymentStatus === 'markedPaid')
  const isRenewalDue   = displayStatus === 'active_renewal'
  const paidCount      = members.filter(m => CONFIRMED_STATUSES.includes(m.paymentStatus)).length
  const paymentTarget  = Math.max(members.length, group.usedSeats - 1, 0)
  const paymentValue   = paymentTarget > 0 ? `${paidCount}/${paymentTarget}` : `${group.usedSeats}/${group.totalSeats}`
  const paymentState   = getPaymentState({ group, hasMarkedPaid, paidCount, paymentTarget })

  const menuItems = menuActionDefs.map(action => ({
    label:   action.label,
    Icon:    ACTION_ICONS[action.key],
    onClick: ({ prepareRenewal: onRenewal, viewHistory: onViewHistory })[action.key],
  }))

  const viewBtnVariant = (hasMarkedPaid || isRenewalDue) ? 'primary' : 'ink'

  const paymentStateClass = {
    '正常':  'text-success-text',
    '已停止': 'text-ink-3',
  }[paymentState] ?? 'text-warning-text'

  return (
    <article className="card relative flex flex-col overflow-hidden p-0">
      <div className="absolute left-3 top-3 z-10">
        <Badge variant={group.status} className={STATUS_BADGE_CLASS[displayStatus] ?? ''} />
      </div>

      {menuItems.length > 0 && (
        <div className="absolute right-3 top-3 z-10">
          <DropdownMenu items={menuItems} />
        </div>
      )}

      <div className="flex flex-1">
        <div className="flex w-[45%] shrink-0 flex-col items-center justify-center gap-3 px-4 pb-5 pt-10">
          <ServiceLogo serviceId={group.serviceId} size={56} />
          <div className="w-full text-center">
            <p className="truncate font-bold text-ink">{group.serviceName}</p>
            <p className="truncate text-xs text-ink-3">{group.planName}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2.5 border-l border-line-subtle p-4 pt-10">
          <InfoRow
            Icon={UserRound}
            label="待處理申請"
            value={`${pendingAppCount} 件`}
            valueClass={pendingAppCount > 0 ? 'text-brand' : 'text-ink'}
            onClick={onViewApplications}
          />
          <InfoRow
            Icon={DollarSign}
            label="本期收款"
            value={paymentValue}
            valueClass={hasMarkedPaid ? 'text-warning-text' : 'text-ink'}
            onClick={onViewGroup}
          />
          <InfoRow
            Icon={Calendar}
            label="下次扣款"
            value={formatMonthDay(group.nextBillingDate)}
            onClick={isRenewalDue ? onRenewal : onViewGroup}
          />
          <InfoRow
            Icon={ShieldCheck}
            label="付款狀態"
            value={paymentState}
            valueClass={paymentStateClass}
          />
        </div>
      </div>

      <div className="flex justify-center border-t border-line-subtle py-3">
        <Button variant={viewBtnVariant} size="sm" onClick={onViewGroup} className="px-8">
          查看群組
        </Button>
      </div>
    </article>
  )
}
