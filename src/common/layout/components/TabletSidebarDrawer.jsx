import { useState } from 'react'
import { LogIn, Menu, Moon, Sun } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { NAV_SECTIONS } from '../nav'
import { Avatar } from '../../../components/ui/avatar'
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer'
import { PresenceDot, LockBadge } from './navShared'
import { LOCKED_MESSAGE, getNavItemKey, isProtectedNavItem } from './navConstants'
import { useTheme } from '../../../components/theme-provider'

// iPad 這類沒有滑鼠 hover 能力、但螢幕寬度又到 lg 以上的裝置，沒辦法用桌機 DesktopSidebar
// 那套「hover 才展開顯示文字」的收合側邊欄互動，改成左上角一顆按鈕，點開從左側滑出的
// Drawer，內容跟 DesktopSidebar 共用同一份 NAV_SECTIONS，只是一律展開顯示文字（不需要
// hover 收合這層邏輯）。只在「lg 以上寬度」且「沒有 hover 能力」時顯示觸發按鈕，真正的
// 桌機（can-hover:lg:）維持原本的 DesktopSidebar，兩者互斥不會同時出現
export default function TabletSidebarDrawer({
  loggedIn,
  pathname,
  userName,
  avatarInitial,
  avatarColor,
  presenceStatus,
  closeAll,
  openCreate,
  openMatch,
  preventLockedAction,
}) {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  function isGuestLocked(item) {
    return !loggedIn && isProtectedNavItem(item)
  }

  function handleNavigate() {
    setOpen(false)
    closeAll()
  }

  // 跟 DesktopSidebar 的 renderSideItem 同一套結構（icon 插槽尺寸、間距、active 樣式都
  // 照抄），唯一差異是這裡的文字標籤一律直接顯示，不需要 DesktopSidebar 那套「平常
  // opacity-0，hover/focus-within 展開才 opacity-100」的收合互動
  function renderItem(item) {
    if (isGuestLocked(item)) {
      const Icon = item.icon ?? LogIn
      return (
        <button
          key={getNavItemKey(item)}
          type="button"
          aria-label={`${item.label}，${LOCKED_MESSAGE}`}
          onClick={e => { setOpen(false); preventLockedAction(e) }}
          className="relative flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-4 transition-colors hover:bg-raised"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center">
            <Icon size={22} strokeWidth={2.1} />
            <LockBadge className="right-0 top-0" />
          </span>
          <span className="whitespace-nowrap font-bold">{item.label}</span>
        </button>
      )
    }

    if (item.type === 'create' || item.type === 'match') {
      const onClick = item.type === 'create' ? openCreate : openMatch
      return (
        <button
          key={item.type}
          type="button"
          onClick={() => { setOpen(false); onClick() }}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center">
            <item.icon size={22} strokeWidth={2.1} />
          </span>
          <span className="whitespace-nowrap font-bold">{item.label}</span>
        </button>
      )
    }

    const isActive = pathname === item.to
    return (
      <a
        key={item.to}
        href={item.to}
        onClick={handleNavigate}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-[0.95rem] transition-all hover:-translate-y-0.5 ${
          isActive
            ? 'bg-brand font-extrabold text-white'
            : 'font-bold text-ink-2 hover:bg-brand-subtle hover:text-brand'
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center">
          <item.icon size={22} strokeWidth={2.1} />
        </span>
        <span className="whitespace-nowrap">{item.label}</span>
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="開啟導覽選單"
        className="fixed left-4 top-4 z-50 hidden h-12 w-12 place-items-center rounded-2xl border border-line bg-surface text-ink-2 shadow-sm transition-colors hover:bg-raised no-hover:lg:grid"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      <Drawer open={open} onOpenChange={setOpen} swipeDirection="left" showSwipeHandle>
        <DrawerContent>
          <DrawerTitle className="sr-only">導覽選單</DrawerTitle>

          <a href="/" onClick={handleNavigate} className="flex h-16 shrink-0 items-center gap-3 px-4" aria-label="回首頁">
            <img src={logoUrl} alt="PartyMatch" className="h-8 w-8 shrink-0" />
            <span className="text-[1.1rem] font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
          </a>

          {/* 跟 DesktopSidebar 同一套排列方式：NAV_SECTIONS 攤平成一份清單（不分組顯示
              「探索」／「我的帳號」這種區段標題），項目之間用同樣的 space-y-6 間距，整組
              在中間這塊可用空間垂直置中（my-auto），不是貼頂由上往下排 */}
          <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-2">
            <div className="my-auto space-y-6">
              {NAV_SECTIONS.flatMap(section => section.items).map(renderItem)}
            </div>
          </nav>

          <div className="px-2 pb-4">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
              className="mb-1 flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center">
                {theme === 'dark' ? <Sun size={22} strokeWidth={2.1} /> : <Moon size={22} strokeWidth={2.1} />}
              </span>
              <span className="whitespace-nowrap font-bold">{theme === 'dark' ? '淺色模式' : '深色模式'}</span>
            </button>

            {loggedIn ? (
              <a href="/account" onClick={handleNavigate} className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised">
                <span className="relative shrink-0 shadow-md rounded-full">
                  <Avatar initial={avatarInitial} color={avatarColor} size="md" />
                  <PresenceDot status={presenceStatus} className="absolute bottom-0 right-0 h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-ink">{userName}</span>
                </span>
              </a>
            ) : (
              <a href="/login" onClick={handleNavigate} className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand">
                <span className="grid h-10 w-10 shrink-0 place-items-center">
                  <LogIn size={22} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1 whitespace-nowrap">
                  <span className="block truncate text-sm font-extrabold">登入</span>
                </span>
              </a>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
