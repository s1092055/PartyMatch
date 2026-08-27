import { ClipboardList, DollarSign, History, Pencil, PlayCircle, RefreshCw, Settings, Users, UsersRound } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import ProgressBar from '../../../shared/components/ui/ProgressBar'
import GroupCardShell, { BillingDateRow } from '../../../shared/components/cards/GroupCardShell'
import { getGroupDisplayStatus, GROUP_ACTION_MAP } from '../config/groupActionMap'

const TERMINAL_STATUSES = new Set(['paused', 'cancelled', 'ended'])

const ACTION_ICONS = {
  manageMembers:    UsersRound,
  activateGroup:    PlayCircle,
  prepareRenewal:   RefreshCw,
  groupSettings:    Settings,
  viewHistory:      History,
  viewApplications: ClipboardList,
  viewPayments:     DollarSign,
  editGroup:        Pencil,
}

const STATE_DESC = {
  recruiting:           '招募中，招募完成後將啟用並開始計費。',
  full:                 '人數已滿，等待成員付款。',
  pending_confirmation: '收款確認中，請耐心等待。',
  pending_activation:   '所有款項已就緒，等待啟用。',
  paused:               '此群組服務已停止，無法進行啟用。',
  cancelled:            '此群組已取消，已付款項目將退回。',
  ended:                '此群組服務已結束。',
}

function ProgressSection({ group, members }) {
  const { status } = group
  const paidCount = members.filter(m => ['paid', 'confirmed'].includes(m.paymentStatus)).length
  const totalCount = members.length

  if (status === 'recruiting' || status === 'full') {
    const label = status === 'recruiting' ? '招募進度' : '招募進度（已滿額）'
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-3">
          <span>{label}</span>
          <span className="font-semibold text-ink-2">{group.usedSeats}/{group.totalSeats} 已加入</span>
        </div>
        <ProgressBar value={group.usedSeats} max={group.totalSeats} color="bg-brand" />
      </div>
    )
  }

  if (TERMINAL_STATUSES.has(status)) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-3">
          <span>服務已停止</span>
          <span>—</span>
        </div>
        <ProgressBar value={0} max={1} color="bg-line" />
      </div>
    )
  }

  if (totalCount === 0) return null

  const statLabel = status === 'pending_confirmation' ? '已確認' : '已收'
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-ink-3">
        <span>本期收款進度</span>
        <span className={`font-semibold ${paidCount === totalCount ? 'text-success-text' : 'text-ink-2'}`}>
          {paidCount}/{totalCount} {statLabel}
        </span>
      </div>
      <ProgressBar
        value={paidCount}
        max={totalCount}
        color={paidCount === totalCount ? 'bg-success' : 'bg-brand'}
      />
    </div>
  )
}

export default function HostedGroupCard({
  group,
  members,
  pendingAppCount,
  onManageMembers,
  onEditGroup,
  onActivate,
  onViewPayments,
  onViewHistory,
  onRenewal,
  onViewApps,
}) {
  const displayStatus = getGroupDisplayStatus(group)
  const { primary: primaryActions = [], menu: menuActionDefs = [] } = GROUP_ACTION_MAP[displayStatus] ?? {}

  const HANDLERS = {
    manageMembers:    onManageMembers,
    editGroup:        onEditGroup,
    viewPayments:     onViewPayments,
    activateGroup:    onActivate,
    groupSettings:    onEditGroup,
    prepareRenewal:   onRenewal,
    viewHistory:      onViewHistory,
    viewApplications: onViewApps,
  }

  const menuItems = menuActionDefs.map(action => ({
    label:   action.label,
    Icon:    ACTION_ICONS[action.key],
    onClick: HANDLERS[action.key],
  }))

  const monthlyTotal = group.pricePerSeat * (group.usedSeats || group.totalSeats)
  const desc = STATE_DESC[group.status]

  return (
    <GroupCardShell
      serviceId={group.serviceId}
      serviceName={group.serviceName}
      planName={group.planName}
      badgeVariant={group.status}
      infoRow={
        <>
          <span className="flex items-center gap-1.5 text-sm text-ink-2">
            <Users size={14} className="shrink-0 text-ink-3" />
            {group.usedSeats}/{group.totalSeats} 人
            {group.status === 'recruiting' && pendingAppCount > 0 && (
              <span className="ml-1 rounded-badge bg-warning-subtle px-2 py-0.5 text-xs font-semibold text-warning-text">
                {pendingAppCount} 件待審核
              </span>
            )}
          </span>
          <BillingDateRow status={group.status} nextBillingDate={group.nextBillingDate} />
        </>
      }
      body={
        <>
          <div className="space-y-1">
            {!TERMINAL_STATUSES.has(group.status) && (
              <p className="flex items-center gap-1.5 text-sm text-ink-2">
                <DollarSign size={14} className="shrink-0 text-ink-3" />
                每月 NT${monthlyTotal} · 由 {group.usedSeats} 位成員分攤
              </p>
            )}
            {desc && <p className="text-xs text-ink-3">{desc}</p>}
          </div>
          <ProgressSection group={group} members={members} />
        </>
      }
      menuItems={menuItems}
      actions={primaryActions.map(action => {
        const Icon = ACTION_ICONS[action.key]
        return (
          <Button key={action.key} variant={action.variant} size="sm" onClick={HANDLERS[action.key]} className="w-full">
            {Icon && <Icon size={14} />}
            {action.label}
          </Button>
        )
      })}
    />
  )
}
