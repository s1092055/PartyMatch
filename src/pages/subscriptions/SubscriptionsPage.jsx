import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ClipboardList, Clock, XCircle } from 'lucide-react'
import { getSubscriptionsByUserId, markSubscriptionPaid } from '../../shared/stores/subscriptionStore'
import { getMemberByUserAndGroup, updateMember } from '../../shared/stores/memberStore'
import { createNotification } from '../../shared/stores/notificationStore'
import { getApplicationsByUserId } from '../../shared/stores/applicationStore'
import { getGroupById } from '../../shared/stores/groupStore'
import { getActiveUser } from '../../shared/stores/userStore'
import SubscriptionCard from './components/SubscriptionCard'
import EmptyState from '../../shared/components/ui/EmptyState'
import GroupViewModal from '../../shared/components/modals/GroupViewModal'
import ContactHostModal from './components/ContactHostModal'
import { effectiveStatus } from '../../shared/utils/subscriptionStatus'
import { daysUntil, todayISO } from '../../shared/utils/date'

const FILTER_TABS = [
  { key: 'all',          label: '全部'     },
  { key: 'pending',      label: '待付款'   },
  { key: 'paid',         label: '已付款'   },
  { key: 'upcoming',     label: '即將續訂' },
  { key: 'applications', label: '申請紀錄' },
]

function enrichSubs(rawSubs) {
  return rawSubs.map(s => {
    const group = getGroupById(s.groupId)
    return { ...s, groupStatus: group?.status ?? 'active', isHostVerified: group?.isHostVerified ?? false }
  })
}

function filterSubs(subs, tab) {
  switch (tab) {
    case 'pending':  return subs.filter(s => ['pending', 'markedPaid', 'overdue'].includes(effectiveStatus(s)))
    case 'paid':     return subs.filter(s => ['paid', 'confirmed', 'waiting_activation'].includes(effectiveStatus(s)))
    case 'upcoming': return subs.filter(s => { const d = daysUntil(s.nextBillingDate); return d >= 0 && d <= 7 })
    default:         return subs
  }
}

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const [activeTab, setActiveTab] = useState('all')
  const [subs, setSubs] = useState(() =>
    activeUser ? enrichSubs(getSubscriptionsByUserId(activeUser.id)) : []
  )
  const [viewGroupId, setViewGroupId] = useState(null)
  const [contactSub, setContactSub] = useState(null)
  const [toast, setToast] = useState(null)

  const userApplications = useMemo(
    () => activeUser ? getApplicationsByUserId(activeUser.id) : [],
    [activeUser],
  )

  const filterCounts = useMemo(() => ({
    all:          subs.length,
    pending:      filterSubs(subs, 'pending').length,
    paid:         filterSubs(subs, 'paid').length,
    upcoming:     filterSubs(subs, 'upcoming').length,
    applications: userApplications.length,
  }), [subs, userApplications])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
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
    setSubs(activeUser ? enrichSubs(getSubscriptionsByUserId(activeUser.id)) : [])
    showToast('已標記付款，等待團主確認')
  }

  const filtered = useMemo(
    () => activeTab === 'applications' ? [] : filterSubs(subs, activeTab),
    [subs, activeTab],
  )

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="page-title">我的訂閱</h1>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex min-w-0 justify-center overflow-x-auto py-1">
          <div className="flex gap-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-brand text-white'
                    : 'text-ink-3 hover:bg-raised hover:text-ink'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-raised text-ink-4'
                }`}>
                  {filterCounts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

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
        onContactHost={sub => { setViewGroupId(null); setContactSub(sub) }}
      />
      <ContactHostModal
        sub={contactSub}
        isOpen={!!contactSub}
        onClose={() => setContactSub(null)}
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
    <div className="card flex items-center gap-4 p-4">
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{app.groupName}</p>
        <p className="mt-0.5 text-xs text-ink-3">
          {app.planName ? `${app.planName} · ` : ''}申請於 {app.createdAt}
        </p>
      </div>
      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
        <cfg.Icon size={11} />
        {cfg.label}
      </span>
    </div>
  )
}
