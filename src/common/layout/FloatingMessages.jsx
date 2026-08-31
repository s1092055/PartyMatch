import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CalendarClock, CheckCircle2, ClipboardEdit, MessageSquare, PlayCircle, Star, UserPlus } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from '../../components/ui/drawer'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { useApplicationStore } from '../stores/useApplicationStore'
import { useGroupStore } from '../stores/useGroupStore'
import { useMemberStore } from '../stores/useMemberStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useSubscriptionStore } from '../stores/useSubscriptionStore'
import { formatRelativeDate } from '../utils/date'
import { toast } from '../utils/toast'
import { getServiceById } from '../utils/serviceUtils'
import { isSharedCredentialsMethod } from '../utils/serviceInfoFields'
import EmptyState from '../../components/ui/primitives/EmptyState'
import SearchInput from '../../components/ui/primitives/SearchInput'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuRadioSection, DropdownMenuFilterTrigger,
} from '../../components/ui/dropdown-menu'

const getGroupById = (id) => useGroupStore.getState().getById(id)
const getCurrentUser = () => useAuthStore.getState().user
const getSubscriptionByUserAndGroup = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)
const defaultNotifyTab = (loggedIn) => loggedIn ? 'all' : 'system'

function openHostGroup(groupId, extra) {
  window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId, ...extra } }))
}

async function openGroupOrRedirect(groupId) {
  await useGroupStore.getState().init({ all: true })
  const grp = getGroupById(groupId)
  if (!grp || grp.status !== 'recruiting') {
    toast('此群組已額滿或不再招募', 'info')
    return
  }
  window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId } }))
}

function navigateToMemberGroupOrExplore(navigate, userId, groupId, extraState) {
  Promise.all([
    useMemberStore.getState().init(),
    useGroupStore.getState().init({ all: true }),
  ]).finally(() => {
    if (userId && useMemberStore.getState().getByUserAndGroup(userId, groupId)) {
      navigate('/my-subscriptions', { state: { openGroupId: groupId, ...extraState } })
    } else {
      navigate('/explore')
      openGroupOrRedirect(groupId)
    }
  })
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
  application_approved: { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  application_rejected: { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  application_sent:     { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions' },
  group_created:        { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  new_application:      { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  application_cancelled: { icon: AlertCircle,  iconColor: 'text-ink-3',      link: '/manage-groups' },
  group_full:           { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  group_chat_opened:    { icon: MessageSquare, iconColor: 'text-brand',      link: null },
  fill_service_info:    { icon: ClipboardEdit, iconColor: 'text-warning-text', link: '/my-subscriptions' },
  service_info_filled:  { icon: ClipboardEdit, iconColor: 'text-success',    link: '/manage-groups' },
  all_service_info_filled: { icon: PlayCircle, iconColor: 'text-success',    link: '/manage-groups' },
  service_info_deadline_passed: { icon: AlertCircle, iconColor: 'text-warning-text', link: '/manage-groups' },
  group_activated:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  group_cancelled:      { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  group_renewal:        { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions' },
  upcoming_renewal:     { icon: AlertCircle,   iconColor: 'text-warning-text', link: '/my-subscriptions' },
  service_info_issue:   { icon: AlertCircle,   iconColor: 'text-amber-500',  link: '/my-subscriptions' },
  group_ended:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/explore' },
  member_removed:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  member_left:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/manage-groups' },
  escrow_released:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  dispute_raised:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/manage-groups' },
  dispute_resolved:     { icon: CheckCircle2,  iconColor: 'text-info',       link: '/my-subscriptions' },
  dispute_resolved_by_host: { icon: CheckCircle2, iconColor: 'text-info',    link: '/my-subscriptions' },
  billing_date_confirmed: { icon: CalendarClock, iconColor: 'text-brand',      link: '/my-subscriptions' },
  billing_date_adjusted:  { icon: CalendarClock, iconColor: 'text-warning-text', link: '/my-subscriptions' },
  member_confirmed_service: { icon: CheckCircle2, iconColor: 'text-success',   link: '/manage-groups' },
  group_reviewed:          { icon: Star,          iconColor: 'text-warning-text', link: '/manage-groups' },
  account_reactivated:  { icon: CheckCircle2,  iconColor: 'text-success',    link: '/' },
  payment_reminder:     { icon: AlertCircle,   iconColor: 'text-warning-text', link: '/my-subscriptions' },
  system:               { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/' },
  default:              { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/my-subscriptions' },
}

function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

const APPLY_TYPES   = ['joined', 'application_approved', 'application_rejected', 'application_sent', 'new_application', 'application_cancelled', 'application']
const SYSTEM_TYPES  = ['system']

const TABS = [
  { id: 'all',    label: '全部', filter: () => true },
  { id: 'apply',  label: '申請', filter: n => APPLY_TYPES.includes(n.type) },
  { id: 'system', label: '系統', filter: n => SYSTEM_TYPES.includes(n.type) && (!n.userId || n.userId === 'system' || n.isPublic === true) },
]

const SORT_OPTIONS = [
  { id: 'newest', label: '最新在前' },
  { id: 'oldest', label: '最舊在前' },
]

export default function FloatingMessages() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userId = currentUser?.id
  const notificationsState = useNotificationStore(s => s.notifications);

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => defaultNotifyTab(loggedIn))
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('')

  const notifications = useMemo(
    () => loggedIn
      ? getMergedNotifications(userId)
      : useNotificationStore.getState().getSystemNotifications(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, userId, notificationsState],
  )

  useEffect(() => {
    function onOpen() {
      setActiveTab(defaultNotifyTab(useAuthStore.getState().loggedIn))
      setOpen(true)
    }
    window.addEventListener('pm:open-notify', onOpen)
    return () => window.removeEventListener('pm:open-notify', onOpen)
  }, [])

  const visibleTabs = useMemo(() => loggedIn ? TABS : TABS.filter(t => t.id === 'system'), [loggedIn])

  const unreadCount = useMemo(
    () => loggedIn ? notifications.filter(n => !n.isRead).length : 0,
    [loggedIn, notifications]
  )

  const filtered = useMemo(() => {
    const tab = visibleTabs.find(t => t.id === activeTab)
    let result = tab ? notifications.filter(tab.filter) : notifications
    if (unreadOnly) result = result.filter(n => !n.isRead)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(n => n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q))
    }
    return sortOrder === 'oldest' ? [...result].reverse() : result;
  }, [activeTab, notifications, visibleTabs, unreadOnly, searchQuery, sortOrder])

  function handleMarkAllRead() {
    if (!userId) return
    useNotificationStore.getState().markAllRead(userId)
  }

  function handleClick(notification) {
    if (!userId) {
      const link = getMeta(notification.type).link
      if (link && !['/my-subscriptions', '/manage-groups', '/favorites'].includes(link)) {
        setOpen(false)
        if (link === '/') {
          window.location.replace('/')
        } else {
          navigate(link)
        }
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
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
      return
    }

    if (notification.type === 'service_info_issue' && notification.meta?.groupId) {
      useGroupStore.getState().init({ all: true }).finally(() => {
        const grp = getGroupById(notification.meta.groupId)
        const isSharedCredentials = isSharedCredentialsMethod(getServiceById(grp?.serviceId)?.sharingMethod)
        navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId, isSharedCredentials ? { openCredentials: true } : undefined)
      });
      return
    }

    if (notification.type === 'group_created' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
      openHostGroup(notification.meta.groupId)
      return
    }

    if (notification.type === 'application_sent' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      Promise.all([
        useSubscriptionStore.getState().init(),
        useApplicationStore.getState().init(),
        useGroupStore.getState().init({ all: true }),
      ]).finally(() => {
        const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
        if (hasSub) {
          navigate('/my-subscriptions', { state: { openGroupId: gId } });
          return
        }
        const grp = getGroupById(gId);
        if (grp && grp.status === 'recruiting') {
          navigate('/my-subscriptions')
          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: gId } }))
        } else {
          navigate('/explore')
          toast('此群組已額滿或不再招募', 'info')
        }
      });
      return
    }

    if (notification.type === 'application_rejected') {
      const gId = notification.meta?.groupId
      navigate('/explore');
      useAuthStore.getState().refreshTokenBalance().catch(console.error);
      useApplicationStore.getState().init().finally(() => {
        if (gId) openGroupOrRedirect(gId)
      })
      return
    }

    if (notification.type === 'member_left') {
      if (notification.meta?.groupId) {
        window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'));
        navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
        openHostGroup(notification.meta.groupId)
      } else {
        navigate('/my-subscriptions');
      }
      return
    }

    if (notification.type === 'member_removed' && notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
      useAuthStore.getState().refreshTokenBalance().catch(console.error);
      useAuthStore.getState().refreshCreditScore().catch(console.error);
      navigate('/explore')
      openGroupOrRedirect(notification.meta.groupId)
      return
    }

    if (notification.type === 'application_approved' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      Promise.all([
        useSubscriptionStore.getState().init(),
        useMemberStore.getState().init(),
        useApplicationStore.getState().init(),
        useGroupStore.getState().init({ all: true }),
      ]).finally(() => {
        const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
        if (hasSub) {
          navigate('/my-subscriptions', { state: { openGroupId: gId } });
        } else {
          navigate('/explore')
          openGroupOrRedirect(gId)
        }
      });
      return
    }

    if (notification.type === 'new_application' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openApplications: true } })
      useApplicationStore.getState().init().finally(() => {
        openHostGroup(notification.meta.groupId, { openApplications: true })
      })
      return
    }

    if (notification.type === 'service_info_filled' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openMemberInfo: true } })
      useMemberStore.getState().init().finally(() => {
        openHostGroup(notification.meta.groupId, { openMemberInfo: true })
      });
      return
    }

    if (notification.type === 'application_cancelled' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openApplications: true } })
      useApplicationStore.getState().init().finally(() => {
        openHostGroup(notification.meta.groupId, { openApplications: true })
      })
      return
    }

    if (notification.type === 'group_full' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        openHostGroup(gId)
      });
      return
    }

    if (notification.type === 'all_service_info_filled' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        openHostGroup(gId)
      });
      return
    }

    if (notification.type === 'member_confirmed_service' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      useMemberStore.getState().init().finally(() => {
        openHostGroup(gId)
      });
      return
    }

    if (notification.type === 'group_reviewed' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      openHostGroup(gId)
      return
    }

    if (notification.type === 'service_info_deadline_passed' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
        useApplicationStore.getState().init(),
      ]).finally(() => {
        openHostGroup(gId)
      });
      return
    }

    if (notification.type === 'escrow_released' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      useAuthStore.getState().refreshTokenBalance().catch(console.error);
      navigate('/manage-groups', { state: { openGroupId: gId } })
      useGroupStore.getState().init({ all: true }).finally(() => {
        openHostGroup(gId)
      });
      return
    }

    if (notification.type === 'dispute_raised' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId, openMemberInfo: true } });
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        openHostGroup(gId, { openMemberInfo: true })
      })
      return
    }

    if (notification.type === 'dispute_resolved_by_host' && notification.meta?.groupId) {
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId);
      return
    }

    if (notification.type === 'dispute_resolved' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      useAuthStore.getState().refreshTokenBalance().catch(console.error);
      const grp = getGroupById(gId);
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: gId } })
        Promise.all([
          useGroupStore.getState().init({ all: true }),
          useMemberStore.getState().init(),
        ]).finally(() => {
          openHostGroup(gId)
        })
      } else {
        navigateToMemberGroupOrExplore(navigate, userId, gId);
      }
      return
    }

    if (notification.type === 'group_activated' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const grp = getGroupById(gId)
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: gId } })
        useGroupStore.getState().init({ all: true }).finally(() => {
          openHostGroup(gId)
        });
      } else {
        navigateToMemberGroupOrExplore(navigate, userId, gId)
      }
      return
    }

    if ((notification.type === 'billing_date_confirmed' || notification.type === 'billing_date_adjusted') && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const grp = getGroupById(gId)
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: gId } })
        useGroupStore.getState().init({ all: true }).finally(() => {
          openHostGroup(gId)
        })
      } else {
        navigateToMemberGroupOrExplore(navigate, userId, gId)
      }
      return
    }

    if (notification.type === 'group_renewal' && notification.meta?.groupId) {
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
      return
    }

    if (notification.type === 'upcoming_renewal' && notification.meta?.groupId) {
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
      return
    }

    if (notification.type === 'group_cancelled') {
      useAuthStore.getState().refreshTokenBalance().catch(console.error);
      navigate('/explore')
      useGroupStore.getState().init({ all: true })
      return
    }

    const meta = getMeta(notification.type)
    if (!meta.link) return
    navigate(meta.link, meta.state ? { state: meta.state } : undefined)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">

      <DrawerContent className="no-hover:[--drawer-content-width:18rem] no-hover:data-[swipe-direction=right]:border-l-0 can-hover:lg:rounded-2xl can-hover:lg:border can-hover:lg:[--drawer-inset:0.75rem] can-hover:lg:[--drawer-bleed-background:transparent]">
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <Bell strokeWidth={1.5} size={18} className="text-ink-3" />
            <DrawerTitle>通知</DrawerTitle>
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
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-brand transition-colors hover:text-brand-hover"
            >
              全部已讀
            </button>
          )}
        </DrawerHeader>
        <DrawerDescription className="sr-only">通知中心</DrawerDescription>

        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="搜尋通知..." />
          {visibleTabs.length > 1 && (
            <DropdownMenu>
              <DropdownMenuFilterTrigger
                active={activeTab !== 'all' || unreadOnly || sortOrder !== 'newest'}
                ariaLabel="篩選通知"
              />
              <DropdownMenuContent>
                <DropdownMenuRadioSection label="顯示範圍" options={visibleTabs} value={activeTab} onValueChange={setActiveTab} />
                <DropdownMenuRadioSection label="排序" options={SORT_OPTIONS} value={sortOrder} onValueChange={setSortOrder} />
                <DropdownMenuCheckboxItem checked={unreadOnly} onCheckedChange={setUnreadOnly}>
                  只顯示未讀
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={loggedIn ? '沒有通知' : '沒有系統公告'}
              description={loggedIn && activeTab === 'all' ? '加入或建立群組後會顯示動態' : loggedIn ? '這裡沒有訊息' : '目前沒有公告'}
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
                      <Icon size={16} strokeWidth={1.5} className={iconColor} />
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

        <DrawerFooter>
          <Button
            onClick={() => setOpen(false)}
            className="w-full rounded-lg"
          >
            關閉
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
