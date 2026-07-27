import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useSubscriptionStore } from '../../../shared/stores/useSubscriptionStore'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { useApplicationStore } from '../../../shared/stores/useApplicationStore'
import { useGroupStore } from '../../../shared/stores/useGroupStore'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { finalizeLeaveGroup } from '../../group/utils/leaveGroupFlow'
import SubscriptionCard from './components/SubscriptionCard'
import EmptyState from '../../../shared/ui/primitives/EmptyState'
import Badge from '../../../shared/ui/primitives/Badge'
import GroupViewModal from '../../../shared/ui/group/GroupViewModal'
import TokenAmount from '../../../shared/ui/TokenAmount'
import FilterTabsBar from '../../../shared/ui/FilterTabsBar'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import Button from '../../../shared/ui/primitives/Button'
import RevealSection from '../../../shared/ui/primitives/RevealSection'
import ScrollHint from '../../../shared/ui/primitives/ScrollHint'
import { formatRelativeDate } from '../../../shared/utils/date'
import { useScrollEdge } from '../../../shared/utils/hooks'
import { calcDisplayPrice, calcDisplayCycle } from '../../../shared/utils/pricingUtils'
import { FILTER_TABS, subscriptionBucket } from './utils/memberFilters'
import { isHistorySubscription } from '../../../shared/utils/groupStatusDisplay'
import GroupHistoryModal from '../../../shared/ui/group/GroupHistoryModal'

const getGroupById = (id) => useGroupStore.getState().getById(id)

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

function filterSubs(subs, tab) {
  const nonHistory = subs.filter(s => !isHistorySubscription(s))
  return nonHistory.filter(s => subscriptionBucket(s) === tab)
}

// 只被 MyGroupsPage 掛載，「群組紀錄」開關固定由它控制
export default function MemberPage({ embedded = false, historyOpen, onCloseHistory: closeHistory }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeUser = useAuthStore(s => s.user)
  const activeUserId = activeUser?.id ?? null
  // 訂閱 store 切片，訂閱/群組/申請更新時自動重算
  const subscriptionsState = useSubscriptionStore(s => s.subscriptions)
  const groupsState        = useGroupStore(s => s.groups)
  const applicationsState  = useApplicationStore(s => s.applications)
  const { scrollRef: listScrollRef, canScroll: listCanScroll, atBottom: listAtBottom, isScrolling: listIsScrolling, handleScroll: handleListScroll } = useScrollEdge()
  const [activeTab, setActiveTab] = useState(() => location.state?.tab ?? 'recruiting')
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

  const pendingApplications = useMemo(
    () => activeUserId
      ? applicationsState.filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending')
      : [],
    [activeUserId, applicationsState],
  )

  const historySubs = useMemo(() => subs.filter(isHistorySubscription), [subs])

  const filterCounts = useMemo(() => Object.fromEntries(
    FILTER_TABS.map(({ key }) => [
      key,
      filterSubs(subs, key).length + (key === 'processing' ? pendingApplications.length : 0),
    ])
  ), [subs, pendingApplications])

  function handleLeaveGroup() {
    if (!viewGroupId || !activeUser) return
    const member = useMemberStore.getState().getByUserAndGroup(activeUser.id, viewGroupId)
    if (!member) return

    // 與 GroupDetailModal 共用同一套退出流程（含移出聊天室參與者），避免兩處邏輯各自維護、行為不一致
    finalizeLeaveGroup(
      viewGroupId,
      { id: activeUser.id, name: activeUser.displayName ?? activeUser.name ?? '成員' },
    ).catch(console.error)

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

      <FilterTabsBar
        tabs={FILTER_TABS}
        value={activeTab}
        onChange={setActiveTab}
        counts={filterCounts}
      />

      <div className="group relative min-w-0">
        {(() => {
          const showApplications = activeTab === 'processing'
          const visibleApplications = showApplications ? pendingApplications : []
          const isEmpty = visibleApplications.length === 0 && filtered.length === 0
          // 沒有「全部」分類了，用「不分分類、使用者整體是否一個群組都沒有」判斷要不要顯示探索 CTA
          const hasNoGroupsAtAll = subs.filter(s => !isHistorySubscription(s)).length === 0 && pendingApplications.length === 0

          if (isEmpty) {
            return (
              <EmptyState
                icon={ClipboardList}
                title={hasNoGroupsAtAll ? '你還沒有加入任何群組' : '此分類目前沒有項目'}
                description={hasNoGroupsAtAll ? '去探索頁面找找適合你的共享群組' : '切換到其他分類查看'}
                actionLabel={hasNoGroupsAtAll ? '探索群組' : undefined}
                onAction={hasNoGroupsAtAll ? () => navigate('/explore') : undefined}
              />
            )
          }

          return (
            <div
              ref={listScrollRef}
              onScroll={handleListScroll}
              className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-3">
                {visibleApplications.map((app, i) => {
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
                  <RevealSection key={sub.id} delay={(visibleApplications.length + i) * 60}>
                    <SubscriptionCard
                      sub={sub}
                      onViewGroup={onViewGroup}
                    />
                  </RevealSection>
                ))}
              </div>
            </div>
          )
        })()}
        <ScrollHint canScroll={listCanScroll} atBottom={listAtBottom} isScrolling={listIsScrolling} />
      </div>

      <GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenPayment(false) }}
        groupId={viewGroupId}
        autoOpenPayment={autoOpenPayment}
        onLeaveGroup={handleLeaveGroup}
      />

      <GroupHistoryModal
        isOpen={historyOpen}
        onClose={closeHistory}
        items={historySubs}
        emptyDescription="已結束或已取消的訂閱會顯示在這裡"
        renderItem={(sub, i) => (
          <RevealSection key={sub.id} delay={i * 60}>
            <SubscriptionCard
              sub={sub}
              onViewGroup={sub => { closeHistory(); setViewGroupId(sub.groupId) }}
            />
          </RevealSection>
        )}
      />

    </div>
  )
}

function ApplicationCard({ app, group, onViewGroup }) {
  return (
    <article
      className="card card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5"
      onClick={onViewGroup}
    >
      <div className="flex justify-center">
        <Badge variant="pending" label="已申請" />
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
              amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
              cycle={calcDisplayCycle(group.billingCycle)}
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

