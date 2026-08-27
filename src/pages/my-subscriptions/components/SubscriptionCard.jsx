import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Clock, ExternalLink, MessageCircle } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import Avatar from '../../../shared/components/ui/Avatar'
import GroupCardShell, { BillingDateRow } from '../../../shared/components/cards/GroupCardShell'
import { effectiveStatus } from '../../../shared/utils/subscriptionStatus'
import { SUB_PRIMARY_ACTION, SUB_SECONDARY_ACTIONS } from '../config/subActionMap'

const STATUS_DESC = {
  pending:            '本期帳單待付款，請依照指示完成付款。',
  overdue:            '付款逾期，請盡快補繳款項。',
  markedPaid:         '已送出付款標記，等待團主確認收款。',
  confirmed:          '本期付款已由團主確認，感謝！',
  waiting_activation: '款項已確認，等待團主正式啟用服務。',
  paid:               '本期費用已結清，服務正常運行中。',
}

const BADGE_STYLES = {
  violet:  'border-violet-200 bg-violet-50 text-violet-600',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const BADGE_ICONS = {
  awaitConfirm:     { Icon: CheckCircle2, title: '已送出付款標記，等待團主確認', extra: 'opacity-70 cursor-not-allowed' },
  paymentConfirmed: { Icon: CheckCircle2, title: '團主已確認你的付款' },
  waitActivation:   { Icon: Clock,        title: '付款已確認，等待團主啟用服務' },
}

function PaymentActionBtn({ action, sub, onMarkPaid, onViewRecords }) {
  if (!action) return null

  if (action.type === 'button') {
    return (
      <Button variant={action.variant} size="sm" onClick={() => onMarkPaid(sub)} className="w-full">
        <CheckCircle2 size={14} />
        {action.label}
      </Button>
    )
  }

  if (action.type === 'badge') {
    const { Icon, title, extra = '' } = BADGE_ICONS[action.key] ?? {}
    return (
      <span
        title={title}
        className={`flex w-full h-8 items-center justify-center gap-1.5 rounded-inner border text-xs font-bold cursor-default ${BADGE_STYLES[action.style]} ${extra}`}
      >
        {Icon && <Icon size={13} />}
        {action.label}
      </span>
    )
  }

  if (action.type === 'link') {
    return (
      <Button variant="secondary" size="sm" onClick={() => onViewRecords(sub)} className="w-full">
        <ClipboardList size={14} />
        {action.label}
      </Button>
    )
  }

  return null
}

export default function SubscriptionCard({ sub, onMarkPaid, onViewRecords, onContactHost }) {
  const navigate = useNavigate()
  const status = effectiveStatus(sub)
  const secondaryActions = SUB_SECONDARY_ACTIONS[status] ?? []

  const menuItems = secondaryActions.includes('contactHost')
    ? [{ label: '聯絡團主', Icon: MessageCircle, onClick: () => onContactHost?.(sub) }]
    : []

  return (
    <GroupCardShell
      serviceId={sub.serviceId}
      serviceName={sub.serviceName}
      planName={sub.planName}
      badgeVariant={status}
      menuItems={menuItems}
      infoRow={
        <>
          <span className="flex items-center gap-1.5 text-sm text-ink-2">
            <Avatar initial={sub.hostAvatarInitial} color={sub.hostAvatarColor} size="xs" />
            <span>{sub.hostName}</span>
          </span>
          <span className="flex items-center gap-1 text-sm text-ink-2">
            <span className="font-semibold">NT${sub.pricePerSeat}</span>
            <span className="text-xs text-ink-3">/月</span>
          </span>
          <BillingDateRow status={sub.groupStatus ?? 'active'} nextBillingDate={sub.nextBillingDate} />
        </>
      }
      body={
        STATUS_DESC[status] && <p className="text-xs text-ink-3">{STATUS_DESC[status]}</p>
      }
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/groups/${sub.groupId}`)} className="w-full">
            <ExternalLink size={14} />
            查看群組
          </Button>
          <PaymentActionBtn
            action={SUB_PRIMARY_ACTION[status]}
            sub={sub}
            onMarkPaid={onMarkPaid}
            onViewRecords={onViewRecords}
          />
        </>
      }
    />
  )
}
