import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, ClipboardList, Clock, XCircle } from 'lucide-react'
import { getSubscriptionsByUserId, initSubscriptions, markSubscriptionPaid } from '../../shared/stores/subscriptionStore'
import { getMemberByUserAndGroup, initMembers, updateMember } from '../../shared/stores/memberStore'
import { createNotification } from '../../shared/stores/notificationStore'
import { getApplicationsByUserId, initApplications } from '../../shared/stores/applicationStore'
import { getGroupById } from '../../shared/stores/groupStore'
import { getCurrentUser } from '../../shared/stores/authStore'
import SubscriptionCard from './components/SubscriptionCard'
import EmptyState from '../../shared/ui/EmptyState'
import GroupViewModal from '../../shared/ui/GroupViewModal'
import FilterTabsBar from '../../shared/ui/FilterTabsBar'
import { daysUntil, formatRelativeDate, todayISO } from '../../shared/utils/date'

const FILTER_TABS = [
  { key: 'all',          label: '全部'     },
  { key: 'processing',   label: '待處理'   },
  { key: 'active',       label: '已啟用'   },
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

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab)
  }, [location.state?.tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const [subs, setSubs] = useState(() =>
    activeUserId ? enrichSubs(getSubscriptionsByUserId(activeUserId)) : []
  )
  const [viewGroupId, setViewGroupId] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

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

  const userApplications = activeUserId ? getApplicationsByUserId(activeUserId) : []

  const filterCounts = {
    all:          subs.length,
    processing:   filterSubs(subs, 'processing').length,
    active:       filterSubs(subs, 'active').length,
    upcoming:     filterSubs(subs, 'upcoming').length,
    applications: userApplications.length,
  }

  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  function markAsPaid(sub) {
    const now = todayISO()
    markSubscriptionPaid(sub.id)

    const member = getMemberByUserAndGroup(activeUser?.id, sub.groupId)
    if (member) updateMember(member.id, { paymentStatus: 'markedPaid', lastPaidAt: now })

    createNotification({
      userId: activeUser?.id,
      type: 'payment',
      title: '付款已標記',
      message: `${sub.serviceName} ${sub.planName} 已標記付款，等待團主確認。`,
    })
    setSubs(activeUserId ? enrichSubs(getSubscriptionsByUserId(activeUserId)) : [])
    showToast('已標記付款，等待團主確認')
  }

  const filtered = useMemo(
    () => activeTab === 'applications' ? [] : filterSubs(subs, activeTab),
    [subs, activeTab],
  )

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
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={activeTab === 'all' ? '你還沒有加入任何群組' : '此分類沒有訂閱項目'}
            description={activeTab === 'all' ? '去探索頁面找找適合你的共享群組' : undefined}
            actionLabel={activeTab === 'all' ? '探索群組' : undefined}
            onAction={activeTab === 'all' ? () => navigate('/explore') : undefined}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
        onClose={() => setViewGroupId(null)}
        groupId={viewGroupId}
        onMarkPaid={sub => { markAsPaid(sub); setViewGroupId(null) }}
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        {toast && (
          <div className="rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

const APP_STATUS_CONFIG = {
  pending:  { label: '審核中', Icon: Clock,       cls: 'bg-warning-subtle text-warning-text',   dot: 'bg-warning'  },
  approved: { label: '已核准', Icon: CheckCircle, cls: 'bg-success-subtle text-success-text',   dot: 'bg-success'  },
  rejected: { label: '已拒絕', Icon: XCircle,     cls: 'bg-danger-subtle  text-danger',          dot: 'bg-danger'   },
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
