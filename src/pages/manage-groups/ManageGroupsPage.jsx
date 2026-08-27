import { useCallback, useMemo, useState } from 'react'
import { activateGroup, cancelGroup, confirmGroupPayments, endGroup, getGroupsByHostId, pauseGroup, startRenewalCycle, updateGroup } from '../../shared/stores/groupStore'
import { getApplicationsByHostId, updateApplicationStatus } from '../../shared/stores/applicationStore'
import { getMembersByGroupId, createMember, isUserGroupMember, removeMember, updateMember } from '../../shared/stores/memberStore'
import { activateGroupSubscriptions, confirmSubscriptionPayment, createSubscription, getSubscriptionByUserAndGroup } from '../../shared/stores/subscriptionStore'
import { createNotification } from '../../shared/stores/notificationStore'
import { getActiveUser } from '../../shared/stores/userStore'
import EmptyState from '../../shared/components/ui/EmptyState'
import HostedGroupCard from './components/HostedGroupCard'
import ManageRightRail from './components/ManageRightRail'
import MemberManagementModal from './components/MemberManagementModal'
import ApplicationsModal from './components/ApplicationsModal'
import EditGroupModal from './components/EditGroupModal'
import GroupHistoryModal from './components/GroupHistoryModal'
import RenewalModal from './components/RenewalModal'
import Modal from '../../shared/components/ui/Modal'
import PaymentStatusModal from './components/PaymentStatusModal'

const STATUS_FILTER_TABS = [
  { key: 'all',        label: '全部'   },
  { key: 'recruiting', label: '招募中' },
  { key: 'pending',    label: '待啟用' },
  { key: 'active',     label: '已啟用' },
  { key: 'paused',     label: '已停止' },
  { key: 'cancelled',  label: '已取消' },
]

const PENDING_STATUSES   = new Set(['full', 'pending_confirmation', 'pending_activation'])
const CANCELLED_STATUSES = new Set(['cancelled', 'ended'])

function matchesFilter(group, filterKey) {
  if (filterKey === 'all')        return true
  if (filterKey === 'recruiting') return group.status === 'recruiting'
  if (filterKey === 'pending')    return PENDING_STATUSES.has(group.status)
  if (filterKey === 'active')     return group.status === 'active'
  if (filterKey === 'paused')     return group.status === 'paused'
  if (filterKey === 'cancelled')  return CANCELLED_STATUSES.has(group.status)
  return true
}

function ActivateGroupModal({ group, onClose, onConfirm }) {
  return (
    <Modal isOpen onClose={onClose} title="確認啟用服務？" maxWidth="max-w-sm">
      <div className="p-5">
        <p className="text-sm font-semibold text-ink">{group.serviceName} · {group.planName}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
          <li>· 啟用後將開始計算續費日期</li>
          <li>· 方案資訊（價格、人數、週期）將無法修改</li>
          <li>· 已付款成員將收到啟用通知</li>
        </ul>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            確認啟用
          </button>
        </div>
      </div>
    </Modal>
  )
}

function loadManageData(activeUser) {
  if (!activeUser) return { hostedGroups: [], applications: [], members: [], seatMap: {} }
  const hostedGroups = getGroupsByHostId(activeUser.id)
  const applications = getApplicationsByHostId(activeUser.id, hostedGroups)
  const members      = hostedGroups.flatMap(g => getMembersByGroupId(g.id))
  const seatMap      = Object.fromEntries(
    hostedGroups.map(g => [g.id, { usedSeats: g.usedSeats, openSeats: g.openSeats }])
  )
  return { hostedGroups, applications, members, seatMap }
}

const CONFIRM_ACTION_CONFIG = {
  pause: {
    title: '暫停招募',
    desc: '暫停招募後，不會再接受新的加入申請，現有成員不受影響。',
    btnLabel: '確認暫停',
    btnClass: 'bg-amber-500 hover:bg-amber-600',
  },
  cancel: {
    title: '解散群組',
    desc: '解散群組後，所有成員將被移除。此操作在正式版中無法復原，請謹慎操作。',
    btnLabel: '確認解散',
    btnClass: 'bg-danger hover:bg-red-700',
  },
  stop: {
    title: '停止服務',
    desc: '停止服務後，本期仍可使用至到期日，下期將不再續訂。此操作無法復原，請謹慎操作。',
    btnLabel: '確認停止',
    btnClass: 'bg-danger hover:bg-red-700',
  },
}

function ConfirmActionModal({ action, onClose, onConfirm }) {
  const config = CONFIRM_ACTION_CONFIG[action.type]
  return (
    <Modal isOpen onClose={onClose} title={config.title} maxWidth="max-w-sm">
      <div className="p-5">
        <p className="text-sm leading-relaxed text-ink-2">{config.desc}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${config.btnClass}`}
          >
            {config.btnLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ManageGroupsPage() {
  const activeUser = getActiveUser()

  const [manageData, setManageData] = useState(() => loadManageData(activeUser))
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal states
  const [memberModalGroupId, setMemberModalGroupId] = useState(null)
  const [editModalGroupId, setEditModalGroupId] = useState(null)
  const [activateModalGroupId, setActivateModalGroupId] = useState(null)
  const [paymentModalGroupId, setPaymentModalGroupId] = useState(null)
  const [appsModalOpen, setAppsModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [historyModalGroupId, setHistoryModalGroupId] = useState(null)
  const [renewalModalGroupId, setRenewalModalGroupId] = useState(null)

  const { hostedGroups, applications, members, seatMap } = manageData

  const allGroups = useMemo(
    () => hostedGroups.map(g => ({ ...g, ...(seatMap[g.id] ?? {}) })),
    [hostedGroups, seatMap],
  )

  const displayGroups = useMemo(
    () => allGroups.filter(g => matchesFilter(g, statusFilter)),
    [allGroups, statusFilter],
  )

  const filterCounts = useMemo(() => {
    const counts = {}
    STATUS_FILTER_TABS.forEach(tab => {
      counts[tab.key] = allGroups.filter(g => matchesFilter(g, tab.key)).length
    })
    return counts
  }, [allGroups])

  const membersMap = useMemo(
    () => Object.fromEntries(hostedGroups.map(g => [g.id, getMembersByGroupId(g.id)])),
    [hostedGroups],
  )

  const applicationCounts = useMemo(() => {
    const counts = {}
    applications.forEach(a => {
      if (a.status === 'pending') counts[a.groupId] = (counts[a.groupId] ?? 0) + 1
    })
    return counts
  }, [applications])

  const getModalGroup = id => id ? allGroups.find(g => g.id === id) : null

  const renewalModalGroup  = getModalGroup(renewalModalGroupId)
  const memberModalGroup   = getModalGroup(memberModalGroupId)
  const editModalGroup     = getModalGroup(editModalGroupId)
  const activateModalGroup = getModalGroup(activateModalGroupId)
  const paymentModalGroup  = getModalGroup(paymentModalGroupId)
  const historyModalGroup  = getModalGroup(historyModalGroupId)

  function refreshGroups() {
    setManageData(prev => ({ ...prev, hostedGroups: getGroupsByHostId(activeUser.id) }))
  }

  // ── Remove member ──────────────────────────────────────────────
  function handleRemoveMember(member) {
    removeMember(member.id)
    const seats = seatMap[member.groupId]
    if (seats) {
      const newUsed = Math.max(0, seats.usedSeats - 1)
      const newOpen = seats.openSeats + 1
      updateGroup(member.groupId, { usedSeats: newUsed, openSeats: newOpen })
      setManageData(prev => ({
        ...prev,
        members: prev.hostedGroups.flatMap(g => getMembersByGroupId(g.id)),
        seatMap: { ...prev.seatMap, [member.groupId]: { usedSeats: newUsed, openSeats: newOpen } },
      }))
    }
  }

  // ── Danger actions (pause / cancel / stop) ──────────────────────
  function handleDangerAction(type) {
    setConfirmAction({ type, groupId: editModalGroupId })
    setEditModalGroupId(null)
  }

  function handleConfirmAction() {
    if (!confirmAction) return
    const { type, groupId } = confirmAction
    if (type === 'cancel') {
      cancelGroup(groupId)
    } else {
      pauseGroup(groupId)
    }
    setConfirmAction(null)
    refreshGroups()
  }

  // ── Confirm single member payment ──────────────────────────────
  function handleConfirmMember(member) {
    updateMember(member.id, { paymentStatus: 'confirmed' })

    const sub = getSubscriptionByUserAndGroup(member.userId, member.groupId)
    if (sub) confirmSubscriptionPayment(sub.id)

    createNotification({
      userId:  member.userId,
      type:    'payment_confirmed',
      title:   '付款已確認',
      message: `團主已確認你在「${member.groupName ?? ''}」的付款，感謝！`,
    })

    const updatedMembers = getMembersByGroupId(member.groupId)
    const allConfirmed = updatedMembers.length > 0 &&
      updatedMembers.every(m => ['confirmed', 'paid'].includes(m.paymentStatus))
    if (allConfirmed) confirmGroupPayments(member.groupId)

    refreshGroups()
  }

  // ── Activate handler ────────────────────────────────────────────
  function handleActivate(groupId) {
    const updatedGroup = activateGroup(groupId)
    if (updatedGroup) {
      activateGroupSubscriptions(groupId, updatedGroup.nextBillingDate)
      getMembersByGroupId(groupId).forEach(m => {
        createNotification({
          userId:  m.userId,
          type:    'group_activated',
          title:   '服務已正式啟用',
          message: `「${updatedGroup.serviceName}」群組已啟用！下次扣款日：${updatedGroup.nextBillingDate}。`,
        })
      })
    }
    setActivateModalGroupId(null)
    refreshGroups()
  }

  function handleConfirmPayments(groupId) {
    confirmGroupPayments(groupId)
    setPaymentModalGroupId(null)
    refreshGroups()
  }

  function handleStartRenewal() {
    if (!renewalModalGroupId) return
    startRenewalCycle(renewalModalGroupId)
    setRenewalModalGroupId(null)
    refreshGroups()
  }

  function handleEndGroup() {
    if (!renewalModalGroupId) return
    endGroup(renewalModalGroupId)
    setRenewalModalGroupId(null)
    refreshGroups()
  }

  // ── Application handlers ────────────────────────────────────────
  function handleApprove(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app || app.status !== 'pending') return

    const seats = seatMap[app.groupId]
    if (!seats || seats.openSeats <= 0) {
      setErrors(prev => ({ ...prev, [appId]: '此群組已額滿，無法核准' }))
      return
    }

    const group       = displayGroups.find(g => g.id === app.groupId)
    const applicantId = app.applicantId ?? app.userId
    const applicantName = app.applicantName ?? app.userName

    updateApplicationStatus(appId, 'approved')

    if (!isUserGroupMember(applicantId, app.groupId)) {
      createMember({
        groupId:           app.groupId,
        groupName:         app.groupName ?? app.serviceName,
        userId:            applicantId,
        userName:          applicantName,
        userAvatarInitial: app.applicantAvatarInitial ?? app.userAvatarInitial ?? applicantName[0],
        userAvatarColor:   app.applicantAvatarColor   ?? app.userAvatarColor   ?? '#94A3B8',
      })
    }

    if (group) {
      createSubscription({
        userId:            applicantId,
        groupId:           group.id,
        serviceId:         group.serviceId,
        serviceName:       group.serviceName,
        planName:          group.planName,
        hostName:          group.hostName,
        hostAvatarInitial: group.hostAvatarInitial,
        hostAvatarColor:   group.hostAvatarColor,
        pricePerSeat:      group.pricePerSeat,
        billingCycle:      group.billingCycle,
        nextBillingDate:   group.nextBillingDate,
      })
    }

    const newUsedSeats = seats.usedSeats + 1
    const newOpenSeats = seats.openSeats - 1
    updateGroup(app.groupId, { usedSeats: newUsedSeats, openSeats: newOpenSeats })

    createNotification({
      userId:  applicantId,
      type:    'application_approved',
      title:   '申請已通過',
      message: `你申請加入的「${app.groupName ?? app.serviceName}」群組已通過審核，歡迎加入！`,
    })

    setManageData(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a),
      members:      prev.hostedGroups.flatMap(g => getMembersByGroupId(g.id)),
      seatMap:      { ...prev.seatMap, [app.groupId]: { usedSeats: newUsedSeats, openSeats: newOpenSeats } },
    }))
    removeError(appId)
  }

  function handleReject(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app || app.status !== 'pending') return

    const applicantId = app.applicantId ?? app.userId
    updateApplicationStatus(appId, 'rejected')

    createNotification({
      userId:  applicantId,
      type:    'application_rejected',
      title:   '申請未通過',
      message: `很抱歉，你申請加入的「${app.groupName ?? app.serviceName}」群組申請未通過。`,
    })

    setManageData(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a),
    }))
    removeError(appId)
  }

  function removeError(id) {
    setErrors(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const groupHandlers = useCallback(g => ({
    onManageMembers: () => setMemberModalGroupId(g.id),
    onEditGroup:     () => setEditModalGroupId(g.id),
    onActivate:      () => setActivateModalGroupId(g.id),
    onViewPayments:  () => setPaymentModalGroupId(g.id),
    onViewHistory:   () => setHistoryModalGroupId(g.id),
    onRenewal:       () => setRenewalModalGroupId(g.id),
    onViewApps:      () => setAppsModalOpen(true),
  }), [])

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-ink">群組管理</h1>
        <p className="mt-1 text-sm text-ink-3">管理你建立的群組、審核申請、追蹤收款與續訂狀態。</p>
      </div>

      {/* Filter tabs — 在 flex row 外，不影響右欄對齊 */}
      <div className="mb-4 flex min-w-0 overflow-x-auto">
        <div className="flex gap-1">
          {STATUS_FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                statusFilter === tab.key
                  ? 'bg-brand text-white'
                  : 'text-ink-3 hover:bg-raised hover:text-ink'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-raised text-ink-4'
              }`}>
                {filterCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Group list */}
        <div className="min-w-0 flex-1">

          {allGroups.length === 0 ? (
            <EmptyState
              title="你還沒有建立任何群組"
              description="前往建立群組頁面，建立你的第一個共享群組"
            />
          ) : displayGroups.length === 0 ? (
            <EmptyState title={`此分類目前沒有群組`} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayGroups.map(g => (
                <HostedGroupCard
                  key={g.id}
                  group={g}
                  members={membersMap[g.id] ?? []}
                  pendingAppCount={applicationCounts[g.id] ?? 0}
                  {...groupHandlers(g)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="w-full shrink-0 lg:w-[20rem]">
          <ManageRightRail
            applications={applications}
            seatMap={seatMap}
            hostedGroups={allGroups}
            members={members}
            errors={errors}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewAllApps={() => setAppsModalOpen(true)}
            onRenewal={groupId => setRenewalModalGroupId(groupId)}
          />
        </div>
      </div>

      {/* Modals */}
      {memberModalGroup && (
        <MemberManagementModal
          isOpen
          onClose={() => setMemberModalGroupId(null)}
          group={memberModalGroup}
          members={membersMap[memberModalGroup.id] ?? []}
          onRemove={handleRemoveMember}
        />
      )}
      {editModalGroup && (
        <EditGroupModal
          key={editModalGroup.id}
          isOpen
          onClose={() => setEditModalGroupId(null)}
          group={editModalGroup}
          members={membersMap[editModalGroup.id] ?? []}
          onDangerAction={handleDangerAction}
          onSaved={refreshGroups}
        />
      )}
      <ApplicationsModal
        isOpen={appsModalOpen}
        onClose={() => setAppsModalOpen(false)}
        applications={applications}
        seatMap={seatMap}
        errors={errors}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      {activateModalGroup && (
        <ActivateGroupModal
          group={activateModalGroup}
          onClose={() => setActivateModalGroupId(null)}
          onConfirm={() => handleActivate(activateModalGroup.id)}
        />
      )}
      {paymentModalGroup && (
        <PaymentStatusModal
          isOpen
          onClose={() => setPaymentModalGroupId(null)}
          group={paymentModalGroup}
          members={membersMap[paymentModalGroup.id] ?? []}
          onConfirmPayments={() => handleConfirmPayments(paymentModalGroup.id)}
          onConfirmMember={handleConfirmMember}
        />
      )}
      {confirmAction && (
        <ConfirmActionModal
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
        />
      )}
      {historyModalGroup && (
        <GroupHistoryModal
          isOpen
          onClose={() => setHistoryModalGroupId(null)}
          group={historyModalGroup}
          members={membersMap[historyModalGroup.id] ?? []}
        />
      )}
      {renewalModalGroup && (
        <RenewalModal
          isOpen
          onClose={() => setRenewalModalGroupId(null)}
          group={renewalModalGroup}
          onStartRenewal={handleStartRenewal}
          onEndGroup={handleEndGroup}
        />
      )}
    </div>
  )
}
