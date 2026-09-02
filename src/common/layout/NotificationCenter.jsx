import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Megaphone } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from '../../components/ui/drawer'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useGroupStore } from '../stores/useGroupStore'
import { formatRelativeDate } from '../utils/date'
import EmptyState from '../../components/ui/primitives/EmptyState'
import FilterSelect from '../../components/ui/primitives/FilterSelect'
import { useFilterSelectGroup } from '../../components/ui/primitives/useFilterSelectGroup'
import ServiceLogo from '../../components/ui/ServiceLogo'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuRadioSection, DropdownMenuFilterTrigger,
} from '../../components/ui/dropdown-menu'
import { getMeta, handleNotificationClick } from './notificationClickHandlers'

function getMergedNotifications(userId) {
  const notifStore = useNotificationStore.getState()
  const personal = userId ? notifStore.getByUserId(userId) : []
  // 歡迎訊息本來是只給訪客看的 fallback，已登入會員完全沒有其他通知時
  // 也留著顯示，避免通知中心直接空白；只要會員有任何自己的通知，就跟
  // 原本一樣濾掉，不要跟真正的個人動態混在一起
  const system = personal.length > 0
    ? notifStore.getSystemNotifications().filter(n => n.id !== 'system_guest_welcome')
    : notifStore.getSystemNotifications()
  const seen = new Set(personal.map(n => n.id))
  return [...personal, ...system.filter(n => !seen.has(n.id))].sort(
    (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  )
}

const APPLY_TYPES   = ['joined', 'application_approved', 'application_rejected', 'application_sent', 'new_application', 'application_cancelled', 'application']

// 「系統」現在是分類 Select 裡的固定選項，不再放進這裡的「顯示範圍」篩選，
// 避免同一個「系統」字樣同時出現在兩個不同的篩選機制裡造成混淆
const TABS = [
  { id: 'all',    label: '全部', filter: () => true },
  { id: 'apply',  label: '申請', filter: n => APPLY_TYPES.includes(n.type) },
]

const SORT_OPTIONS = [
  { id: 'newest', label: '最新在前' },
  { id: 'oldest', label: '最舊在前' },
]

export default function NotificationCenter() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userId = currentUser?.id
  const notificationsState = useNotificationStore(s => s.notifications);

  const groupsState = useGroupStore(s => s.groups)

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeCategory, setActiveCategory] = useState(null) // null = 還沒手動選過，跟著預設值走；否則 'system' | 群組 id
  const filterSelectGroup = useFilterSelectGroup()
  // 篩選按鈕是另一個獨立的 DropdownMenu（不是 FilterSelect），兩邊各自管理
  // 開關狀態，這裡負責讓其中一個開起來的時候把另一個關掉，不要同時開兩個
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (filterSelectGroup.openKey) setFilterMenuOpen(false)
  }, [filterSelectGroup.openKey])

  const notifications = useMemo(
    () => loggedIn
      ? getMergedNotifications(userId)
      : useNotificationStore.getState().getSystemNotifications(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, userId, notificationsState],
  )

  // 分類條：把通知依「屬於哪個群組」分組，同一個群組的所有通知（不管申請/
  // 額滿/移除等各種類型）都會歸在同一個分類；沒有 groupId 的（系統公告、
  // 帳號相關）另外歸一類「系統」。只列出實際有通知的群組，用最新一筆通知
  // 的時間排序，越新互動過的群組排越前面
  const categories = useMemo(() => {
    const byGroup = new Map()
    notifications.forEach(n => {
      const groupId = n.meta?.groupId
      if (!groupId) return
      const group = groupsState.find(g => g.id === groupId)
      const label = group ? (group.planName || group.serviceName || '群組') : '已刪除的群組'
      const existing = byGroup.get(groupId)
      if (!existing || String(n.createdAt ?? '') > String(existing.latestAt ?? '')) {
        byGroup.set(groupId, { key: groupId, groupId, serviceId: group?.serviceId ?? '', label, latestAt: n.createdAt })
      }
    })
    const groupCategories = [...byGroup.values()].sort(
      (a, b) => String(b.latestAt ?? '').localeCompare(String(a.latestAt ?? ''))
    )
    // 「系統」固定存在，不看目前有沒有系統通知——公告本來就是不定期發送，
    // 沒有內容時選進去只是看到空清單，但這個分類本身要一直看得到、選得到；
    // 排在選單最後面，優先讓使用者看到跟自己群組有關的分類
    return [...groupCategories, { key: 'system', label: '系統' }]
  }, [notifications, groupsState])

  useEffect(() => {
    function onOpen() {
      setActiveTab('all')
      setActiveCategory(null)
      setOpen(true)
    }
    window.addEventListener('pm:open-notify', onOpen)
    return () => window.removeEventListener('pm:open-notify', onOpen)
  }, [])

  const visibleTabs = useMemo(() => loggedIn ? TABS : [], [loggedIn])

  const unreadCount = useMemo(
    () => loggedIn ? notifications.filter(n => !n.isRead).length : 0,
    [loggedIn, notifications]
  )

  // 使用者還沒手動選過分類時，預設就顯示最新有動態的那個群組（categories 已經
  // 依最新一筆通知時間排序，第一個就是它），完全沒有群組通知才會落到「系統」
  const effectiveCategory = activeCategory ?? categories[0]?.key ?? null
  const selectedCategory = categories.find(c => c.key === effectiveCategory) ?? null

  const categoryGroups = useMemo(() => [{
    label: null,
    items: categories.map(cat => ({
      value: cat.key,
      label: cat.label,
      icon: cat.key === 'system'
        ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-white text-brand">
            <Megaphone size={11} strokeWidth={1.5} />
          </span>
        )
        : <ServiceLogo serviceId={cat.serviceId} size={20} />,
    })),
  }], [categories])

  const filtered = useMemo(() => {
    const tab = visibleTabs.find(t => t.id === activeTab)
    let result = tab ? notifications.filter(tab.filter) : notifications
    if (effectiveCategory === 'system') result = result.filter(n => !n.meta?.groupId)
    else if (effectiveCategory) result = result.filter(n => n.meta?.groupId === effectiveCategory)
    if (unreadOnly) result = result.filter(n => !n.isRead)
    return sortOrder === 'oldest' ? [...result].reverse() : result;
  }, [activeTab, notifications, visibleTabs, unreadOnly, sortOrder, effectiveCategory])

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
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-bold text-ink-3 transition-colors hover:bg-raised hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink-3"
          >
            <CheckCheck size={16} strokeWidth={1.5} />
            全部已讀
          </button>
        </DrawerHeader>
        <DrawerDescription className="sr-only">通知中心</DrawerDescription>

        {(categories.length > 0 || visibleTabs.length > 1) && (
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            {categories.length > 0 && (
              <div className="min-w-0 flex-1">
                <FilterSelect
                  id="category"
                  group={filterSelectGroup}
                  value={effectiveCategory}
                  onChange={setActiveCategory}
                  groups={categoryGroups}
                  ariaLabel="通知分類"
                  className="h-11 w-full text-xs font-bold"
                  listClassName="z-[80]"
                  triggerContent={(
                    <span className="flex min-w-0 items-center gap-1.5">
                      {selectedCategory ? (
                        selectedCategory.key === 'system' ? (
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-white text-brand">
                            <Megaphone size={11} strokeWidth={1.5} />
                          </span>
                        ) : (
                          <ServiceLogo serviceId={selectedCategory.serviceId} size={20} />
                        )
                      ) : null}
                      <span className="truncate">{selectedCategory ? selectedCategory.label : '全部通知'}</span>
                    </span>
                  )}
                />
              </div>
            )}
            {visibleTabs.length > 1 && (
              <DropdownMenu
                open={filterMenuOpen}
                onOpenChange={o => { setFilterMenuOpen(o); if (o) filterSelectGroup.setOpenKey(null) }}
              >
                <DropdownMenuFilterTrigger
                  active={activeTab !== 'all' || unreadOnly || sortOrder !== 'newest'}
                  ariaLabel="篩選通知"
                  className="h-11 w-11"
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
        )}

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={loggedIn ? '沒有通知' : '沒有系統公告'}
              description={loggedIn && activeTab === 'all' ? '加入或建立群組後會顯示動態' : loggedIn ? '這裡沒有訊息' : '目前沒有公告'}
              className="py-10"
            />
          ) : (
            <div key={`${activeTab}-${sortOrder}-${effectiveCategory}`} className="animate-fade-in-up divide-y divide-line-subtle">
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
