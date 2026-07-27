import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CheckCircle2, ClipboardEdit, MessageSquare, UserPlus, X } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { useApplicationStore } from '../stores/useApplicationStore'
import { useGroupStore } from '../stores/useGroupStore'
import { useMemberStore } from '../stores/useMemberStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useSubscriptionStore } from '../stores/useSubscriptionStore'
import { formatRelativeDate } from '../utils/date'
import { useScrollLock } from '../utils/hooks'
import { toast } from '../utils/toast'
import EmptyState from '../ui/primitives/EmptyState'

const getGroupById = (id) => useGroupStore.getState().getById(id)
const getCurrentUser = () => useAuthStore.getState().user
const getSubscriptionByUserAndGroup = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)

// 通知指向的群組可能在通知建立之後就額滿／不再招募中（例如被別人申請填滿），這種情況下
// 開啟一個「已經不能申請」的群組詳情 Modal 沒有意義，改成跳 toast 說明並留在探索頁瀏覽其他群組。
// 先重新拉一次群組資料，避免用本地過期的 recruiting 快取誤判。
async function openGroupOrRedirect(groupId) {
  await useGroupStore.getState().init({ all: true })
  const grp = getGroupById(groupId)
  if (!grp || grp.status !== 'recruiting') {
    toast('此群組已額滿或不再招募', 'info')
    return
  }
  window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId } }))
}

function getMergedNotifications(userId) {
  const notifStore = useNotificationStore.getState()
  const personal = userId ? notifStore.getByUserId(userId) : []
  const system   = notifStore.getSystemNotifications().filter(n => n.id !== 'system_guest_welcome')
  const seen     = new Set(personal.map(n => n.id))
  return [...personal, ...system.filter(n => !seen.has(n.id))].sort(
    (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  )
}

const NOTIFICATION_META = {
  joined:               { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-groups?view=member' },
  application_approved: { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-groups?view=member', state: { tab: 'processing' } },
  application_rejected: { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  application_sent:     { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-groups?view=member', state: { tab: 'processing' } },
  group_created:        { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-groups?view=host' },
  new_application:      { icon: UserPlus,      iconColor: 'text-brand',      link: '/my-groups?view=host' },
  application_withdrawn: { icon: AlertCircle,  iconColor: 'text-ink-3',      link: '/my-groups?view=host' },
  group_full:           { icon: UserPlus,      iconColor: 'text-brand',      link: '/my-groups?view=host' },
  group_chat_opened:    { icon: MessageSquare, iconColor: 'text-brand',      link: null },
  fill_service_info:    { icon: ClipboardEdit, iconColor: 'text-warning-text', link: '/my-groups?view=member' },
  service_info_filled:  { icon: ClipboardEdit, iconColor: 'text-success',    link: '/my-groups?view=host' },
  group_activated:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-groups?view=member' },
  group_cancelled:      { icon: AlertCircle,   iconColor: 'text-danger',     link: '/account' },
  group_renewal:        { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-groups?view=member' },
  upcoming_renewal:     { icon: AlertCircle,   iconColor: 'text-warning-text', link: '/my-groups?view=member', state: { tab: 'active' } },
  service_info_issue:   { icon: AlertCircle,   iconColor: 'text-amber-500',  link: '/my-groups?view=member' },
  group_ended:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/explore' },
  member_removed:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  member_left:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/my-groups?view=host' },
  escrow_released:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-groups?view=host' },
  dispute_raised:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/my-groups?view=host' },
  dispute_resolved:     { icon: CheckCircle2,  iconColor: 'text-info',       link: '/my-groups?view=member' },
  system:               { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/explore' },
  announcement:         { icon: AlertCircle,   iconColor: 'text-brand',      link: '/explore' },
  platform:             { icon: AlertCircle,   iconColor: 'text-brand',      link: '/explore' },
  default:              { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/my-groups?view=member' },
}

function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

const APPLY_TYPES   = ['joined', 'application_approved', 'application_rejected', 'application_sent', 'new_application', 'application_withdrawn', 'application']
const SYSTEM_TYPES  = ['system', 'announcement', 'platform']

const TABS = [
  { id: 'all',    label: '全部', filter: () => true },
  { id: 'apply',  label: '申請', filter: n => APPLY_TYPES.includes(n.type) },
  { id: 'system', label: '系統', filter: n => SYSTEM_TYPES.includes(n.type) && (!n.userId || n.userId === 'system' || n.isPublic === true) },
]

export default function FloatingMessages() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userId = currentUser?.id
  // 訂閱通知 store，通知更新時自動重新計算列表
  const notificationsState = useNotificationStore(s => s.notifications)

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => loggedIn ? 'all' : 'system')

  const notifications = useMemo(
    () => loggedIn
      ? getMergedNotifications(userId)
      : useNotificationStore.getState().getSystemNotifications(),
    // notificationsState 為刻意依賴：通知 store 更新時重新計算列表
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, userId, notificationsState],
  )

  useScrollLock(open)

  useEffect(() => {
    function onOpen() {
      setActiveTab(useAuthStore.getState().loggedIn ? 'all' : 'system')
      setOpen(true)
    }
    window.addEventListener('pm:open-notify', onOpen)
    return () => window.removeEventListener('pm:open-notify', onOpen)
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
    useNotificationStore.getState().markAllRead(userId)
  }

  function handleClick(notification) {
    if (!userId) {
      const link = getMeta(notification.type).link
      if (link && !['/my-groups?view=member', '/my-groups?view=host', '/account', '/favorites'].includes(link)) {
        setOpen(false)
        navigate(link)
      }
      return
    }

    useNotificationStore.getState().markRead(notification.id)
    setOpen(false)

    if (notification.type === 'group_chat_opened' && notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'fill_service_info' && notification.meta?.groupId) {
      // 直接開該群組的成員視角詳情，畫面上會依 needsFillInfo 自動顯示「請填寫服務帳號」橫幅與按鈕，
      // 不需要額外導向特定子面板
      navigate('/my-groups?view=member', { state: { openGroupId: notification.meta.groupId } })
      return
    }

    if (notification.type === 'group_created' && notification.meta?.groupId) {
      navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId } })
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'application_sent' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      // 同 application_approved：本地 subscriptionStore 快取可能還沒反映最新接受結果，先重新拉一次再判斷
      useSubscriptionStore.getState().init().finally(() => {
        const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
        if (hasSub) {
          // 申請已通過，以成員視角開啟
          navigate('/my-groups?view=member', { state: { openGroupId: gId } })
        } else {
          // 申請仍待審核，以探索視角開啟（與 ApplicationCard 一致）
          navigate('/my-groups?view=member', { state: { tab: 'processing' } })
          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: gId } }))
        }
      })
      return
    }

    if (notification.type === 'application_rejected') {
      const gId = notification.meta?.groupId
      // 申請人本地 applicationStore 的申請紀錄還停在 pending，要重新拉一次才會變成
      // rejected，讓群組卡片的「已申請」標記立即消失、恢復成可重新申請的狀態
      navigate('/explore')
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管費用已退款，重新拉最新餘額
      useApplicationStore.getState().init().finally(() => {
        if (gId) openGroupOrRedirect(gId)
      })
      return
    }

    if (notification.type === 'member_left') {
      if (notification.meta?.groupId) {
        // 團主收到「成員退出群組」通知
        window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
        navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId } })
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      } else {
        // 成員自己收到「已退出群組」確認通知
        navigate('/my-groups?view=member')
      }
      return
    }

    if (notification.type === 'member_removed' && notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管費用已退款，重新拉最新餘額
      navigate('/explore')
      openGroupOrRedirect(notification.meta.groupId)
      return
    }

    if (notification.type === 'application_approved' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      // 本地 subscriptionStore／memberStore 可能還停在接受前的快照（尚未輪詢到新建立的訂閱/成員資料），
      // 用過期快取判斷會誤判成「尚無訂閱」導致導向探索頁而非會員視角；memberStore 沒同步刷新的話，
      // 群組詳情 Modal 打開當下 myMember 會是 null，「退出群組」按鈕也會因此不會馬上顯示，須先重新拉一次
      Promise.all([useSubscriptionStore.getState().init(), useMemberStore.getState().init()]).finally(() => {
        const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
        if (hasSub) {
          navigate('/my-groups?view=member', { state: { openGroupId: gId } })
        } else {
          navigate('/explore')
          openGroupOrRedirect(gId)
        }
      })
      return
    }

    if (notification.type === 'new_application' && notification.meta?.groupId) {
      navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } })
      useApplicationStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } }))
      })
      return
    }

    if (notification.type === 'service_info_filled' && notification.meta?.groupId) {
      navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId, openMemberInfo: true } })
      // 先重新拉一次成員資料，避免打開「成員資料」分頁時看到的還是填寫當下的舊快取
      useMemberStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId, openMemberInfo: true } }))
      })
      return
    }

    if (notification.type === 'application_withdrawn' && notification.meta?.groupId) {
      navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } })
      useApplicationStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } }))
      })
      return
    }

    if (notification.type === 'group_full' && notification.meta?.groupId) {
      navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId } })
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if ((notification.type === 'escrow_released' || notification.type === 'dispute_raised') && notification.meta?.groupId) {
      if (notification.type === 'escrow_released') {
        useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管款項已撥款，重新拉最新餘額
      }
      navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId } })
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'dispute_resolved' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 裁定結果不管撥款或退款，都影響餘額
      const grp = getGroupById(gId)
      if (grp && grp.hostId === userId) {
        navigate('/my-groups?view=host', { state: { openGroupId: gId } })
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      } else if (useMemberStore.getState().getByUserAndGroup(userId, gId)) {
        // 申訴不成立，成員仍在群組內
        navigate('/my-groups?view=member', { state: { openGroupId: gId } })
      } else {
        // 申訴成立，申訴成員已被移出群組，沒有群組可開啟
        navigate('/explore')
      }
      return
    }

    if (notification.type === 'group_activated' && notification.meta?.groupId) {
      const grp = getGroupById(notification.meta.groupId)
      if (grp && grp.hostId === userId) {
        navigate('/my-groups?view=host', { state: { openGroupId: notification.meta.groupId } })
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      } else {
        navigate('/my-groups?view=member', { state: { openGroupId: notification.meta.groupId } })
      }
      return
    }

    if (notification.type === 'group_renewal' && notification.meta?.groupId) {
      navigate('/my-groups?view=member', { state: { openGroupId: notification.meta.groupId } })
      return
    }

    if (notification.type === 'upcoming_renewal' && notification.meta?.groupId) {
      navigate('/my-groups?view=member', { state: { openGroupId: notification.meta.groupId } })
      return
    }

    if (notification.type === 'group_cancelled') {
      // 群組解散於鎖定前，此時成員尚未有訂閱紀錄可開啟，僅導向列表
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管費用已退款，重新拉最新餘額
      navigate('/my-groups?view=member')
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
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
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
              description={loggedIn && activeTab === 'all' ? '加入或建立群組後，這裡會顯示申請與群組動態' : loggedIn ? '這個分類目前沒有任何訊息' : '目前沒有需要公告的系統訊息'}
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
