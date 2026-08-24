import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Archive, ClipboardList } from 'lucide-react'
import { useSubscriptionStore } from '../../common/stores/useSubscriptionStore'
import { useMemberStore } from '../../common/stores/useMemberStore'
import { useApplicationStore } from '../../common/stores/useApplicationStore'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { finalizeLeaveGroup } from '../group/utils/leaveGroupFlow'
import SubscriptionCard from './components/SubscriptionCard'
import EmptyState from '../../components/ui/primitives/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import GroupViewModal from '../../components/ui/group/GroupViewModal'
import { StatCell, StatCellGrid } from '../../components/ui/group/StatCellGrid'
import TokenAmount from '../../components/ui/TokenAmount'
import FilterTabsBar from '../../components/ui/FilterTabsBar'
import ServiceLogo from '../../components/ui/ServiceLogo'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import RevealSection from '../../components/ui/primitives/RevealSection'
import { toISODate } from '../../common/utils/date'
import { calcDisplayPrice, calcDisplayCycle } from '../../common/utils/pricingUtils'
import { FILTER_TABS, subscriptionBucket } from './utils/memberFilters'
import { isHistorySubscription } from '../../common/utils/groupStatusDisplay'
import GroupHistoryModal from '../../components/ui/group/GroupHistoryModal'

const getGroupById = (id) => useGroupStore.getState().getById(id)

function enrichSubs(rawSubs, userId) {
  const myMemberByGroupId = new Map(
    useMemberStore.getState().members.filter(m => m.userId === userId).map(m => [m.groupId, m])
  )
  return rawSubs.map(s => {
    const group = getGroupById(s.groupId)
    const member = myMemberByGroupId.get(s.groupId)
    if (!group) {
      return {
        ...s,
        groupStatus:          s.groupStatus ?? s.status,
        confirmedAt:          member?.confirmedAt ?? null,
        serviceInfo:          member?.serviceInfo ?? null,
        serviceInfoIssueNote: member?.serviceInfoIssueNote ?? null,
      }
    }
    return {
      ...s,
      groupStatus:       group.status,
      confirmedAt:       member?.confirmedAt ?? null,
      serviceInfo:          member?.serviceInfo ?? null,
      serviceInfoIssueNote: member?.serviceInfoIssueNote ?? null,
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

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const [historyOpen, setHistoryOpen] = useState(false)
  const closeHistory = () => setHistoryOpen(false)
  const location = useLocation()
  const activeUser = useAuthStore(s => s.user)
  const activeUserId = activeUser?.id ?? null
  const subscriptionsState = useSubscriptionStore(s => s.subscriptions);
  const groupsState        = useGroupStore(s => s.groups)
  const applicationsState  = useApplicationStore(s => s.applications)
  const [activeTab, setActiveTab] = useState(() => location.state?.tab ?? 'recruiting')
  const membersState = useMemberStore(s => s.members)
  const subs = useMemo(
    () => activeUserId
      ? enrichSubs(subscriptionsState.filter(s => s.userId === activeUserId), activeUserId)
      : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeUserId, subscriptionsState, groupsState, membersState],
  )
  const [viewGroupId, setViewGroupId] = useState(null)
  const [autoOpenPayment, setAutoOpenPayment] = useState(false)
  const [autoOpenCredentials, setAutoOpenCredentials] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location.state?.tab) setActiveTab(location.state.tab)
    if (location.state?.openGroupId) {
      setViewGroupId(location.state.openGroupId)
      setAutoOpenPayment(!!location.state.openPayment)
      setAutoOpenCredentials(!!location.state.openCredentials)
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

    finalizeLeaveGroup(
      viewGroupId,
      { id: activeUser.id, name: activeUser.displayName ?? activeUser.name ?? '成員' },
    ).catch(console.error);

    setViewGroupId(null)
    setAutoOpenPayment(false)
  }

  const filtered = useMemo(
    () => filterSubs(subs, activeTab),
    [subs, activeTab],
  )

  const onViewGroup = useCallback(sub => setViewGroupId(sub.groupId), [])

  return (
    <div className="px-2 md:px-4">
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div />
        <h1 className="page-title mb-0 text-center">我的訂閱</h1>
        <Button
          variant="ghost"
          onClick={() => setHistoryOpen(true)}
          aria-label="群組紀錄"
          className="h-9 shrink-0 justify-self-end rounded-lg border border-line px-3"
        >
          <Archive size={14} strokeWidth={1.5} />
          群組紀錄
        </Button>
      </div>
      <FilterTabsBar
        tabs={FILTER_TABS}
        value={activeTab}
        onChange={setActiveTab}
        counts={filterCounts}
      />
      <div className="min-w-0">
        {(() => {
          const showApplications = activeTab === 'processing'
          const visibleApplications = showApplications ? pendingApplications : []
          const isEmpty = visibleApplications.length === 0 && filtered.length === 0
          const hasNoGroupsAtAll = subs.filter(s => !isHistorySubscription(s)).length === 0 && pendingApplications.length === 0;

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
            <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 xl:grid-cols-3">
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
          )
        })()}
      </div>
      <GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenPayment(false); setAutoOpenCredentials(false) }}
        groupId={viewGroupId}
        autoOpenPayment={autoOpenPayment}
        autoOpenCredentials={autoOpenCredentials}
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
  );
}

function ApplicationCard({ app, group, onViewGroup }) {
  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={onViewGroup}
    >
      <div className="flex justify-center">
        <StatusBadge status="pending" label="團主審核中" />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={app.serviceId} size={80} className="border-line-strong" />
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

      <StatCellGrid>
        <StatCell label="團主">{app.hostName ?? '—'}</StatCell>
        <StatCell label="群組狀態" highlight="text-warning-text">審核中</StatCell>
        <StatCell label="申請日期">{toISODate(app.createdAt)}</StatCell>
      </StatCellGrid>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); onViewGroup?.() }} className="w-full">
          查看群組
        </Button>
      </div>
    </Card>
  )
}
