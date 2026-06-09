import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CheckCircle2, Clock, CreditCard, UserPlus, X } from 'lucide-react'
import { getCurrentUser } from '../../stores/authStore'
import {
  getNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from '../../stores/notificationStore'
import { formatRelativeDate } from '../../utils/date'
import { useScrollLock } from '../../utils/hooks'
import EmptyState from '../ui/EmptyState'

const NOTIFICATION_META = {
  payment:              { icon: CreditCard,   iconColor: 'text-brand',      link: '/my-subscriptions' },
  payment_reminder:     { icon: Clock,        iconColor: 'text-amber-500',  link: '/my-subscriptions' },
  joined:               { icon: CheckCircle2, iconColor: 'text-success',    link: '/my-subscriptions' },
  application_approved: { icon: CheckCircle2, iconColor: 'text-success',    link: '/my-subscriptions' },
  application_rejected: { icon: AlertCircle,  iconColor: 'text-danger',     link: '/explore' },
  new_application:      { icon: UserPlus,     iconColor: 'text-brand',      link: '/manage-groups' },
  default:              { icon: AlertCircle,  iconColor: 'text-ink-3',      link: '/my-subscriptions' },
}

function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

const PAYMENT_TYPES = ['payment', 'payment_reminder', 'payment_confirmed']
const APPLY_TYPES   = ['joined', 'application_approved', 'application_rejected', 'new_application']
const CLASSIFIED_TYPES = [...PAYMENT_TYPES, ...APPLY_TYPES]

const TABS = [
  { id: 'all',     label: '全部', filter: () => true },
  { id: 'payment', label: '付款', filter: n => PAYMENT_TYPES.includes(n.type) },
  { id: 'apply',   label: '申請', filter: n => APPLY_TYPES.includes(n.type) },
  { id: 'system',  label: '系統', filter: n => !CLASSIFIED_TYPES.includes(n.type) },
]

export default function FloatingMessages() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const userId = currentUser?.id

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState(() => userId ? getNotifications(userId) : [])

  useScrollLock(open)

  useEffect(() => {
    function onOpen() {
      setNotifications(userId ? getNotifications(userId) : [])
      setOpen(true)
    }
    window.addEventListener('pm:open-notify', onOpen)
    return () => window.removeEventListener('pm:open-notify', onOpen)
  }, [userId])

  useEffect(() => {
    if (!open) return
    function onEsc(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])

  const filtered = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab)
    return tab ? notifications.filter(tab.filter) : notifications
  }, [notifications, activeTab])

  function handleMarkAllRead() {
    if (!userId) return
    markAllAsRead(userId)
    setNotifications(getNotifications(userId))
  }

  function handleClick(notification) {
    markNotificationAsRead(notification.id)
    setNotifications(userId ? getNotifications(userId) : [])
    setOpen(false)
    navigate(getMeta(notification.type).link)
  }

  if (!userId) return null

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
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
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
            <EmptyState icon={Bell} title="沒有通知" description="這個分類目前沒有任何訊息" className="py-10" />
          ) : (
            <div className="divide-y divide-line-subtle">
              {filtered.map(n => {
                const { icon: Icon, iconColor } = getMeta(n.type)
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raised ${
                      n.isRead ? '' : 'bg-brand-subtle/30'
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
                    {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger" />}
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
