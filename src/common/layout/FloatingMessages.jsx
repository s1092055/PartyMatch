import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from '../../components/ui/drawer'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { formatRelativeDate } from '../utils/date'
import EmptyState from '../../components/ui/primitives/EmptyState'
import SearchInput from '../../components/ui/primitives/SearchInput'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuRadioSection, DropdownMenuFilterTrigger,
} from '../../components/ui/dropdown-menu'
import { getMeta, handleNotificationClick } from './notificationClickHandlers'

const defaultNotifyTab = (loggedIn) => loggedIn ? 'all' : 'system'

function getMergedNotifications(userId) {
  const notifStore = useNotificationStore.getState()
  const personal = userId ? notifStore.getByUserId(userId) : []
  const system   = notifStore.getSystemNotifications().filter(n => n.id !== 'system_guest_welcome')
  const seen     = new Set(personal.map(n => n.id))
  return [...personal, ...system.filter(n => !seen.has(n.id))].sort(
    (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  )
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
                    onClick={() => handleNotificationClick(n, { userId, navigate, setOpen })}
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
