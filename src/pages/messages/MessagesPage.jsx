import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CheckCircle2, Clock, CreditCard, UserPlus } from 'lucide-react'
import { getCurrentUser } from '../../shared/stores/authStore'
import {
  getNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from '../../shared/stores/notificationStore'
import { formatRelativeDate } from '../../shared/utils/date'
import EmptyState from '../../shared/components/ui/EmptyState'

const NOTIFICATION_META = {
  payment:              { icon: CreditCard,   iconColor: 'text-brand',      link: '/my-subscriptions', tab: 'payment' },
  payment_reminder:     { icon: Clock,        iconColor: 'text-amber-500',  link: '/my-subscriptions', tab: 'payment' },
  joined:               { icon: CheckCircle2, iconColor: 'text-success',    link: '/my-subscriptions', tab: 'application' },
  application_approved: { icon: CheckCircle2, iconColor: 'text-success',    link: '/my-subscriptions', tab: 'application' },
  application_rejected: { icon: AlertCircle,  iconColor: 'text-danger',     link: '/explore',          tab: 'application' },
  new_application:      { icon: UserPlus,     iconColor: 'text-brand',      link: '/manage-groups',    tab: 'application' },
  default:              { icon: AlertCircle,  iconColor: 'text-ink-3',      link: '/my-subscriptions', tab: 'system' },
}

function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

const TABS = [
  { id: 'all',         label: '全部' },
  { id: 'payment',     label: '付款' },
  { id: 'application', label: '申請' },
  { id: 'system',      label: '系統' },
]

export default function MessagesPage() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const userId = currentUser?.id

  const [activeTab, setActiveTab]     = useState('all')
  const [notifications, setNotifications] = useState(() => userId ? getNotifications(userId) : [])

  function refresh() {
    setNotifications(userId ? getNotifications(userId) : [])
  }

  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications
    return notifications.filter(n => getMeta(n.type).tab === activeTab)
  }, [notifications, activeTab])

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications],
  )

  function handleMarkAllRead() {
    if (!userId) return
    markAllAsRead(userId)
    refresh()
  }

  function handleClick(notification) {
    markNotificationAsRead(notification.id)
    refresh()
    navigate(getMeta(notification.type).link)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-ink">訊息中心</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-bold text-danger-text">
              {unreadCount} 未讀
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-bold text-brand transition-colors hover:text-brand-hover"
          >
            全部已讀
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-1 rounded-2xl bg-raised p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title="沒有通知" description="這個分類目前沒有任何訊息" />
        ) : (
          <div className="divide-y divide-line-subtle">
            {filtered.map(n => {
              const { icon: Icon, iconColor } = getMeta(n.type)
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-raised ${
                    n.isRead ? '' : 'bg-brand-subtle/30'
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-raised">
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 text-sm text-ink-3">{n.message}</p>
                    <p className="mt-1.5 text-xs text-ink-4">{formatRelativeDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
