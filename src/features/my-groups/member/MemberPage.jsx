import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useSubscriptionStore } from '../../../shared/stores/useSubscriptionStore'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { useNotificationStore } from '../../../shared/stores/useNotificationStore'
import { useApplicationStore } from '../../../shared/stores/useApplicationStore'
import { useGroupStore } from '../../../shared/stores/useGroupStore'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { useConversationStore } from '../../../shared/stores/useConversationStore'
import { sendSystemMessage } from '../../../shared/api/messagesApi'
import { insertNotification } from '../../../shared/api/notificationsApi'
import SubscriptionCard from './components/SubscriptionCard'

const getGroupById = (id) => useGroupStore.getState().getById(id)
import EmptyState from '../../../shared/ui/EmptyState'
import GroupViewModal from '../../../shared/ui/GroupViewModal'
import TokenAmount from '../../../shared/ui/TokenAmount'
import FilterTabsBar from '../../../shared/ui/FilterTabsBar'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import Button from '../../../shared/ui/Button'
import RevealSection from '../../../shared/ui/RevealSection'
import ScrollHint from '../../../shared/ui/ScrollHint'
import { formatRelativeDate } from '../../../shared/utils/date'
import { useScrollEdge } from '../../../shared/utils/hooks'
import { isEffectivelyActive } from '../../../shared/utils/groupStatus'

import { FILTER_TABS } from './utils/memberFilters'

function enrichSubs(rawSubs, userId) {
  const myMemberByGroupId = new Map(
    useMemberStore.getState().members.filter(m => m.userId === userId).map(m => [m.groupId, m])
  )
  return rawSubs.map(s => {
    const group = getGroupById(s.groupId)
    const member = myMemberByGroupId.get(s.groupId)
    if (!group) return { ...s, groupStatus: s.groupStatus ?? s.status, confirmedAt: member?.confirmedAt ?? null }
    return {
      ...s,
      groupStatus:       group.status,
      confirmedAt:       member?.confirmedAt ?? null,
      serviceName:       s.serviceName  || group.serviceName,
      serviceId:         s.serviceId    || group.serviceId,
      planName:          s.planName     || group.planName,
      pricePerSeat:      s.pricePerSeat || group.pricePerSeat,
      billingCycle:      s.billingCycle || group.billingCycle,
      hostName:          s.hostName     || group.hostName,
      hostAvatarInitial: s.hostAvatarInitial || group.hostAvatarInitial,
      hostAvatarColor:   s.hostAvatarColor   || group.hostAvatarColor,
      usedSeats:         group.usedSeats,
      totalSeats:        group.totalSeats,
    }
  })
}

function isActivatedSubscription(sub) {
  return isEffectivelyActive(sub.groupStatus ?? sub.status, sub.confirmedAt)
}

function isProcessingSubscription(sub) {
  if (isActivatedSubscription(sub)) return false
  const groupStatus = sub.groupStatus ?? sub.status
  return !['cancelled', 'ended'].includes(groupStatus)
}

const ENDED_STATUSES = new Set(['paused', 'cancelled', 'ended'])

function filterSubs(subs, tab) {
  switch (tab) {
    case 'processing': return subs.filter(isProcessingSubscription)
    case 'active':     return subs.filter(isActivatedSubscription)
    case 'ended':      return subs.filter(s => ENDED_STATUSES.has(s.groupStatus ?? s.status))
    default:           return subs
  }
}

export default function MemberPage({ embedded = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeUser = useAuthStore(s => s.user)
  const activeUserId = activeUser?.id ?? null
  // 訂閱 store 切片，訂閱/群組/申請更新時自動重算
  const subscriptionsState = useSubscriptionStore(s => s.subscriptions)
  const groupsState        = useGroupStore(s => s.groups)
  const applicationsState  = useApplicationStore(s => s.applications)
  const { scrollRef: listScrollRef, canScroll: listCanScroll, atBottom: listAtBottom, isScrolling: listIsScrolling, handleScroll: handleListScroll } = useScrollEdge()
  const [activeTab, setActiveTab] = useState(() => location.state?.tab ?? 'all')
  const membersState = useMemberStore(s => s.members)
  const subs = useMemo(
    () => activeUserId
      ? enrichSubs(subscriptionsState.filter(s => s.userId === activeUserId), activeUserId)
      : [],
    // groupsState/membersState 為刻意依賴：enrichSubs 讀取群組狀態與成員確認狀態，兩者更新時需重算
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeUserId, subscriptionsState, groupsState, membersState],
  )
  const [viewGroupId, setViewGroupId] = useState(null)
  const [autoOpenPayment, setAutoOpenPayment] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location.state?.tab) setActiveTab(location.state.tab)
    if (location.state?.openGroupId) {
      setViewGroupId(location.state.openGroupId)
      setAutoOpenPayment(!!location.state.openPayment)
    }
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onSetTab(e) { if (e.detail?.tab) setActiveTab(e.detail.tab) }
    window.addEventListener('pm:set-sub-tab', onSetTab)
    return () => window.removeEventListener('pm:set-sub-tab', onSetTab)
  }, [])

  const pendingApplications = useMemo(
    () => activeUserId
      ? applicationsState.filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending')
      : [],
    [activeUserId, applicationsState],
  )

  const filterCounts = useMemo(() => ({
    all:        subs.length + pendingApplications.length,
    processing: filterSubs(subs, 'processing').length + pendingApplications.length,
    active:     filterSubs(subs, 'active').length,
    ended:      filterSubs(subs, 'ended').length,
  }), [subs, pendingApplications])

  function handleLeaveGroup() {
    if (!viewGroupId || !activeUser) return
    const group  = getGroupById(viewGroupId)
    const member = useMemberStore.getState().getByUserAndGroup(activeUser.id, viewGroupId)
    if (!member || !group) return

    useMemberStore.getState().remove(member.id)

    // 樂觀把 application 標為 left（後端 DELETE /members 已在 transaction 更新 DB）
    const appToRemove = useApplicationStore.getState().applications.find(
      a => a.groupId === viewGroupId && (a.applicantId ?? a.userId) === activeUser.id && a.status === 'approved'
    )
    if (appToRemove) {
      useApplicationStore.setState(s => ({
        applications: s.applications.map(a => a.id === appToRemove.id ? { ...a, status: 'left' } : a),
      }))
    }

    // 樂觀更新 group local state（後端 DELETE /members 同步更新 currentMembers 與 status）
    const newUsed = Math.max(0, group.usedSeats - 1)
    const newOpen = group.openSeats + 1
    const statusPatch = group.status === 'full' ? { status: 'recruiting' } : {}
    useGroupStore.setState(s => ({
      groups: s.groups.map(g => g.id === viewGroupId
        ? { ...g, usedSeats: newUsed, openSeats: newOpen, ...statusPatch }
        : g
      ),
    }))

    const sub = useSubscriptionStore.getState().getByUserId(activeUser.id).find(s => s.groupId === viewGroupId)
    if (sub) useSubscriptionStore.getState().remove(sub.id)

    useNotificationStore.getState().create({
      userId:  activeUser.id,
      type:    'member_left',
      title:   '已退出群組',
      message: `你已成功退出「${group.serviceName}」群組，名額已釋出。`,
    })

    if (group.hostId) {
      insertNotification({
        userId:  group.hostId,
        type:    'member_left',
        title:   '成員退出群組',
        message: `${activeUser.displayName ?? activeUser.name ?? '成員'} 已退出「${group.serviceName}」群組，目前剩餘 ${newOpen} 個名額。`,
        meta:    { groupId: viewGroupId },
      }).catch(console.error)
    }

    // 若群組聊天室已存在，寫系統訊息讓團主透過 polling 5 秒內看到
    const convId = useConversationStore.getState().getByGroupId(viewGroupId)?.id
    if (convId) {
      const memberName = activeUser.displayName ?? activeUser.name ?? '成員'
      sendSystemMessage(convId, `${memberName} 已退出群組`).catch(console.error)
    }

    setViewGroupId(null)
    setAutoOpenPayment(false)
  }

  const filtered = useMemo(
    () => filterSubs(subs, activeTab),
    [subs, activeTab],
  )

  const onViewGroup = useCallback(sub => setViewGroupId(sub.groupId), [])

  return (
    <div className="px-2 md:px-4 lg:px-16">
      {!embedded && (
        <div className="mb-6 text-center">
          <h1 className="page-title">我的訂閱</h1>
        </div>
      )}

      <div className="md:flex md:gap-6 lg:gap-8">
        <FilterTabsBar
          tabs={FILTER_TABS}
          value={activeTab}
          onChange={setActiveTab}
          counts={filterCounts}
        />

        <div className="group relative min-w-0 flex-1">
          {activeTab === 'processing' ? (
            <>
              {pendingApplications.length === 0 && filtered.length === 0 ? (
                <EmptyState icon={ClipboardList} title="此分類沒有訂閱項目" description="切換到其他分類查看" />
              ) : (
                <div
                  ref={listScrollRef}
                  onScroll={handleListScroll}
                  className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {pendingApplications.map((app, i) => {
                      const group = getGroupById(app.groupId)
                      if (!group) return null
                      return (
                        <RevealSection key={app.id} delay={i * 60}>
                          <ApplicationCard
                            app={app}
                            group={group}
                            onViewGroup={() => window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: app.groupId } }))}
                          />
                        </RevealSection>
                      )
                    })}
                    {filtered.map((sub, i) => (
                      <RevealSection key={sub.id} delay={(pendingApplications.length + i) * 60}>
                        <SubscriptionCard
                          sub={sub}
                          onViewGroup={onViewGroup}
                        />
                      </RevealSection>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : filtered.length === 0 && (activeTab !== 'all' || pendingApplications.length === 0) ? (
            <EmptyState
              icon={ClipboardList}
              title={activeTab === 'all' ? '你還沒有加入任何群組' : '此分類沒有訂閱項目'}
              description={activeTab === 'all' ? '去探索頁面找找適合你的共享群組' : '切換到其他分類查看'}
              actionLabel={activeTab === 'all' ? '探索群組' : undefined}
              onAction={activeTab === 'all' ? () => navigate('/explore') : undefined}
            />
          ) : (
            <div
              ref={listScrollRef}
              onScroll={handleListScroll}
              className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {activeTab === 'all' && pendingApplications.map((app, i) => {
                  const group = getGroupById(app.groupId)
                  if (!group) return null
                  return (
                    <RevealSection key={app.id} delay={i * 60}>
                      <ApplicationCard
                        app={app}
                        group={group}
                        onViewGroup={() => window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: app.groupId } }))}
                      />
                    </RevealSection>
                  )
                })}
                {filtered.map((sub, i) => (
                  <RevealSection key={sub.id} delay={(activeTab === 'all' ? pendingApplications.length + i : i) * 60}>
                    <SubscriptionCard
                      sub={sub}
                      onViewGroup={sub => setViewGroupId(sub.groupId)}
                    />
                  </RevealSection>
                ))}
              </div>
            </div>
          )}
          <ScrollHint canScroll={listCanScroll} atBottom={listAtBottom} isScrolling={listIsScrolling} />
        </div>
      </div>

<GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenPayment(false) }}
        groupId={viewGroupId}
        autoOpenPayment={autoOpenPayment}
        onLeaveGroup={handleLeaveGroup}
      />

    </div>
  )
}

function ApplicationCard({ app, group, onViewGroup }) {
  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)]"
      onClick={onViewGroup}
    >
      <div className="flex justify-center">
        <span className="rounded-full bg-warning-subtle px-3.5 py-1 text-sm font-extrabold text-warning-text">
          已申請
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={app.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{app.serviceName ?? app.groupName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{app.planName}</p>
        {group.pricePerSeat != null && (
          <p className="mt-1 text-base font-extrabold text-ink">
            <TokenAmount
              amount={group.billingCycle === 'yearly' ? group.pricePerSeat * 12 : group.pricePerSeat}
              cycle={group.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
            />
          </p>
        )}
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
          <span className="text-2xs font-bold text-ink-3">審核狀態</span>
          <span className="text-sm font-black leading-tight text-warning-text">審核中</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
          <span className="text-2xs font-bold text-ink-3">申請時間</span>
          <span className="text-sm font-black leading-tight text-ink">{formatRelativeDate(app.createdAt)}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
          <span className="text-2xs font-bold text-ink-3">團主</span>
          <span className="text-sm font-black leading-tight text-ink">{app.hostName ?? '—'}</span>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); onViewGroup?.() }} className="w-full">
          查看群組
        </Button>
      </div>
    </article>
  )
}

