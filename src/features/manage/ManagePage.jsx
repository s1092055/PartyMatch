import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { activateGroup, confirmGroupPayments, endGroup, getGroupsByHostId, startRenewalCycle, updateGroup } from '../../shared/stores/groupStore'
import { adjustCreditScore } from '../../shared/stores/authStore'
import { CREDIT_RULES } from '../../shared/utils/creditScore'
import { getApplicationsByHostId, updateApplicationStatus } from '../../shared/stores/applicationStore'
import { getMembersByGroupId, createMember, isUserGroupMember, removeMember, updateMember } from '../../shared/stores/memberStore'
import { activateGroupSubscriptions, confirmSubscriptionPayment, createSubscription, getSubscriptionByUserAndGroup, getSubscriptionsByGroupId } from '../../shared/stores/subscriptionStore'
import { getPaymentRecordCountBySubIds } from '../../shared/stores/paymentStore'
import { createNotification } from '../../shared/stores/notificationStore'
import { getCurrentUser } from '../../shared/stores/authStore'
import { CONFIRMED_STATUSES } from '../../shared/constants/paymentStatus'
import EmptyState from '../../shared/ui/EmptyState'
import GroupViewModal from '../../shared/ui/GroupViewModal'
import FilterTabsBar from '../../shared/ui/FilterTabsBar'
import HostedGroupCard from './components/HostedGroupCard'
import ApplicationsModal from './components/ApplicationsModal'
import GroupHistoryModal from './components/GroupHistoryModal'
import RenewalModal from './components/RenewalModal'

const STATUS_FILTER_TABS = [
  { key: 'all',        label: '全部'   },
  { key: 'recruiting', label: '招募中' },
  { key: 'pending',    label: '待啟用' },
  { key: 'active',     label: '已啟用' },
  { key: 'cancelled',  label: '已結束' },
]

const PENDING_STATUSES   = new Set(['full', 'pending_confirmation', 'pending_activation'])
const CANCELLED_STATUSES = new Set(['paused', 'cancelled', 'ended'])

function matchesFilter(group, filterKey) {
  if (filterKey === 'all')        return true
  if (filterKey === 'recruiting') return group.status === 'recruiting'
  if (filterKey === 'pending')    return PENDING_STATUSES.has(group.status)
  if (filterKey === 'active')     return group.status === 'active'
  if (filterKey === 'cancelled')  return CANCELLED_STATUSES.has(group.status)
  return true
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

export default function ManagePage() {
  const navigate = useNavigate()
  const activeUser = getCurrentUser()

  const [manageData, setManageData] = useState(() => loadManageData(activeUser))
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')

const [viewGroupId, setViewGroupId]           = useState(null)
  const [appsModalGroupId, setAppsModalGroupId] = useState(null)
  const [historyModalGroupId, setHistoryModalGroupId] = useState(null)
  const [renewalModalGroupId, setRenewalModalGroupId] = useState(null)

useEffect(() => {
    function onNewApp(e) {
      if (e.detail?.hostId === activeUser?.id) {
        setManageData(prev => ({
          ...prev,
          applications: getApplicationsByHostId(activeUser.id, prev.hostedGroups),
        }))
      }
    }
    window.addEventListener('pm:application-created', onNewApp)
    return () => window.removeEventListener('pm:application-created', onNewApp)
  }, [activeUser?.id])

  useEffect(() => {
    function onGroupCreated() {
      if (!activeUser) return
      setManageData(loadManageData(activeUser))
    }
    window.addEventListener('pm:group-created', onGroupCreated)
    return () => window.removeEventListener('pm:group-created', onGroupCreated)
  }, [activeUser])

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
    () => members.reduce((acc, m) => {
      ;(acc[m.groupId] ??= []).push(m)
      return acc
    }, {}),
    [members],
  )

  const applicationCounts = useMemo(() => {
    const counts = {}
    applications.forEach(a => {
      if (a.status === 'pending') counts[a.groupId] = (counts[a.groupId] ?? 0) + 1
    })
    return counts
  }, [applications])

  const paymentCounts = useMemo(() => {
    const counts = {}
    allGroups.forEach(g => {
      const subs = getSubscriptionsByGroupId(g.id)
      counts[g.id] = getPaymentRecordCountBySubIds(subs.map(s => s.id))
    })
    return counts
  }, [allGroups])

  const getModalGroup = id => id ? allGroups.find(g => g.id === id) : null
  const historyModalGroup = getModalGroup(historyModalGroupId)
  const renewalModalGroup = getModalGroup(renewalModalGroupId)

  function refreshGroups() {
    setManageData(prev => ({ ...prev, hostedGroups: getGroupsByHostId(activeUser.id) }))
  }

function handleRemoveMember(member) {
    adjustCreditScore(member.userId, CREDIT_RULES.MEMBER_REMOVED).catch(console.error)
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

function handleConfirmMember(member) {
    adjustCreditScore(member.userId, CREDIT_RULES.PAYMENT_CONFIRMED).catch(console.error)
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
      updatedMembers.every(m => CONFIRMED_STATUSES.includes(m.paymentStatus))
    if (allConfirmed) confirmGroupPayments(member.groupId)

    refreshGroups()
  }

function handleActivate(renewalDate) {
    if (!viewGroupId) return
    adjustCreditScore(activeUser.id, CREDIT_RULES.GROUP_ACTIVATED).catch(console.error)
    const updatedGroup = activateGroup(viewGroupId, renewalDate || null)
    if (updatedGroup) {
      activateGroupSubscriptions(viewGroupId, updatedGroup.nextBillingDate)
      getMembersByGroupId(viewGroupId).forEach(m => {
        createNotification({
          userId:  m.userId,
          type:    'group_activated',
          title:   '服務已正式啟用',
          message: `「${updatedGroup.serviceName}」群組已啟用！下次扣款日：${updatedGroup.nextBillingDate}。`,
        })
      })
    }
    setViewGroupId(null)
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
    const seatPatch = {
      usedSeats: newUsedSeats,
      openSeats: newOpenSeats,
      ...(newOpenSeats === 0 ? { status: 'full' } : {}),
    }
    updateGroup(app.groupId, seatPatch)

    createNotification({
      userId:  applicantId,
      type:    'application_approved',
      title:   '申請已通過',
      message: `你申請加入的「${app.groupName ?? app.serviceName}」群組已通過審核，歡迎加入！`,
    })

    setManageData(prev => {
      const updatedHostedGroups = prev.hostedGroups.map(g =>
        g.id === app.groupId ? { ...g, ...seatPatch } : g
      )
      return {
        ...prev,
        hostedGroups:  updatedHostedGroups,
        applications:  prev.applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a),
        members:       updatedHostedGroups.flatMap(g => getMembersByGroupId(g.id)),
        seatMap:       { ...prev.seatMap, [app.groupId]: { usedSeats: newUsedSeats, openSeats: newOpenSeats } },
      }
    })
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

  function groupHandlers(g) {
    return {
      onViewGroup:   () => { refreshGroups(); setViewGroupId(g.id) },
      onViewHistory: () => setHistoryModalGroupId(g.id),
      onRenewal:     () => setRenewalModalGroupId(g.id),
      onViewApplications: () => setAppsModalGroupId(g.id),
    }
  }

  return (
    <div className="px-2 md:px-4 lg:px-16">
      <div className="mb-6 text-center">
        <h1 className="page-title">群組管理</h1>
      </div>

      <div>
        <FilterTabsBar
          tabs={STATUS_FILTER_TABS}
          value={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
        />

        {allGroups.length === 0 ? (
          <EmptyState
            title="你還沒有建立任何群組"
            description="建立你的第一個共享群組，開始招募成員一起分攤費用"
            actionLabel="建立第一個群組"
            onAction={() => navigate('/create-group')}
          />
        ) : displayGroups.length === 0 ? (
          <EmptyState title="此分類目前沒有群組" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {displayGroups.map(g => (
              <HostedGroupCard
                key={g.id}
                group={g}
                members={membersMap[g.id] ?? []}
                pendingAppCount={applicationCounts[g.id] ?? 0}
                paymentCount={paymentCounts[g.id] ?? 0}
                {...groupHandlers(g)}
              />
            ))}
          </div>
        )}
      </div>

<GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); refreshGroups() }}
        groupId={viewGroupId}
        onConfirmMember={handleConfirmMember}
        onActivate={handleActivate}
        onRemoveMember={handleRemoveMember}
      />
      <ApplicationsModal
        isOpen={!!appsModalGroupId}
        onClose={() => setAppsModalGroupId(null)}
        applications={applications.filter(a => a.groupId === appsModalGroupId)}
        groupName={getModalGroup(appsModalGroupId)?.serviceName}
        seatMap={seatMap}
        errors={errors}
        onApprove={handleApprove}
        onReject={handleReject}
      />
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
