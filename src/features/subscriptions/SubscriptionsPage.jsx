import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, ClipboardList, Clock, UserMinus, XCircle } from 'lucide-react'
import { getSubscriptionsByUserId, initSubscriptions, removeSubscription } from '../../shared/stores/subscriptionStore'
import { getMemberByUserAndGroup, initMembers, removeMember } from '../../shared/stores/memberStore'
import { createNotification } from '../../shared/stores/notificationStore'
import { getApplicationsByUserId, initApplications } from '../../shared/stores/applicationStore'
import { getGroupById, initLiveGroups, updateGroup } from '../../shared/stores/groupStore'
import { getCurrentUser } from '../../shared/stores/authStore'
import SubscriptionCard from './components/SubscriptionCard'
import EmptyState from '../../shared/ui/EmptyState'
import GroupViewModal from '../../shared/ui/GroupViewModal'
import FilterTabsBar from '../../shared/ui/FilterTabsBar'
import ServiceLogo from '../../shared/ui/ServiceLogo'
import Button from '../../shared/ui/Button'
import { daysUntil, formatRelativeDate } from '../../shared/utils/date'

const FILTER_TABS = [
  { key: 'all',          label: '全部'     },
  { key: 'processing',   label: '處理中'   },
  { key: 'active',       label: '啟用中'   },
  { key: 'upcoming',     label: '即將續訂' },
  { key: 'applications', label: '申請紀錄' },
]


function enrichSubs(rawSubs) {
  return rawSubs.map(s => {
    const group = getGroupById(s.groupId)
    return { ...s, groupStatus: group?.status ?? s.groupStatus ?? s.status }
  })
}

function isActivatedSubscription(sub) {
  return sub.status === 'active' || sub.groupStatus === 'active'
}

function isProcessingSubscription(sub) {
  if (isActivatedSubscription(sub)) return false
  const groupStatus = sub.groupStatus ?? sub.status
  return !['cancelled', 'ended'].includes(groupStatus)
}

function filterSubs(subs, tab) {
  switch (tab) {
    case 'processing': return subs.filter(isProcessingSubscription)
    case 'active':     return subs.filter(isActivatedSubscription)
    case 'upcoming':   return subs.filter(s => { const d = daysUntil(s.nextBillingDate); return isActivatedSubscription(s) && d >= 0 && d <= 7 })
    default:         return subs
  }
}

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeUser = getCurrentUser()
  const activeUserId = activeUser?.id ?? null
  const [activeTab, setActiveTab] = useState(() => location.state?.tab ?? 'all')
  const [subs, setSubs] = useState(() =>
    activeUserId ? enrichSubs(getSubscriptionsByUserId(activeUserId)) : []
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
  useEffect(() => {
    let cancelled = false

    function syncFromMemory() {
      if (cancelled) return
      setSubs(activeUserId ? enrichSubs(getSubscriptionsByUserId(activeUserId)) : [])
    }

    async function reloadFromSource() {
      if (!activeUserId) {
        syncFromMemory()
        return
      }
      initLiveGroups()
      try {
        await Promise.all([initSubscriptions(), initMembers(), initApplications()])
      } catch (error) {
        console.error(error)
      }
      syncFromMemory()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') reloadFromSource()
    }

    reloadFromSource()
    window.addEventListener('pm:subscriptions-changed', syncFromMemory)
    window.addEventListener('pm:applications-changed', syncFromMemory)
    window.addEventListener('pm:groups-changed', syncFromMemory)
    window.addEventListener('focus', reloadFromSource)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      cancelled = true
      window.removeEventListener('pm:subscriptions-changed', syncFromMemory)
      window.removeEventListener('pm:applications-changed', syncFromMemory)
      window.removeEventListener('pm:groups-changed', syncFromMemory)
      window.removeEventListener('focus', reloadFromSource)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeUserId])

  const userApplications   = activeUserId ? getApplicationsByUserId(activeUserId) : []
  const pendingApplications = userApplications.filter(a => a.status === 'pending')

  const filterCounts = {
    all:          subs.length + pendingApplications.length,
    processing:   filterSubs(subs, 'processing').length + pendingApplications.length,
    active:       filterSubs(subs, 'active').length,
    upcoming:     filterSubs(subs, 'upcoming').length,
    applications: userApplications.length,
  }

  function handleLeaveGroup() {
    if (!viewGroupId || !activeUser) return
    const group  = getGroupById(viewGroupId)
    const member = getMemberByUserAndGroup(activeUser.id, viewGroupId)
    if (!member || !group) return

    removeMember(member.id)

    const newUsed = Math.max(0, group.usedSeats - 1)
    const newOpen = group.openSeats + 1
    const statusPatch = group.status === 'full' ? { status: 'recruiting' } : {}
    updateGroup(viewGroupId, { usedSeats: newUsed, openSeats: newOpen, ...statusPatch })

    const sub = getSubscriptionsByUserId(activeUser.id).find(s => s.groupId === viewGroupId)
    if (sub) removeSubscription(sub.id)

    createNotification({
      userId:  activeUser.id,
      type:    'member_left',
      title:   '已退出群組',
      message: `你已成功退出「${group.serviceName}」群組，名額已釋出。`,
    })

    if (group.hostId) {
      createNotification({
        userId:  group.hostId,
        type:    'member_left',
        title:   '成員退出群組',
        message: `${activeUser.displayName ?? activeUser.name ?? '成員'} 已退出「${group.serviceName}」群組，目前剩餘 ${newOpen} 個名額。`,
        meta:    { groupId: viewGroupId },
      })
    }

    setViewGroupId(null)
    setAutoOpenPayment(false)
    setSubs(activeUserId ? enrichSubs(getSubscriptionsByUserId(activeUserId)) : [])
  }

  const filtered = useMemo(
    () => activeTab === 'applications' ? [] : filterSubs(subs, activeTab),
    [subs, activeTab],
  )

  const onViewGroup = useCallback(sub => setViewGroupId(sub.groupId), [])

  return (
    <div className="px-2 md:px-4 lg:px-16">
      <div className="mb-6 text-center">
        <h1 className="page-title">我的訂閱</h1>
      </div>

      <div>
        <FilterTabsBar
          tabs={FILTER_TABS}
          value={activeTab}
          onChange={setActiveTab}
          counts={filterCounts}
        />

        {activeTab === 'applications' ? (
          <div className="space-y-3">
            {userApplications.length === 0 ? (
              <EmptyState icon={ClipboardList} title="沒有申請紀錄" />
            ) : (
              userApplications.map(app => (
                <ApplicationRow key={app.id} app={app} />
              ))
            )}
          </div>
        ) : activeTab === 'processing' ? (
          <>
            {pendingApplications.length === 0 && filtered.length === 0 ? (
              <EmptyState icon={ClipboardList} title="此分類沒有訂閱項目" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pendingApplications.map(app => {
                  const group = getGroupById(app.groupId)
                  if (!group) return null
                  return (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      group={group}
                      onViewGroup={() => window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: app.groupId } }))}
                    />
                  )
                })}
                {filtered.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    onViewGroup={onViewGroup}
                  />
                ))}
              </div>
            )}
          </>
        ) : filtered.length === 0 && (activeTab !== 'all' || pendingApplications.length === 0) ? (
          <EmptyState
            icon={ClipboardList}
            title={activeTab === 'all' ? '你還沒有加入任何群組' : '此分類沒有訂閱項目'}
            description={activeTab === 'all' ? '去探索頁面找找適合你的共享群組' : undefined}
            actionLabel={activeTab === 'all' ? '探索群組' : undefined}
            onAction={activeTab === 'all' ? () => navigate('/explore') : undefined}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeTab === 'all' && pendingApplications.map(app => {
              const group = getGroupById(app.groupId)
              if (!group) return null
              return (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  group={group}
                  onViewGroup={() => window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: app.groupId } }))}
                />
              )
            })}
            {filtered.map(sub => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onViewGroup={sub => setViewGroupId(sub.groupId)}
              />
            ))}
          </div>
        )}
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

const APP_STATUS_CONFIG = {
  pending:  { label: '審核中', Icon: Clock,       cls: 'bg-warning-subtle text-warning-text',   dot: 'bg-warning'  },
  approved: { label: '已核准', Icon: CheckCircle, cls: 'bg-success-subtle text-success-text',   dot: 'bg-success'  },
  rejected: { label: '已拒絕', Icon: XCircle,     cls: 'bg-danger-subtle  text-danger',          dot: 'bg-danger'   },
  removed:  { label: '已被移除', Icon: UserMinus,  cls: 'bg-danger-subtle  text-danger',          dot: 'bg-danger'   },
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
            NT${group.pricePerSeat}
            <span className="ml-1 text-xs font-normal text-ink-4">/席/月</span>
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

function ApplicationRow({ app }) {
  const cfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.pending
  return (
    <div className="card flex w-full items-center gap-4 p-4">
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{app.groupName}</p>
        <p className="mt-0.5 text-xs text-ink-3">
          {app.planName ? `${app.planName} · ` : ''}申請於 {formatRelativeDate(app.createdAt)}
        </p>
      </div>
      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
        <cfg.Icon size={11} />
        {cfg.label}
      </span>
    </div>
  )
}
