import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Archive, ClipboardList } from 'lucide-react'
import { useSubscriptionStore } from '../../common/stores/useSubscriptionStore'
import { useMemberStore } from '../../common/stores/useMemberStore'
import { useApplicationStore } from '../../common/stores/useApplicationStore'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { useNotificationStore } from '../../common/stores/useNotificationStore'
import { usePendingRefreshStore } from '../../common/stores/usePendingRefreshStore'
import SubscriptionCard from './components/SubscriptionCard'
import EmptyState from '../../components/ui/primitives/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { getStatusLabel } from '../../components/ui/statusBadgeConfig'
import { StatCell, StatCellGrid } from '../../components/ui/group/StatCellGrid'
import TokenAmount from '../../components/ui/TokenAmount'
import ServiceLogo from '../../components/ui/ServiceLogo'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import RevealSection from '../../components/ui/primitives/RevealSection'
import { toISODate } from '../../common/utils/date'
import { calcDisplayPrice, calcDisplayCycle } from '../../common/utils/pricingUtils'
import { isHistorySubscription } from '../../common/utils/groupStatusDisplay'
import GroupHistoryModal from '../../components/ui/group/GroupHistoryModal'
import { useDeferWhileModalOpen, useGroupOpenLoading } from '../../common/utils/hooks'
import logoUrl from '../../assets/Logo.svg'

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

function filterSubs(subs) {
  return subs.filter(s => !isHistorySubscription(s))
}

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const [historyOpen, setHistoryOpen] = useState(false)
  const closeHistory = () => setHistoryOpen(false)
  const location = useLocation()
  const activeUser = useAuthStore(s => s.user)
  const activeUserId = activeUser?.id ?? null

  // 進入這個頁面就代表使用者看過「我的訂閱」相關的最新動態了，
  // 通知中心的紅點跟側邊欄紅點用同一套邏輯清除；也會反應在使用者
  // 停留在這頁時新進來的背景通知（unreadForPage 變動就會重新觸發）
  const unreadForPage = useNotificationStore(s => s.getUnreadCountForPage(activeUserId, '/my-subscriptions'))
  useEffect(() => {
    if (activeUserId && unreadForPage > 0) {
      useNotificationStore.getState().markReadForPage(activeUserId, '/my-subscriptions')
    }
  }, [activeUserId, unreadForPage])

  // toast「重新整理」只會悄悄換掉 store 資料，卡片不會重新掛載、slide-up
  // 動畫不會重播；用這個 tick 當 key 強制整批卡片重新掛載一次
  const refreshTick = usePendingRefreshStore(s => s.refreshTick)

  const subscriptionsState = useDeferWhileModalOpen(useSubscriptionStore(s => s.subscriptions));
  const groupsState        = useDeferWhileModalOpen(useGroupStore(s => s.groups))
  const applicationsState  = useDeferWhileModalOpen(useApplicationStore(s => s.applications))
  const membersState = useDeferWhileModalOpen(useMemberStore(s => s.members))
  const subs = useMemo(
    () => activeUserId
      ? enrichSubs(subscriptionsState.filter(s => s.userId === activeUserId), activeUserId)
      : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeUserId, subscriptionsState, groupsState, membersState],
  )
  useEffect(() => {
    if (location.state?.openGroupId) {
      window.dispatchEvent(new CustomEvent('pm:open-group', {
        detail: { groupId: location.state.openGroupId, openCredentials: !!location.state.openCredentials },
      }))
    }
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingApplications = useMemo(
    () => activeUserId
      ? applicationsState.filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending')
      : [],
    [activeUserId, applicationsState],
  )

  const historySubs = useMemo(() => subs.filter(isHistorySubscription), [subs])

  const filtered = useMemo(
    () => filterSubs(subs),
    [subs],
  )

  const onViewGroup = useCallback(
    sub => window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: sub.groupId } })),
    [],
  )

  // 從群組紀錄點進去查看的群組 Modal 關閉後，要能回到群組紀錄 Modal，
  // 而不是直接整個消失；用網址上的 ?group= 參數判斷該群組 Modal
  // 真的「已經開過、現在關閉了」，而不是點擊當下那個尚未開啟的狀態
  const historyReopenRef = useRef(null)
  useEffect(() => {
    const pending = historyReopenRef.current
    if (!pending) return
    const currentGroupId = new URLSearchParams(location.search).get('group')
    if (currentGroupId === pending.groupId) {
      pending.opened = true
      return
    }
    if (pending.opened && !currentGroupId) {
      historyReopenRef.current = null
      setHistoryOpen(true)
    }
  }, [location.search])

  return (
    <div className="px-2 md:px-4">
      <h1 className="page-title mb-6 text-center">我的訂閱</h1>

      <div className="fixed bottom-9 left-6 z-40 can-hover:lg:left-24">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label="群組紀錄"
          className="relative grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand lg:h-12 lg:w-12 dark:border-[#238EC7] dark:text-[#238EC7]"
        >
          <Archive className="size-6 lg:size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="min-w-0">
        {(() => {
          const isEmpty = pendingApplications.length === 0 && filtered.length === 0

          if (isEmpty) {
            return (
              <EmptyState
                icon={ClipboardList}
                title="你還沒有加入任何群組"
                description="去探索頁面找找適合你的共享群組"
                actionLabel="探索群組"
                onAction={() => navigate('/explore')}
              />
            )
          }

          return (
            <div key={refreshTick} className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 xl:grid-cols-3">
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
          )
        })()}
      </div>
      <GroupHistoryModal
        isOpen={historyOpen}
        onClose={closeHistory}
        items={historySubs}
        emptyDescription="已結束或已取消的訂閱會顯示在這裡"
        renderItem={(sub, i) => (
          <RevealSection key={sub.id} delay={i * 60}>
            <SubscriptionCard
              sub={sub}
              onViewGroup={sub => {
                historyReopenRef.current = { groupId: sub.groupId, opened: false }
                closeHistory()
                onViewGroup(sub)
              }}
            />
          </RevealSection>
        )}
      />
    </div>
  );
}

function ApplicationCard({ app, group, onViewGroup }) {
  const opening = useGroupOpenLoading(group.id)
  const isLastSeat = group.openSeats === 1
  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={() => { if (!opening) onViewGroup?.() }}
    >
      <div className="flex justify-center">
        <StatusBadge status="pending" label="審核中" />
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
        <StatCell label="剩餘名額">
          {group.totalSeats == null ? (
            '—'
          ) : group.openSeats <= 0 ? (
            <span className="text-ink-3">{getStatusLabel('full')}</span>
          ) : (
            <>
              <span className={isLastSeat ? 'text-warning-text' : 'text-success'}>{group.openSeats}</span>
              <span className="text-ink-4"> / {group.totalSeats}</span>
            </>
          )}
        </StatCell>
        <StatCell label="申請日期">{toISODate(app.createdAt)}</StatCell>
      </StatCellGrid>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); if (!opening) onViewGroup?.() }} disabled={opening} className="w-full">
          {opening ? <img src={logoUrl} alt="" className="h-5 w-5 animate-logo-bounce" /> : '查看群組'}
        </Button>
      </div>
    </Card>
  )
}
