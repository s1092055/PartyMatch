import { DollarSign, MessageCircle, Users } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import GroupCardShell from '../../../shared/components/cards/GroupCardShell'
import { billingChip } from '../../../shared/utils/billingChip'
import { getGroupById } from '../../../shared/stores/groupStore'
import { effectiveStatus } from '../../../shared/utils/subscriptionStatus'
import { SUB_SECONDARY_ACTIONS } from '../config/subActionMap'

export default function SubscriptionCard({ sub, onViewGroup, onContactHost }) {
  const status = effectiveStatus(sub)
  const secondaryActions = SUB_SECONDARY_ACTIONS[status] ?? []

  const menuItems = secondaryActions.includes('contactHost')
    ? [{ label: '聯絡團主', Icon: MessageCircle, onClick: () => onContactHost?.(sub) }]
    : []

  const group = getGroupById(sub.groupId)
  const chips = [
    { Icon: Users,       label: group ? `${group.usedSeats}/${group.totalSeats} 人` : '— 人' },
    { Icon: DollarSign,  label: `NT$${sub.pricePerSeat} / 人月` },
    billingChip(sub.groupStatus ?? 'active', sub.nextBillingDate),
  ]

  return (
    <GroupCardShell
      serviceId={sub.serviceId}
      serviceName={sub.serviceName}
      planName={sub.planName}
      badgeVariant={status}
      chips={chips}
      menuItems={menuItems}
      actions={
        <Button variant="ink" size="sm" onClick={() => onViewGroup?.(sub)} className="px-8">
          查看群組
        </Button>
      }
    />
  )
}
