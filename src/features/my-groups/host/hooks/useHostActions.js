import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useGroupStore } from '../../../../shared/stores/useGroupStore'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { CREDIT_RULES } from '../../../../shared/utils/creditScore'
import { useApplicationStore } from '../../../../shared/stores/useApplicationStore'
import { useMemberStore } from '../../../../shared/stores/useMemberStore'
import { useSubscriptionStore } from '../../../../shared/stores/useSubscriptionStore'
import { useNotificationStore } from '../../../../shared/stores/useNotificationStore'
import { createGroupConversation, removeParticipantFromConversation, sendSystemMessage, sendActionMessage } from '../../../../shared/api/messagesApi'
import { toast } from '../../../../shared/utils/toast'
import { insertNotification } from '../../../../shared/api/notificationsApi'
import { useConversationStore } from '../../../../shared/stores/useConversationStore'
import { isHistoryGroup } from '../../../../shared/utils/groupStatusDisplay'
import { STATUS_FILTER_TABS, matchesFilter, calcApprovalSeatPatch } from '../utils/hostFilters'

// ── store 操作的精簡別名（事件處理器內呼叫，讀取最新 store 狀態）─────────────
const getGroupById     = (id)      => useGroupStore.getState().getById(id)
const getGroupsByHostId = (hostId) => useGroupStore.getState().getByHostId(hostId)
const updateGroup      = (id, p)   => useGroupStore.getState().update(id, p)
const lockGroup           = (id)   => useGroupStore.getState().lockGroup(id)
const activateService     = (id)   => useGroupStore.getState().activateService(id)
const startRenewalCycle = (id)     => useGroupStore.getState().startRenewalCycle(id)
const endGroup         = (id)      => useGroupStore.getState().endGroup(id)

const adjustCreditScore = (uid, d) => useAuthStore.getState().adjustCreditScore(uid, d)

const getApplicationByUserAndGroup = (uid, gid)   => useApplicationStore.getState().getByUserAndGroup(uid, gid)
const getApplicationsByHostId      = (hid, grps)  => useApplicationStore.getState().getByHostId(hid, grps)
const updateApplicationStatus      = (id, status) => useApplicationStore.getState().updateStatus(id, status)

const getMembersByGroupId        = (gid)    => useMemberStore.getState().getByGroupId(gid)
const isUserGroupMember          = (uid, gid) => useMemberStore.getState().isMember(uid, gid)
const removeMember               = (id)     => useMemberStore.getState().remove(id)
const updateMember               = (id, p)  => useMemberStore.getState().update(id, p)
const clearMemberServiceInfos    = (gid)    => useMemberStore.getState().clearGroupServiceInfos(gid)

const getSubscriptionByUserAndGroup   = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)
const removeSubscription              = (id)     => useSubscriptionStore.getState().remove(id)

const createNotification         = (data)    => useNotificationStore.getState().create(data)
const addConversationOptimistic  = (conv)    => useConversationStore.getState().addConversationOptimistic(conv)
const getConvByGroupId           = (gid)     => useConversationStore.getState().getByGroupId(gid)

function loadHostData(activeUser) {
  if (!activeUser) return { hostedGroups: [], applications: [], members: [], seatMap: {} }
  const hostedGroups = getGroupsByHostId(activeUser.id)
  const applications = getApplicationsByHostId(activeUser.id, hostedGroups)
  const members      = hostedGroups.flatMap(g => getMembersByGroupId(g.id))
  const seatMap      = Object.fromEntries(
    hostedGroups.map(g => [g.id, { usedSeats: g.usedSeats, openSeats: g.openSeats }])
  )
  return { hostedGroups, applications, members, seatMap }
}

export function useHostActions(activeUser) {
  const location = useLocation()

  // 訂閱 store 切片，群組/申請/成員更新時觸發 hostData 重新載入
  const groupsState        = useGroupStore(s => s.groups)
  const applicationsState  = useApplicationStore(s => s.applications)
  const membersState       = useMemberStore(s => s.members)

  const [hostData, setHostData] = useState(() => loadHostData(activeUser))
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('recruiting')

  const [viewGroupId, setViewGroupId]                     = useState(null)
  const [autoOpenLockGroup, setAutoOpenLockGroup] = useState(false)
  const [autoOpenActivate, setAutoOpenActivate]           = useState(false)
  const [autoOpenApplications, setAutoOpenApplications]   = useState(false)
  const [autoOpenBilling, setAutoOpenBilling]             = useState(false)
  const [renewalModalGroupId, setRenewalModalGroupId]     = useState(null)

  function applyOpenHostGroup({ groupId, openGroupId, statusFilter: selectedStatusFilter, openLockGroup, openActivate, openApplications, openBilling }) {
    const gId = groupId ?? openGroupId
    if (!gId) return
    if (selectedStatusFilter) {
      setStatusFilter(selectedStatusFilter)
    } else {
      // 沒有明確指定篩選分類時（例如從通知深連結開啟），依群組目前狀態自動切到對應分類，
      // 不然關閉 modal 後背景列表可能因為篩選條件對不上而讓這個群組憑空消失；直接讀 store
      // 目前值（而不是閉包捕捉的 allGroups），避免掛載時的 effect 用到過期資料
      const targetGroup = getGroupById(gId)
      const matchedTab = targetGroup && STATUS_FILTER_TABS.find(tab => matchesFilter(targetGroup, tab.key))
      if (matchedTab) setStatusFilter(matchedTab.key)
    }
    setViewGroupId(gId)
    setAutoOpenLockGroup(!!openLockGroup)
    setAutoOpenActivate(!!openActivate)
    setAutoOpenApplications(!!openApplications)
    setAutoOpenBilling(!!openBilling)
  }

  // 跨頁面：從 location.state 讀（HostPage 剛掛載時）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location.state?.openGroupId) applyOpenHostGroup(location.state)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 同頁面：custom event（HostPage 已掛載，event 直接接到）
  useEffect(() => {
    function onOpenHostGroup(e) { applyOpenHostGroup(e.detail ?? {}) }
    window.addEventListener('pm:open-host-group', onOpenHostGroup)
    return () => window.removeEventListener('pm:open-host-group', onOpenHostGroup)
  }, [])

  // store 切片變動時重新載入 hostData（取代舊的 pm:*-changed 事件）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeUser) setHostData(loadHostData(activeUser))
  }, [activeUser, groupsState, applicationsState, membersState])


  const { hostedGroups, applications, members, seatMap } = hostData

  const allGroups = useMemo(
    () => hostedGroups.map(g => ({ ...g, ...(seatMap[g.id] ?? {}) })),
    [hostedGroups, seatMap],
  )

  const displayGroups = useMemo(
    () => allGroups.filter(g => matchesFilter(g, statusFilter)),
    [allGroups, statusFilter],
  )

  const historyGroups = useMemo(
    () => allGroups.filter(isHistoryGroup),
    [allGroups],
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


  const getModalGroup = id => id ? allGroups.find(g => g.id === id) : null
  const renewalModalGroup = getModalGroup(renewalModalGroupId)

  function refreshGroups() {
    setHostData(prev => ({ ...prev, hostedGroups: getGroupsByHostId(activeUser.id) }))
  }

async function handleLockGroup() {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return
    const groupMembers = getMembersByGroupId(viewGroupId)

    try {
      // 先建立聊天室（後端 POST /conversations/group 已包含所有成員），再鎖定群組狀態
      const conv = await createGroupConversation({ groupId: viewGroupId })
      const convId = conv.id
      await lockGroup(viewGroupId)

      await sendActionMessage(convId, {
        text: `請填寫你在 ${group.serviceName} 的服務帳號資訊，以便團主幫你設定訂閱。`,
        actionType: 'fill_service_info',
        payload: { serviceName: group.serviceName, serviceId: group.serviceId },
      })
      // 通知團主自己
      createNotification({
        userId:  group.hostId,
        type:    'group_chat_opened',
        title:   '群組聊天室已開啟',
        message: `「${group.serviceName}」群組已鎖定，聊天室已建立，點擊查看。`,
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
    } catch (err) {
      toast(err?.message ?? '鎖定群組失敗，請稍後再試', 'error')
    }
  }

function handleRemoveMember(member) {
    const group = getGroupById(member.groupId)
    adjustCreditScore(member.userId, CREDIT_RULES.MEMBER_REMOVED).catch(console.error)
    removeMember(member.id)
    const app = getApplicationByUserAndGroup(member.userId, member.groupId)
    if (app) updateApplicationStatus(app.id, 'removed')
    const sub = getSubscriptionByUserAndGroup(member.userId, member.groupId)
    if (sub) removeSubscription(sub.id)
    const seats = seatMap[member.groupId] ?? (group ? { usedSeats: group.usedSeats, openSeats: group.openSeats } : null)
    const newUsed = seats ? Math.max(0, seats.usedSeats - 1) : undefined
    const newOpen = seats ? seats.openSeats + 1 : undefined
    const statusPatch = group?.status === 'full' ? { status: 'recruiting' } : {}
    const seatPatch = newUsed !== undefined ? { usedSeats: newUsed, openSeats: newOpen, ...statusPatch } : statusPatch
    updateGroup(member.groupId, seatPatch)
    setHostData(prev => ({
      ...prev,
      members: prev.hostedGroups.flatMap(g => getMembersByGroupId(g.id)),
      ...(newUsed !== undefined && {
        seatMap: { ...prev.seatMap, [member.groupId]: { usedSeats: newUsed, openSeats: newOpen } },
      }),
    }))

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

async function handleActivate() {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return
    const groupMembers = getMembersByGroupId(viewGroupId)

    try {
      await activateService(viewGroupId)
    } catch (err) {
      toast(err?.message ?? '啟用失敗，請稍後再試', 'error')
      return
    }

    const activateConvId = getConvByGroupId(viewGroupId)?.id
    if (activateConvId) sendSystemMessage(
      activateConvId,
      `${group.serviceName} 服務已啟用！請在 48 小時內確認服務是否正常運作。`
    ).catch(console.error)

    createNotification({
      userId:  activeUser.id,
      type:    'group_activated',
      title:   '服務已啟用，確認期開始',
      message: `「${group.serviceName}」群組服務已啟用，成員有 48 小時確認期。`,
      meta:    { groupId: viewGroupId },
    })
    groupMembers.forEach(m => {
      insertNotification({
        userId:  m.userId,
        type:    'group_activated',
        title:   '服務已啟用，請確認',
        message: `「${group.serviceName}」服務已啟用！請在 48 小時內確認服務是否正常，否則將自動完成。`,
        meta:    { groupId: viewGroupId },
      }).catch(console.error)
    })

    setViewGroupId(null)
    refreshGroups()
  }

  async function handleCancelGroup() {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return
    const groupMembers = getMembersByGroupId(viewGroupId)

    try {
      await useGroupStore.getState().cancelGroup(viewGroupId)
    } catch (err) {
      toast(err?.message ?? '解散失敗，請稍後再試', 'error')
      return
    }

    // 通知所有成員
    groupMembers.forEach(m => {
      insertNotification({
        userId:  m.userId,
        type:    'group_cancelled',
        title:   '群組已解散',
        message: `「${group.serviceName}」群組已被團主解散，代管費用已退還至你的PM幣餘額。`,
        meta:    { groupId: viewGroupId },
      }).catch(console.error)
    })

    setViewGroupId(null)
    refreshGroups()
  }

  async function handleStartRenewal() {
    if (!renewalModalGroupId) return
    const group = getGroupById(renewalModalGroupId)
    const groupMembers = getMembersByGroupId(renewalModalGroupId)
    try {
      await startRenewalCycle(renewalModalGroupId)
    } catch (err) {
      toast(err?.message ?? '開始新一期失敗，請稍後再試', 'error')
      return
    }
    clearMemberServiceInfos(renewalModalGroupId)
    const convId = getConvByGroupId(renewalModalGroupId)?.id
    if (convId) sendSystemMessage(
      convId, `新一期已開始，請重新填寫訂閱帳號資訊。`
    ).catch(console.error)
    groupMembers.forEach(m => {
      insertNotification({
        userId:  m.userId,
        type:    'group_renewal',
        title:   '新一期已開始',
        message: `「${group?.serviceName}」群組開始新一期，請前往填寫最新服務帳號資訊。`,
        meta:    { groupId: renewalModalGroupId },
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
        meta:    { groupId: renewalModalGroupId },
      }).catch(console.error)
    })
    const endConvId = getConvByGroupId(renewalModalGroupId)?.id
    if (endConvId) sendSystemMessage(endConvId, `團主已結束「${groupLabel}」群組`).catch(console.error)

    setRenewalModalGroupId(null)
    refreshGroups()
  }

async function handleApprove(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app || app.status !== 'pending') return

    const group = getGroupById(app.groupId) ?? allGroups.find(g => g.id === app.groupId)
    if (!group) {
      setErrors(prev => ({ ...prev, [appId]: '找不到群組資料，無法核准' }))
      return
    }

    const applicantId = app.applicantId ?? app.userId
    const alreadyMember = isUserGroupMember(applicantId, app.groupId)
    const seats = seatMap[app.groupId] ?? { usedSeats: group.usedSeats, openSeats: group.openSeats }
    if (!alreadyMember && (!seats || seats.openSeats <= 0)) {
      setErrors(prev => ({ ...prev, [appId]: '此群組已額滿，無法核准' }))
      return
    }

    // 等後端 transaction 完成（在 DB 建立 member + subscription）再 init，確保 store 持有真實 DB ID
    try {
      await updateApplicationStatus(appId, 'approved')
    } catch (err) {
      console.error('[handleApprove] failed:', err)
      setErrors(prev => ({ ...prev, [appId]: '核准失敗，請重試' }))
      await useApplicationStore.getState().init()
      return
    }
    await Promise.all([
      useMemberStore.getState().init(),
      useSubscriptionStore.getState().init(),
    ])

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
        message: `「${app.groupName ?? app.serviceName}」群組名額已滿，可以點擊鎖定群組了。`,
        meta:    { groupId: app.groupId },
      })
    }

    setHostData(prev => {
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
      payload: { targetUserId: member.userId, serviceId: group?.serviceId },
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

  async function handleReject(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app || app.status !== 'pending') return

    try {
      await updateApplicationStatus(appId, 'rejected')
    } catch (err) {
      console.error('[handleReject] failed:', err)
      setErrors(prev => ({ ...prev, [appId]: '拒絕失敗，請重試' }))
      return
    }

    // 申請人通知：只寫 DB，申請人刷新後才看到
    insertNotification({
      userId:  app.applicantId ?? app.userId,
      type:    'application_rejected',
      title:   '申請未通過',
      message: `很遺憾，你加入「${app.groupName ?? app.serviceName}」群組的申請未通過，你可以繼續探索其他群組。`,
      meta:    { groupId: app.groupId, applicationId: appId },
    }).catch(console.error)

    setHostData(prev => ({
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
      onViewGroup:   () => { refreshGroups(); setViewGroupId(g.id); setAutoOpenLockGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false) },
    }])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayGroups],
  )

  return {
    errors,
    statusFilter, setStatusFilter,
    viewGroupId, setViewGroupId,
    autoOpenLockGroup, setAutoOpenLockGroup,
    autoOpenActivate, setAutoOpenActivate,
    autoOpenApplications, setAutoOpenApplications,
    autoOpenBilling, setAutoOpenBilling,
    renewalModalGroupId, setRenewalModalGroupId,
    allGroups, displayGroups, historyGroups, filterCounts, membersMap, applicationCounts,
    renewalModalGroup,
    groupHandlersMap,
    refreshGroups,
    handleLockGroup,
    handleRemoveMember,
    handleActivate,
    handleCancelGroup,
    handleStartRenewal,
    handleEndGroup,
    handleApprove,
    handleReportServiceInfoIssue,
    handleReject,
  }
}
