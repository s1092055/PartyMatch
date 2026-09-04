import { useEffect, useMemo, useState } from 'react'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useSubscriptionStore } from '../../../common/stores/useSubscriptionStore'
import { createGroupConversation, removeParticipantFromConversation, sendSystemMessage } from '../../../common/api/messagesApi'
import { toast } from '../../../common/utils/toast'
import { useConversationStore } from '../../../common/stores/useConversationStore'
import { isHistoryGroup } from '../../../common/utils/groupStatusDisplay'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'

const getGroupById     = (id)      => useGroupStore.getState().getById(id);
const getGroupsByHostId = (hostId) => useGroupStore.getState().getByHostId(hostId)
const lockGroup           = (id, sharedCredentials) => useGroupStore.getState().lockGroup(id, sharedCredentials)
const activateService     = (id)   => useGroupStore.getState().activateService(id)
const adjustBillingDate   = (id, payload) => useGroupStore.getState().adjustBillingDate(id, payload)
const startRenewalCycle = (id, renewingUserIds) => useGroupStore.getState().startRenewalCycle(id, renewingUserIds)
const endGroup         = (id)      => useGroupStore.getState().endGroup(id)

const getApplicationByUserAndGroup = (uid, gid)   => useApplicationStore.getState().getByUserAndGroup(uid, gid)
const getApplicationsByHostId      = (hid, grps)  => useApplicationStore.getState().getByHostId(hid, grps)
const updateApplicationStatus      = (id, status) => useApplicationStore.getState().updateStatus(id, status)

const getMembersByGroupId        = (gid)    => useMemberStore.getState().getByGroupId(gid)
const isUserGroupMember          = (uid, gid) => useMemberStore.getState().isMember(uid, gid)
const removeMember               = (id)     => useMemberStore.getState().remove(id)
const updateMember               = (id, p)  => useMemberStore.getState().update(id, p)

const getSubscriptionByUserAndGroup   = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)
const removeSubscription              = (id)     => useSubscriptionStore.getState().remove(id)

const addConversationOptimistic  = (conv)    => useConversationStore.getState().addConversationOptimistic(conv)
const getConvByGroupId           = (gid)     => useConversationStore.getState().getByGroupId(gid)

function warnIfCredentialsExposed(group, message) {
  if (group?.sharedCredentials && isSharedCredentialsMethod(getServiceById(group.serviceId)?.sharingMethod)) {
    // 固定 id：同一個群組短時間內連續觸發曝露警告時覆蓋同一則，不疊加
    toast(message, 'warning', { id: `pm-credentials-exposed-${group.id}`, persistent: true })
  }
}

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
  const groupsState        = useGroupStore(s => s.groups);
  const applicationsState  = useApplicationStore(s => s.applications)
  const membersState       = useMemberStore(s => s.members)

  const [hostData, setHostData] = useState(() => loadHostData(activeUser))
  const [errors, setErrors] = useState({})
  const [submittingIds, setSubmittingIds] = useState(new Set())

  const [viewGroupId, setViewGroupId]                     = useState(null)
  const [autoOpenLockGroup, setAutoOpenLockGroup] = useState(false)
  const [autoOpenActivate, setAutoOpenActivate]           = useState(false)
  const [autoOpenApplications, setAutoOpenApplications]   = useState(false)
  const [autoOpenBilling, setAutoOpenBilling]             = useState(false)
  const [autoOpenMemberInfo, setAutoOpenMemberInfo]       = useState(false)
  const [autoOpenMembers, setAutoOpenMembers]             = useState(false)
  const [renewalModalGroupId, setRenewalModalGroupId]     = useState(null)

  function applyOpenHostGroup({ groupId, openGroupId, openLockGroup, openActivate, openApplications, openBilling, openMemberInfo, openMembers }) {
    const gId = groupId ?? openGroupId
    if (!gId) return
    setViewGroupId(gId)
    setAutoOpenLockGroup(!!openLockGroup)
    setAutoOpenActivate(!!openActivate)
    setAutoOpenApplications(!!openApplications)
    setAutoOpenBilling(!!openBilling)
    setAutoOpenMemberInfo(!!openMemberInfo)
    setAutoOpenMembers(!!openMembers)
  }

  useEffect(() => {
    function onOpenHostGroup(e) { applyOpenHostGroup(e.detail ?? {}) }
    window.addEventListener('pm:open-host-group', onOpenHostGroup)
    return () => window.removeEventListener('pm:open-host-group', onOpenHostGroup)
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeUser) setHostData(loadHostData(activeUser))
  }, [activeUser, groupsState, applicationsState, membersState]);


  const { hostedGroups, applications, members, seatMap } = hostData

  const allGroups = useMemo(
    () => hostedGroups.map(g => ({ ...g, ...(seatMap[g.id] ?? {}) })),
    [hostedGroups, seatMap],
  )

  const displayGroups = useMemo(
    () => allGroups.filter(g => !isHistoryGroup(g)),
    [allGroups],
  )

  const historyGroups = useMemo(
    () => allGroups.filter(isHistoryGroup),
    [allGroups],
  )

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

async function handleLockGroup(sharedCredentials) {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return
    const groupMembers = getMembersByGroupId(viewGroupId)

    try {
      const conv = await createGroupConversation({ groupId: viewGroupId });
      const convId = conv.id
      await lockGroup(viewGroupId, sharedCredentials)

      const participantMeta = {
        [group.hostId]: { name: group.hostName, avatarInitial: group.hostAvatarInitial, avatarColor: group.hostAvatarColor },
        ...Object.fromEntries(groupMembers.map(m => [m.userId, { name: m.userName, avatarInitial: m.userAvatarInitial, avatarColor: m.userAvatarColor }])),
      };
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
      if (err?.response?.status === 400 && group.status === 'full') {
        toast('有成員剛好退出，名額還沒滿，無法鎖定，請重新整理再試', 'info')
        useGroupStore.getState().refreshGroup(viewGroupId).catch(console.error)
        return
      }
      toast('鎖定群組失敗，請稍後再試', 'error')
    }
  }

function handleRemoveMember(member) {
    const group = getGroupById(member.groupId)
    // 回傳這個 promise 讓呼叫端（HostGroupView）可以在群組資料真的刷新完後，
    // 強制重新同步 header 快照——移除成員可能讓群組從 full 退回 recruiting，
    // 停留在群組名單分頁不切換的話，鎖定群組按鈕/banner 不會自己消失
    const removalDone = removeMember(member.id)
      .then(() => useGroupStore.getState().refreshGroup(member.groupId))
      .catch(console.error);
    const app = getApplicationByUserAndGroup(member.userId, member.groupId)
    if (app) updateApplicationStatus(app.id, 'removed')
    const sub = getSubscriptionByUserAndGroup(member.userId, member.groupId)
    if (sub) removeSubscription(sub.id)

    const convId = getConvByGroupId(member.groupId)?.id;
    if (convId) {
      sendSystemMessage(convId, `${member.userName} 已被移出群組`).catch(console.error)
      removeParticipantFromConversation(convId, member.userId).catch(console.error)
    }

    warnIfCredentialsExposed(group, '該成員已看過帳號密碼，建議盡快更改密碼避免帳號被繼續使用')

    return removalDone
  }

async function handleActivate() {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return

    try {
      await activateService(viewGroupId)
    } catch {
      toast('啟用失敗，請稍後再試', 'error')
      return
    }

    const activateConvId = getConvByGroupId(viewGroupId)?.id
    if (activateConvId) sendSystemMessage(
      activateConvId,
      `${group.serviceName} 服務已啟用！請在 48 小時內確認服務是否正常運作。`
    ).catch(console.error)

    setViewGroupId(null);
    refreshGroups()
  }

  async function handleAdjustBillingDate(nextBillingDate, note) {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return

    try {
      await adjustBillingDate(viewGroupId, { nextBillingDate, note })
    } catch (err) {
      toast('調整失敗，請稍後再試', 'error')
      throw err
    }

    const convId = getConvByGroupId(viewGroupId)?.id
    if (convId) sendSystemMessage(convId, `團主調整了下次扣款日，原因：${note}`).catch(console.error)

    toast('已調整下次扣款日')
    refreshGroups()
  }

  async function handleResolveDispute(groupId, memberId, note) {
    try {
      await useGroupStore.getState().resolveDispute(groupId, { memberId, note })
      toast('已標記問題處理完成')
    } catch {
      toast('處理失敗，請稍後再試', 'error')
    }
  }

  async function handleEscalateDispute(groupId, memberId, note) {
    try {
      await useGroupStore.getState().escalateDispute(groupId, { memberId, note })
      toast('已標記為不實回報，將由平台客服介入處理')
    } catch (err) {
      toast(err?.message ?? '處理失敗，請稍後再試', 'error')
    }
  }

  async function handleCancelGroup() {
    if (!viewGroupId) return
    const group = getGroupById(viewGroupId)
    if (!group) return

    try {
      await useGroupStore.getState().cancelGroup(viewGroupId)
    } catch {
      toast('解散失敗，請稍後再試', 'error')
      return
    }

    warnIfCredentialsExposed(group, '所有成員都已看過帳號密碼，建議盡快更改密碼避免帳號被繼續使用')

    setViewGroupId(null)
    refreshGroups()
  }

  async function handleStartRenewal(renewingUserIds) {
    if (!renewalModalGroupId) return
    try {
      await startRenewalCycle(renewalModalGroupId, renewingUserIds)
    } catch {
      toast('開始新一期失敗，請稍後再試', 'error')
      return
    }
    // 有成員這期不續訂的話，人數變動、Member 名單本身都變了（後端已直接移除該成員），
    // 不能只靠本地 clearGroupServiceInfos patch，改整批重抓成員資料確保跟後端一致
    await useMemberStore.getState().init().catch(console.error)
    const convId = getConvByGroupId(renewalModalGroupId)?.id
    if (convId) sendSystemMessage(
      convId, `新一期已開始，請重新填寫訂閱帳號資訊。`
    ).catch(console.error)
    setRenewalModalGroupId(null);
    refreshGroups()
  }

  function handleEndGroup() {
    if (!renewalModalGroupId) return
    const group = getGroupById(renewalModalGroupId)
    const groupLabel = group?.groupName ?? group?.serviceName ?? '群組'

    endGroup(renewalModalGroupId)

    const endConvId = getConvByGroupId(renewalModalGroupId)?.id;
    if (endConvId) sendSystemMessage(endConvId, `團主已結束「${groupLabel}」群組`).catch(console.error)

    warnIfCredentialsExposed(group, '所有成員都已看過帳號密碼，建議盡快更改密碼避免帳號被繼續使用')

    setRenewalModalGroupId(null)
    refreshGroups()
  }

async function handleApprove(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app) return
    if (app.status !== 'pending') {
      toast('此申請已被處理，請重新整理頁面', 'info')
      return
    }
    if (submittingIds.has(appId)) return

    const group = getGroupById(app.groupId) ?? allGroups.find(g => g.id === app.groupId)
    if (!group) {
      setErrors(prev => ({ ...prev, [appId]: '找不到群組資料，無法接受' }))
      return
    }

    const applicantId = app.applicantId ?? app.userId
    const alreadyMember = isUserGroupMember(applicantId, app.groupId)
    const seats = seatMap[app.groupId] ?? { usedSeats: group.usedSeats, openSeats: group.openSeats }
    if (!alreadyMember && (!seats || seats.openSeats <= 0)) {
      setErrors(prev => ({ ...prev, [appId]: '此群組已額滿，無法接受' }))
      return
    }

    setSubmittingIds(prev => new Set(prev).add(appId))
    try {
      await updateApplicationStatus(appId, 'approved')
    } catch (err) {
      console.error('[handleApprove] failed:', err)
      toast('接受失敗，請稍後再試', 'error');
      setErrors(prev => ({ ...prev, [appId]: '接受失敗，請稍後再試' }))
      await useApplicationStore.getState().init()
      return
    } finally {
      setSubmittingIds(prev => { const next = new Set(prev); next.delete(appId); return next })
    }
    await Promise.all([
      useMemberStore.getState().init(),
      useSubscriptionStore.getState().init(),
      useGroupStore.getState().refreshGroup(app.groupId),
    ])

    toast('已接受申請', 'success');

    setHostData(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a),
    }));
    removeError(appId)
  }

  function handleReportServiceInfoIssue(member, note, evidenceUrl) {
    updateMember(member.id, { serviceInfoIssueNote: note, serviceInfoIssueEvidenceUrl: evidenceUrl ?? null })
    refreshGroups();
  }

  async function handleReject(appId) {
    const app = applications.find(a => a.id === appId)
    if (!app) return
    if (app.status !== 'pending') {
      toast('此申請已被處理，請重新整理頁面', 'info')
      return
    }
    if (submittingIds.has(appId)) return

    setSubmittingIds(prev => new Set(prev).add(appId))
    try {
      await updateApplicationStatus(appId, 'rejected')
    } catch (err) {
      console.error('[handleReject] failed:', err)
      toast('拒絕失敗，請稍後再試', 'error');
      setErrors(prev => ({ ...prev, [appId]: '拒絕失敗，請稍後再試' }))
      await useApplicationStore.getState().init()
      return
    } finally {
      setSubmittingIds(prev => { const next = new Set(prev); next.delete(appId); return next })
    }

    useGroupStore.getState().refreshGroup(app.groupId).catch(console.error);

    toast('已拒絕申請', 'success');

    setHostData(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a),
    }));
    removeError(appId)
  }

  function removeError(id) {
    setErrors(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const groupHandlersMap = useMemo(
    () => Object.fromEntries(displayGroups.map(g => [g.id, {
      onViewGroup:   () => {
        refreshGroups()
        // 打開群組 Modal 統一走事件，不管是列表點卡片還是通知/toast 觸發，
        // 都由全站掛載的 HostGroupModalHost 接手，這裡不用管 Modal 實際掛在哪裡
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: g.id } }))
      },
    }])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayGroups],
  )

  return {
    errors,
    submittingIds,
    viewGroupId, setViewGroupId,
    autoOpenLockGroup, setAutoOpenLockGroup,
    autoOpenActivate, setAutoOpenActivate,
    autoOpenApplications, setAutoOpenApplications,
    autoOpenBilling, setAutoOpenBilling,
    autoOpenMemberInfo, setAutoOpenMemberInfo,
    autoOpenMembers, setAutoOpenMembers,
    renewalModalGroupId, setRenewalModalGroupId,
    allGroups, displayGroups, historyGroups, membersMap, applicationCounts,
    renewalModalGroup,
    groupHandlersMap,
    refreshGroups,
    handleLockGroup,
    handleRemoveMember,
    handleActivate,
    handleAdjustBillingDate,
    handleCancelGroup,
    handleStartRenewal,
    handleEndGroup,
    handleApprove,
    handleReportServiceInfoIssue,
    handleResolveDispute,
    handleEscalateDispute,
    handleReject,
  }
}
