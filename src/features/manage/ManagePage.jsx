import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { CREDIT_RULES } from '../../shared/utils/creditScore'
import { useApplicationStore } from '../../shared/stores/useApplicationStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import { useSubscriptionStore } from '../../shared/stores/useSubscriptionStore'
import { usePaymentStore } from '../../shared/stores/usePaymentStore'
import { useNotificationStore } from '../../shared/stores/useNotificationStore'
import { createGroupConversation, removeParticipantFromConversation, sendSystemMessage, sendActionMessage } from '../../shared/api/messagesApi'
import { insertNotification } from '../../shared/api/notificationsApi'
import { useConversationStore } from '../../shared/stores/useConversationStore'
import { CONFIRMED_STATUSES } from '../../shared/constants/paymentStatus'

// ── store 操作的精簡別名（事件處理器內呼叫，讀取最新 store 狀態）─────────────
const getGroupById     = (id)      => useGroupStore.getState().getById(id)
const getGroupsByHostId = (hostId) => useGroupStore.getState().getByHostId(hostId)
const updateGroup      = (id, p)   => useGroupStore.getState().update(id, p)
const activateGroup    = (id, d)   => useGroupStore.getState().activateGroup(id, d)
const activateGroupChat   = (id)   => useGroupStore.getState().activateGroupChat(id)
const confirmGroupPayments = (id)  => useGroupStore.getState().confirmGroupPayments(id)
const startRenewalCycle = (id)     => useGroupStore.getState().startRenewalCycle(id)
const endGroup         = (id)      => useGroupStore.getState().endGroup(id)

const adjustCreditScore = (uid, d) => useAuthStore.getState().adjustCreditScore(uid, d)

const getApplicationByUserAndGroup = (uid, gid)   => useApplicationStore.getState().getByUserAndGroup(uid, gid)
const getApplicationsByHostId      = (hid, grps)  => useApplicationStore.getState().getByHostId(hid, grps)
const updateApplicationStatus      = (id, status) => useApplicationStore.getState().updateStatus(id, status)

const getMembersByGroupId        = (gid)    => useMemberStore.getState().getByGroupId(gid)
const createMember               = (data)   => useMemberStore.getState().create(data)
const isUserGroupMember          = (uid, gid) => useMemberStore.getState().isMember(uid, gid)
const removeMember               = (id)     => useMemberStore.getState().remove(id)
const resetMemberPaymentsForGroup = (gid)   => useMemberStore.getState().resetPaymentsForGroup(gid)
const updateMember               = (id, p)  => useMemberStore.getState().update(id, p)

const activateGroupSubscriptions      = (gid, d) => useSubscriptionStore.getState().activateGroupSubscriptions(gid, d)
const confirmSubscriptionPayment      = (id)     => useSubscriptionStore.getState().confirmPayment(id)
const createSubscription              = (data)   => useSubscriptionStore.getState().create(data)
const getSubscriptionByUserAndGroup   = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)
const getSubscriptionsByGroupId       = (gid)    => useSubscriptionStore.getState().getByGroupId(gid)
const removeSubscription              = (id)     => useSubscriptionStore.getState().remove(id)
const resetSubscriptionPayment        = (id)     => useSubscriptionStore.getState().resetPayment(id)
const resetSubscriptionPaymentsForGroup = (gid)  => useSubscriptionStore.getState().resetPaymentsForGroup(gid)

const createPaymentRecord        = (data)    => usePaymentStore.getState().create(data)
const getPaymentRecordCountBySubIds = (ids)  => usePaymentStore.getState().getCountBySubIds(ids)
const createNotification         = (data)    => useNotificationStore.getState().create(data)
const addConversationOptimistic  = (conv)    => useConversationStore.getState().addConversationOptimistic(conv)
const getConvByGroupId           = (gid)     => useConversationStore.getState().getByGroupId(gid)
import EmptyState from '../../shared/ui/EmptyState'
import GroupViewModal from '../../shared/ui/GroupViewModal'
import FilterTabsBar from '../../shared/ui/FilterTabsBar'
import HostedGroupCard from './components/HostedGroupCard'
import GroupHistoryModal from './components/GroupHistoryModal'
import RenewalModal from './components/RenewalModal'

const STATUS_FILTER_TABS = [
  { key: 'all',        label: '全部'   },
  { key: 'recruiting', label: '招募中' },
  { key: 'pending',    label: '處理中' },
  { key: 'active',     label: '啟用中' },
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

function calcApprovalSeatPatch(seats, alreadyMember) {
  if (alreadyMember) return null
  const newUsedSeats = seats.usedSeats + 1
  const newOpenSeats = seats.openSeats - 1
  return { usedSeats: newUsedSeats, openSeats: newOpenSeats, ...(newOpenSeats === 0 ? { status: 'full' } : {}) }
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
  const location = useLocation()
  const activeUser = useAuthStore(s => s.user)

  // 訂閱 store 切片，群組/申請/成員/訂閱更新時觸發 manageData 重新載入
  const groupsState        = useGroupStore(s => s.groups)
  const applicationsState  = useApplicationStore(s => s.applications)
  const membersState       = useMemberStore(s => s.members)
  const subscriptionsState = useSubscriptionStore(s => s.subscriptions)

  const [manageData, setManageData] = useState(() => loadManageData(activeUser))
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')

  const [viewGroupId, setViewGroupId]                     = useState(null)
  const [autoOpenActivateGroup, setAutoOpenActivateGroup] = useState(false)
  const [autoOpenActivate, setAutoOpenActivate]           = useState(false)
  const [autoOpenApplications, setAutoOpenApplications]   = useState(false)
  const [autoOpenBilling, setAutoOpenBilling]             = useState(false)
  const [historyModalGroupId, setHistoryModalGroupId]     = useState(null)
  const [renewalModalGroupId, setRenewalModalGroupId]     = useState(null)

  function applyOpenManageGroup({ groupId, openGroupId, statusFilter: selectedStatusFilter, openActivateGroup, openActivate, openApplications, openBilling }) {
    const gId = groupId ?? openGroupId
    if (!gId) return
    if (selectedStatusFilter) setStatusFilter(selectedStatusFilter)
    setViewGroupId(gId)
    setAutoOpenActivateGroup(!!openActivateGroup)
    setAutoOpenActivate(!!openActivate)
    setAutoOpenApplications(!!openApplications)
    setAutoOpenBilling(!!openBilling)
  }

  // 跨頁面：從 location.state 讀（ManagePage 剛掛載時）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location.state?.openGroupId) applyOpenManageGroup(location.state)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 同頁面：custom event（ManagePage 已掛載，event 直接接到）
  useEffect(() => {
    function onOpenManageGroup(e) { applyOpenManageGroup(e.detail ?? {}) }
    window.addEventListener('pm:open-manage-group', onOpenManageGroup)
    return () => window.removeEventListener('pm:open-manage-group', onOpenManageGroup)
  }, [])

  // store 切片變動時重新載入 manageData（取代舊的 pm:*-changed 事件）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeUser) setManageData(loadManageData(activeUser))
  }, [activeUser, groupsState, applicationsState, membersState, subscriptionsState])


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

async function handleActivateGroup(paymentAccount) {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return
    const groupMembers = getMembersByGroupId(viewGroupId)

    if (paymentAccount) updateGroup(viewGroupId, { paymentAccount })

    // 先建立聊天室（後端 POST /conversations/group 已包含所有成員），再推進群組狀態
    const conv = await createGroupConversation({ groupId: viewGroupId })
    const convId = conv.id
    activateGroupChat(viewGroupId)

    await sendActionMessage(convId, {
      text: `請填寫你在 ${group.serviceName} 使用的服務帳號（電子信箱），以便團主幫你設定訂閱。`,
      actionType: 'fill_service_info',
      payload: { serviceName: group.serviceName, serviceId: group.serviceId },
    })
    if (paymentAccount) {
      await sendSystemMessage(convId, `團主已提供收款資訊，請依照以下方式完成付款：\n${paymentAccount}`)
    }

    // 通知團主自己
    createNotification({
      userId:  group.hostId,
      type:    'group_chat_opened',
      title:   '群組聊天室已開啟',
      message: `「${group.serviceName}」群組已啟用，聊天室已建立，點擊查看。`,
      meta:    { groupId: viewGroupId },
    })
    // 通知所有成員（只寫 DB，成員刷新後看到）
    groupMembers.forEach(m => {
      insertNotification({
        userId:  m.userId,
        type:    'group_chat_opened',
        title:   '群組聊天室已開啟',
        message: `「${group.serviceName}」群組聊天室已建立，請進入填寫服務帳號並完成付款。`,
        meta:    { groupId: viewGroupId },
      }).catch(console.error)
    })

    // 樂觀新增聊天室到本地 store
    const participantMeta = {
      [group.hostId]: { name: group.hostName, avatarInitial: group.hostAvatarInitial, avatarColor: group.hostAvatarColor },
      ...Object.fromEntries(groupMembers.map(m => [m.userId, { name: m.userName, avatarInitial: m.userAvatarInitial, avatarColor: m.userAvatarColor }])),
    }
    addConversationOptimistic({
      id:           convId,
      type:         'group',
      groupId:      viewGroupId,
      hostId:       group.hostId,
      name:         group.serviceName ?? viewGroupId,
      serviceId:    group.serviceId ?? null,
      participants: [group.hostId, ...groupMembers.map(m => m.userId)],
      participantMeta,
      unreadCounts: { [group.hostId]: 0 },
      lastMessage:  '',
      lastMessageAt: null,
    })

    setViewGroupId(null)
  }

function handleRemoveMember(member) {
    const group = getGroupById(member.groupId)
    adjustCreditScore(member.userId, CREDIT_RULES.MEMBER_REMOVED).catch(console.error)
    removeMember(member.id)
    const app = getApplicationByUserAndGroup(member.userId, member.groupId)
    if (app) updateApplicationStatus(app.id, 'removed')
    const sub = getSubscriptionByUserAndGroup(member.userId, member.groupId)
    if (sub) removeSubscription(sub.id)
    const seats = seatMap[member.groupId]
    if (seats) {
      const newUsed = Math.max(0, seats.usedSeats - 1)
      const newOpen = seats.openSeats + 1
      const statusPatch = group?.status === 'full' ? { status: 'recruiting' } : {}
      updateGroup(member.groupId, { usedSeats: newUsed, openSeats: newOpen, ...statusPatch })
      setManageData(prev => ({
        ...prev,
        members: prev.hostedGroups.flatMap(g => getMembersByGroupId(g.id)),
        seatMap: { ...prev.seatMap, [member.groupId]: { usedSeats: newUsed, openSeats: newOpen } },
      }))
    } else {
      setManageData(prev => ({
        ...prev,
        members: prev.hostedGroups.flatMap(g => getMembersByGroupId(g.id)),
      }))
    }

    const groupLabel = group?.groupName ?? group?.serviceName ?? '群組'
    insertNotification({
      userId:  member.userId,
      type:    'member_removed',
      title:   '已被移出群組',
      message: `團主已將你移出「${groupLabel}」群組。`,
      meta:    { groupId: member.groupId },
    }).catch(console.error)
    const convId = getConvByGroupId(member.groupId)?.id
    if (convId) {
      sendSystemMessage(convId, `${member.userName} 已被移出群組`).catch(console.error)
      removeParticipantFromConversation(convId, member.userId).catch(console.error)
    }
  }

function handleConfirmMember(member) {
    const sub = getSubscriptionByUserAndGroup(member.userId, member.groupId)
    if (!sub) return

    adjustCreditScore(member.userId, CREDIT_RULES.PAYMENT_CONFIRMED).catch(console.error)
    updateMember(member.id, { paymentStatus: 'confirmed', paymentIssueType: null, paymentIssueNote: null })

    // 重新從 store 讀取最新 member 資料，確保 paymentProofUrl/paidAmount 是最新值
    const freshMember = getMembersByGroupId(member.groupId).find(m => m.id === member.id) ?? member
    confirmSubscriptionPayment(sub.id)
    createPaymentRecord({
      subscriptionId: sub.id,
      amount:   freshMember.paidAmount ?? sub.pricePerSeat,
      proofUrl: freshMember.paymentProofUrl ?? null,
    })

    insertNotification({
      userId:  member.userId,
      type:    'payment_confirmed',
      title:   '付款已確認，等待團主啟用服務',
      message: `團主已確認你在「${member.groupName ?? ''}」的付款，請等待服務啟用。`,
    }).catch(console.error)

    const updatedMembers = getMembersByGroupId(member.groupId)
    const groupSnapshot = getGroupById(member.groupId)
    const allConfirmed = updatedMembers.length > 0 &&
      updatedMembers.every(m => CONFIRMED_STATUSES.includes(m.paymentStatus))
    if (allConfirmed && groupSnapshot?.openSeats <= 0) {
      confirmGroupPayments(member.groupId)
      createNotification({
        userId:  activeUser.id,
        type:    'all_payments_confirmed',
        title:   '所有付款已確認，可以啟用服務了',
        message: `「${groupSnapshot?.serviceName ?? ''}」所有成員付款已確認，請立即啟用服務。`,
        meta:    { groupId: member.groupId },
      })
    }

    refreshGroups()
  }

  const PAYMENT_ISSUE_REASONS = {
    amount_mismatch:  (price, note) => `你的付款金額與應付金額（NT$${price}）不符，請重新確認後補件。${note ? `備注：${note}` : ''}`,
    proof_incomplete: (_, note)     => `你上傳的付款截圖不清晰或資訊不完整，請重新上傳完整截圖。${note ? `備注：${note}` : ''}`,
    wrong_info:       (_, note)     => `你的付款資訊有誤，請確認後重新補件。${note ? `備注：${note}` : ''}`,
    other:            (_, note)     => note,
  }

  function handleReportPaymentIssue(member, issueType, issueNote) {
    updateMember(member.id, { paymentStatus: 'payment_failed', paymentProofUrl: null, paymentIssueType: issueType, paymentIssueNote: issueNote || null })
    const sub = getSubscriptionByUserAndGroup(member.userId, member.groupId)
    if (sub) resetSubscriptionPayment(sub.id)

    const group = getGroupById(member.groupId)
    const pricePerSeat = sub?.pricePerSeat ?? group?.pricePerSeat ?? 0
    const reasonFn = PAYMENT_ISSUE_REASONS[issueType] ?? PAYMENT_ISSUE_REASONS.other
    const reasonText = reasonFn(pricePerSeat, issueNote)

    const convId = getConvByGroupId(member.groupId)?.id
    if (convId) sendSystemMessage(convId, `${member.userName}，已被要求重新補件`).catch(console.error)
    if (convId) sendActionMessage(convId, {
      text: reasonText,
      actionType: 'request_resubmit',
      payload: { targetUserId: member.userId },
    }).catch(console.error)

    insertNotification({
      userId:  member.userId,
      type:    'payment_issue',
      title:   '付款資訊需要修正',
      message: `團主在「${member.groupName ?? group?.serviceName ?? ''}」發現付款問題，請前往重新補件。`,
      meta:    { groupId: member.groupId },
    }).catch(console.error)

    refreshGroups()
  }

function handleActivate(renewalDate) {
    if (!viewGroupId) return
    adjustCreditScore(activeUser.id, CREDIT_RULES.GROUP_ACTIVATED).catch(console.error)
    const updatedGroup = activateGroup(viewGroupId, renewalDate || null)
    if (updatedGroup) {
      activateGroupSubscriptions(viewGroupId, updatedGroup.nextBillingDate)
      const activateConvId = getConvByGroupId(viewGroupId)?.id
      if (activateConvId) sendSystemMessage(
        activateConvId,
        `${updatedGroup.serviceName} 訂閱服務已正式啟用！下次扣款日：${updatedGroup.nextBillingDate}。`
      ).catch(console.error)
      createNotification({
        userId:  activeUser.id,
        type:    'group_activated',
        title:   '服務已正式啟用',
        message: `「${updatedGroup.serviceName}」群組已成功啟用！下次扣款日：${updatedGroup.nextBillingDate}。`,
        meta:    { groupId: viewGroupId },
      })
      getMembersByGroupId(viewGroupId).forEach(m => {
        insertNotification({
          userId:  m.userId,
          type:    'group_activated',
          title:   '服務已正式啟用',
          message: `「${updatedGroup.serviceName}」群組已啟用！下次扣款日：${updatedGroup.nextBillingDate}。`,
          meta:    { groupId: viewGroupId },
        }).catch(console.error)
      })
    }
    setViewGroupId(null)
    refreshGroups()
  }

  function handleStartRenewal() {
    if (!renewalModalGroupId) return
    startRenewalCycle(renewalModalGroupId)
    resetMemberPaymentsForGroup(renewalModalGroupId)
    resetSubscriptionPaymentsForGroup(renewalModalGroupId)
    getMembersByGroupId(renewalModalGroupId).forEach(m => {
      insertNotification({
        userId:  m.userId,
        type:    'payment_due',
        title:   '新一期付款通知',
        message: `「${m.groupName ?? ''}」已進入新一期收款，請至訂閱頁面完成付款。`,
      }).catch(console.error)
    })
    setRenewalModalGroupId(null)
    refreshGroups()
  }

  function handleEndGroup() {
    if (!renewalModalGroupId) return
    const group = getGroupById(renewalModalGroupId)
    const groupMembers = getMembersByGroupId(renewalModalGroupId)
    const groupLabel = group?.groupName ?? group?.serviceName ?? '群組'

    endGroup(renewalModalGroupId)

    groupMembers.forEach(m => {
      insertNotification({
        userId:  m.userId,
        type:    'group_ended',
        title:   '群組已結束',
        message: `「${groupLabel}」群組已由團主結束，合購服務將不再續訂。`,
      }).catch(console.error)
    })
    const endConvId = getConvByGroupId(renewalModalGroupId)?.id
    if (endConvId) sendSystemMessage(endConvId, `團主已結束「${groupLabel}」群組`).catch(console.error)

    setRenewalModalGroupId(null)
    refreshGroups()
  }

function handleApprove(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app || app.status !== 'pending') return

    const group = getGroupById(app.groupId) ?? allGroups.find(g => g.id === app.groupId)
    if (!group) {
      setErrors(prev => ({ ...prev, [appId]: '找不到群組資料，無法核准' }))
      return
    }

    const applicantId = app.applicantId ?? app.userId
    const applicantName = app.applicantName ?? app.userName ?? '新成員'
    const alreadyMember = isUserGroupMember(applicantId, app.groupId)
    const seats = seatMap[app.groupId] ?? { usedSeats: group.usedSeats, openSeats: group.openSeats }
    if (!alreadyMember && (!seats || seats.openSeats <= 0)) {
      setErrors(prev => ({ ...prev, [appId]: '此群組已額滿，無法核准' }))
      return
    }

    updateApplicationStatus(appId, 'approved')

    if (!alreadyMember) {
      createMember({
        groupId:           app.groupId,
        groupName:         app.groupName ?? app.serviceName,
        userId:            applicantId,
        userName:          applicantName,
        userAvatarInitial: app.applicantAvatarInitial ?? app.userAvatarInitial ?? applicantName[0],
        userAvatarColor:   app.applicantAvatarColor   ?? app.userAvatarColor   ?? '#94A3B8',
        skipApiCall:       true, // 後端 PATCH /applications 核准時已在 transaction 建立 member
      })
    }

    if (!getSubscriptionByUserAndGroup(applicantId, group.id)) {
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
        skipApiCall:       true, // 後端 PATCH /applications 核准時已在 transaction 建立 subscription
      })
    }

    const seatPatch = calcApprovalSeatPatch(seats, alreadyMember)
    const newUsedSeats = seatPatch?.usedSeats ?? seats.usedSeats
    const newOpenSeats = seatPatch?.openSeats ?? seats.openSeats
    if (seatPatch) updateGroup(app.groupId, seatPatch)

    // 申請人通知：只寫 DB，申請人刷新後才看到
    insertNotification({
      userId:  applicantId,
      type:    'application_approved',
      title:   '申請已通過',
      message: `恭喜！你加入「${app.groupName ?? app.serviceName}」群組的申請已通過，請前往我的訂閱查看。`,
      meta:    { groupId: app.groupId, applicationId: appId },
    }).catch(console.error)

    if (seatPatch?.status === 'full') {
      // 名額已滿通知給宿主自己（即時）
      createNotification({
        userId:  group.hostId,
        type:    'group_full',
        title:   '群組名額已滿',
        message: `「${app.groupName ?? app.serviceName}」群組名額已滿，可以點擊啟用群組了。`,
        meta:    { groupId: app.groupId },
      })
    }

    setManageData(prev => {
      const updatedHostedGroups = prev.hostedGroups.map(g =>
        g.id === app.groupId && seatPatch ? { ...g, ...seatPatch } : g
      )
      return {
        ...prev,
        hostedGroups:  updatedHostedGroups,
        applications:  prev.applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a),
        members:       updatedHostedGroups.flatMap(g => getMembersByGroupId(g.id)),
        seatMap:       seatPatch
          ? { ...prev.seatMap, [app.groupId]: { usedSeats: newUsedSeats, openSeats: newOpenSeats } }
          : prev.seatMap,
      }
    })
    removeError(appId)
  }

  function handleReportServiceInfoIssue(member, note) {
    updateMember(member.id, { serviceInfoIssueNote: note })

    const group = getGroupById(member.groupId)
    const convId = getConvByGroupId(member.groupId)?.id

    if (convId) sendSystemMessage(convId, `${member.userName}，服務帳號需要修正`).catch(console.error)
    if (convId) sendActionMessage(convId, {
      actionType: 'request_service_resubmit',
      text: note,
      payload: { targetUserId: member.userId },
    }).catch(console.error)

    insertNotification({
      userId:  member.userId,
      type:    'service_info_issue',
      title:   '服務帳號需要修正',
      message: `團主在「${member.groupName ?? group?.serviceName ?? ''}」發現服務帳號問題，請前往修正。`,
      meta:    { groupId: member.groupId },
    }).catch(console.error)

    refreshGroups()
  }

  function handleReject(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app || app.status !== 'pending') return

    updateApplicationStatus(appId, 'rejected')
    // 申請人通知：只寫 DB，申請人刷新後才看到
    insertNotification({
      userId:  app.applicantId ?? app.userId,
      type:    'application_rejected',
      title:   '申請未通過',
      message: `很遺憾，你加入「${app.groupName ?? app.serviceName}」群組的申請未通過，你可以繼續探索其他群組。`,
      meta:    { groupId: app.groupId, applicationId: appId },
    }).catch(console.error)

    setManageData(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a),
    }))
    removeError(appId)
  }

  function removeError(id) {
    setErrors(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const groupHandlersMap = useMemo(
    () => Object.fromEntries(displayGroups.map(g => [g.id, {
      onViewGroup:   () => { refreshGroups(); setViewGroupId(g.id); setAutoOpenActivateGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false) },
      onViewHistory: () => setHistoryModalGroupId(g.id),
      onRenewal:     () => setRenewalModalGroupId(g.id),
    }])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayGroups],
  )

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
                {...groupHandlersMap[g.id]}
              />
            ))}
          </div>
        )}
      </div>

<GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenActivateGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false); refreshGroups() }}
        groupId={viewGroupId}
        onConfirmMember={handleConfirmMember}
        onReportPaymentIssue={handleReportPaymentIssue}
        onReportServiceInfoIssue={handleReportServiceInfoIssue}
        onActivate={handleActivate}
        onActivateGroup={handleActivateGroup}
        onRemoveMember={handleRemoveMember}
        onApprove={handleApprove}
        onReject={handleReject}
        errors={errors}
        autoOpenActivateGroup={autoOpenActivateGroup}
        autoOpenActivate={autoOpenActivate}
        onAutoOpenActivateDone={() => setAutoOpenActivate(false)}
        autoOpenApplications={autoOpenApplications}
        autoOpenBilling={autoOpenBilling}
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
