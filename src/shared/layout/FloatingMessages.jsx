import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CheckCircle2, Clock, CreditCard, MessageSquare, UserPlus, X } from 'lucide-react'
import { getCurrentUser, isAuthenticated } from '../stores/authStore'
import { getGroupById } from '../stores/groupStore'
import {
  getNotifications,
  getSystemNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from '../stores/notificationStore'

function getMergedNotifications(userId) {
  const personal = userId ? getNotifications(userId) : []
  const system   = getSystemNotifications().filter(n => n.id !== 'system_guest_welcome')
  const seen     = new Set(personal.map(n => n.id))
  return [...personal, ...system.filter(n => !seen.has(n.id))].sort(
    (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  )
}
import { getSubscriptionByUserAndGroup } from '../stores/subscriptionStore'
import { formatRelativeDate } from '../utils/date'
import { useScrollLock } from '../utils/hooks'
import EmptyState from '../ui/EmptyState'

const NOTIFICATION_META = {
  payment:              { icon: CreditCard,    iconColor: 'text-brand',      link: '/my-subscriptions' },
  payment_reminder:     { icon: Clock,         iconColor: 'text-amber-500',  link: '/my-subscriptions' },
  member_payment_marked:    { icon: CreditCard,    iconColor: 'text-success',    link: '/manage-groups' },
  all_payments_confirmed:   { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  joined:               { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  application_approved: { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions', state: { tab: 'processing' } },
  application_rejected: { icon: AlertCircle,   iconColor: 'text-danger',     link: '/my-subscriptions', state: { tab: 'applications' } },
  application_sent:     { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions', state: { tab: 'processing' } },
  group_created:        { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  new_application:      { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  group_full:           { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  group_chat_opened:    { icon: MessageSquare, iconColor: 'text-brand',      link: null },
  group_activated:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  system:               { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/explore' },
  announcement:         { icon: AlertCircle,   iconColor: 'text-brand',      link: '/explore' },
  platform:             { icon: AlertCircle,   iconColor: 'text-brand',      link: '/explore' },
  default:              { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/my-subscriptions' },
}

function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

const PAYMENT_TYPES = ['payment', 'payment_reminder', 'payment_confirmed', 'member_payment_marked', 'all_payments_confirmed']
const APPLY_TYPES   = ['joined', 'application_approved', 'application_rejected', 'application_sent', 'new_application', 'application']
const SYSTEM_TYPES  = ['system', 'announcement', 'platform']

const TABS = [
  { id: 'all',     label: '全部', filter: () => true },
  { id: 'payment', label: '付款', filter: n => PAYMENT_TYPES.includes(n.type) },
  { id: 'apply',   label: '申請', filter: n => APPLY_TYPES.includes(n.type) },
  { id: 'system',  label: '系統', filter: n => SYSTEM_TYPES.includes(n.type) && (!n.userId || n.userId === 'system' || n.isPublic === true) },
]

export default function FloatingMessages() {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const currentUser = getCurrentUser()
  const userId = currentUser?.id

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => loggedIn ? 'all' : 'system')
  const [notifications, setNotifications] = useState(() =>
    loggedIn ? getMergedNotifications(userId) : getSystemNotifications()
  )

  useScrollLock(open)

  useEffect(() => {
    function onOpen() {
      const activeUser = getCurrentUser()
      const activeUserId = activeUser?.id
      const authenticated = isAuthenticated()

      setActiveTab(authenticated ? 'all' : 'system')
      setNotifications(authenticated ? getMergedNotifications(activeUserId) : getSystemNotifications())
      setOpen(true)
    }
    function onNotifChanged() {
      const activeUser = getCurrentUser()
      const activeUserId = activeUser?.id
      const authenticated = isAuthenticated()
      setNotifications(authenticated ? getMergedNotifications(activeUserId) : getSystemNotifications())
    }
    window.addEventListener('pm:open-notify', onOpen)
    window.addEventListener('pm:notif-changed', onNotifChanged)
    return () => {
      window.removeEventListener('pm:open-notify', onOpen)
      window.removeEventListener('pm:notif-changed', onNotifChanged)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onEsc(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  const visibleTabs = useMemo(() => loggedIn ? TABS : TABS.filter(t => t.id === 'system'), [loggedIn])

  const unreadCount = useMemo(
    () => loggedIn ? notifications.filter(n => !n.isRead).length : 0,
    [loggedIn, notifications]
  )

  const filtered = useMemo(() => {
    const tab = visibleTabs.find(t => t.id === activeTab)
    return tab ? notifications.filter(tab.filter) : notifications
  }, [activeTab, notifications, visibleTabs])

  function handleMarkAllRead() {
    if (!userId) return
    markAllAsRead(userId)
    setNotifications(getMergedNotifications(userId))
  }

  function handleClick(notification) {
    if (!userId) {
      const link = getMeta(notification.type).link
      if (link && !['/my-subscriptions', '/manage-groups', '/account', '/favorites'].includes(link)) {
        setOpen(false)
        navigate(link)
      }
      return
    }

    markNotificationAsRead(notification.id)
    setNotifications(getMergedNotifications(userId))
    setOpen(false)

    if (notification.type === 'group_chat_opened' && notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'group_created' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
      window.dispatchEvent(new CustomEvent('pm:open-manage-group', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'application_sent' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
      if (hasSub) {
        // 申請已通過，以成員視角開啟
        navigate('/my-subscriptions', { state: { openGroupId: gId } })
      } else {
        // 申請仍待審核，以探索視角開啟（與 ApplicationCard 一致）
        navigate('/my-subscriptions', { state: { tab: 'processing' } })
        window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: gId } }))
      }
      return
    }

    if (notification.type === 'application_approved' && notification.meta?.groupId) {
      navigate('/my-subscriptions', { state: { openGroupId: notification.meta.groupId } })
      return
    }

    if (notification.type === 'new_application' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } })
      window.dispatchEvent(new CustomEvent('pm:open-manage-group', { detail: { groupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } }))
      return
    }

    if (notification.type === 'group_full' && notification.meta?.groupId) {
      const grp = getGroupById(notification.meta.groupId)
      const openActivateGroup = grp?.status === 'full'
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openActivateGroup } })
      window.dispatchEvent(new CustomEvent('pm:open-manage-group', { detail: { groupId: notification.meta.groupId, openActivateGroup } }))
      return
    }

    if (notification.type === 'member_payment_marked' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openBilling: true } })
      window.dispatchEvent(new CustomEvent('pm:open-manage-group', { detail: { groupId: notification.meta.groupId, openBilling: true } }))
      return
    }

    if (notification.type === 'all_payments_confirmed' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
      window.dispatchEvent(new CustomEvent('pm:open-manage-group', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'group_activated' && notification.meta?.groupId) {
      const grp = getGroupById(notification.meta.groupId)
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
        window.dispatchEvent(new CustomEvent('pm:open-manage-group', { detail: { groupId: notification.meta.groupId } }))
      } else {
        navigate('/my-subscriptions', { state: { openGroupId: notification.meta.groupId } })
      }
      return
    }

    const meta = getMeta(notification.type)
    if (!meta.link) return
    navigate(meta.link, meta.state ? { state: meta.state } : undefined)
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[56] flex w-80 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:w-96 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-ink-3" />
            <span className="text-sm font-extrabold text-ink">通知</span>
            {!loggedIn && (
              <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-bold text-ink-3">
                系統公告
              </span>
            )}
            {unreadCount > 0 && (
              <span className="rounded-full bg-danger-subtle px-2 py-0.5 text-xs font-bold text-danger-text">
                {unreadCount} 未讀
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-brand transition-colors hover:text-brand-hover"
              >
                全部已讀
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-line px-3 py-2">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'text-ink-3 hover:bg-raised hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={loggedIn ? '沒有通知' : '沒有系統公告'}
              description={loggedIn ? '這個分類目前沒有任何訊息' : '目前沒有需要公告的系統訊息'}
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-line-subtle">
              {filtered.map(n => {
                const { icon: Icon, iconColor } = getMeta(n.type)
                const isUnread = loggedIn && !n.isRead

                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raised ${
                      isUnread ? 'bg-brand-subtle/30' : ''
                    }`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised">
                      <Icon size={16} className={iconColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{n.message}</p>
                      <p className="mt-1 text-xs text-ink-4">{formatRelativeDate(n.createdAt)}</p>
                    </div>
                    {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
