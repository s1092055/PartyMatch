import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Lock, LogIn, LogOut, MessageSquare, Moon, Settings, ShieldCheck, Star, Sun, User } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { NAV_SECTIONS } from '../nav'
import { useTheme } from '../../../components/theme-provider'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu'
import { CountBadge, LockBadge, LockedHint, PresenceDot } from './navShared'
import { LOCKED_MESSAGE, getNavItemKey, isProtectedNavItem } from './navConstants'

export default function DesktopSidebar({
  loggedIn,
  pathname,
  userName,
  avatarInitial,
  avatarColor,
  presenceStatus,
  unreadNotifs,
  unreadMsgs,
  tokenBalance,
  setTopupOpen,
  closeAll,
  openCreate,
  openMatch,
  openNotify,
  openMessages,
  openSettings,
  openProfile,
  openCreditScore,
  openReviews,
  preventLockedAction,
  logout,
  loggingOut,
}) {
  const { theme, toggleTheme } = useTheme()
  const [lockedTip, setLockedTip] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  function isGuestLocked(item) {
    return !loggedIn && isProtectedNavItem(item)
  }

  function renderSideItem(item) {
    if (isGuestLocked(item)) {
      const Icon = item.icon ?? Lock

      return (
        <button
          key={getNavItemKey(item)}
          type="button"
          aria-label={`${item.label}，${LOCKED_MESSAGE}`}
          onClick={e => preventLockedAction(e)}
          onMouseEnter={e => setLockedTip({ top: e.clientY + 14, left: e.clientX + 12 })}
          onMouseMove={e => setLockedTip({ top: e.clientY + 14, left: e.clientX + 12 })}
          onMouseLeave={() => setLockedTip(null)}
          className="relative flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-4 transition-colors hover:bg-raised"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center">
            <Icon size={22} strokeWidth={1.5} />
            <LockBadge className="right-0 top-0" />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
            {item.label}
          </span>
        </button>
      )
    }

    if (item.type === 'create' || item.type === 'match') {
      const onClick = item.type === 'create' ? openCreate : openMatch
      return (
        <button key={item.type} onClick={onClick} aria-label={item.label}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand">
          <span className="grid h-9 w-9 shrink-0 place-items-center">
            <item.icon size={22} strokeWidth={1.5} />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
            {item.label}
          </span>
        </button>
      )
    }

    const isActive = pathname === item.to
    return (
      <a
        key={item.to}
        href={item.to}
        onClick={closeAll}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-base transition-all hover:-translate-y-0.5 ${
          isActive
            ? 'bg-brand font-extrabold text-white'
            : 'font-bold text-ink-2 hover:bg-brand-subtle hover:text-brand'
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center">
          <item.icon size={22} strokeWidth={1.5} />
        </span>
        <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
          {item.label}
        </span>
      </a>
    )
  }

  return (
    <>

      {lockedTip && createPortal(
        <span
          className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-canvas shadow-popover"
          style={{ top: lockedTip.top, left: lockedTip.left }}
        >
          {LOCKED_MESSAGE}
        </span>,
        document.body
      )}

      <div className="fixed top-6 z-50 flex lg:top-8" style={{ right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        <button
          onClick={openNotify}
          className="relative flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-bold text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand lg:h-10 lg:w-auto lg:justify-start lg:px-4 dark:border-[#238EC7] dark:text-[#238EC7]"
          aria-label="通知"
        >
          <Bell className="size-5 lg:size-4" strokeWidth={1.5} />
          <span className="hidden lg:inline">通知</span>
          <CountBadge count={unreadNotifs} />
        </button>
      </div>

      <div className="fixed z-50 block" style={{ bottom: '2.25rem', right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        {loggedIn ? (
          <button
            onClick={openMessages}
            className="relative flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-bold text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand lg:h-10 lg:w-auto lg:justify-start lg:px-4 dark:border-[#238EC7] dark:text-[#238EC7]"
            aria-label="訊息"
          >
            <MessageSquare className="size-5 lg:size-4" strokeWidth={1.5} />
            <span className="hidden lg:inline">訊息</span>
            <CountBadge count={unreadMsgs} className="-right-1.5 -top-1.5" />
          </button>
        ) : (
          <button
            type="button"
            aria-disabled="true"
            aria-label={`訊息，${LOCKED_MESSAGE}`}
            onClick={e => preventLockedAction(e)}
            className="group/locked relative flex h-12 w-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-bold text-ink-2 opacity-40 shadow-floating lg:h-10 lg:w-auto lg:justify-start lg:px-4 dark:border-[#238EC7] dark:text-[#238EC7]"
          >
            <MessageSquare className="size-5 lg:size-4" strokeWidth={1.5} />
            <span className="hidden lg:inline">訊息</span>
            <LockBadge className="right-1 top-1" />
            <LockedHint className="right-full top-1/2 mr-2 -translate-y-1/2" />
          </button>
        )}
      </div>

      <aside
        data-force-open={userMenuOpen ? 'true' : undefined}
        className="group/nav fixed bottom-4 left-4 top-4 z-50 hidden w-16 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-floating transition-[width] duration-300 ease-out hover:w-64 focus-within:w-64 data-[force-open=true]:w-64 can-hover:lg:flex"
      >
        <a
          href="/"
          onClick={closeAll}
          className="flex h-16 shrink-0 items-center gap-3 px-4"
          aria-label="回首頁"
        >
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8 shrink-0" />
          <span className="whitespace-nowrap text-lg font-extrabold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </a>

        <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="my-auto space-y-6">
            {NAV_SECTIONS.flatMap(section => section.items).map(renderSideItem)}
          </div>
        </nav>

        <div className="px-2 pb-4">
          {loggedIn && (
            <button
              type="button"
              onClick={() => setTopupOpen(true)}
              aria-label="PM幣儲值"
              className="mb-1 flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center">
                <TokenBadge className="shrink-0" />
              </span>
              <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
                {tokenBalance.toLocaleString()} PM
              </span>
            </button>
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={openSettings}
              aria-label="偏好設定"
              className="mb-1 flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center">
                <Settings size={22} strokeWidth={1.5} />
              </span>
              <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
                偏好設定
              </span>
            </button>
          )}
          {loggedIn ? (
            <DropdownMenu onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="使用者選單"
                  className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:-translate-y-0.5 hover:bg-brand-subtle"
                >
                  <span className="relative shrink-0 shadow-md rounded-full">
                    <Avatar initial={avatarInitial} color={avatarColor} size="md" />
                    <PresenceDot status={presenceStatus} className="absolute bottom-0 right-0 h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">
                    <span className="block truncate text-sm font-extrabold text-ink">{userName}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                alignOffset={16}
                sideOffset={10}
                className="w-40"
                onCloseAutoFocus={e => e.preventDefault()}
              >
                <DropdownMenuItem onClick={openProfile}>
                  <User size={16} strokeWidth={1.5} className="shrink-0" />
                  個人資料
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openCreditScore}>
                  <ShieldCheck size={16} strokeWidth={1.5} className="shrink-0" />
                  信用分數
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openReviews}>
                  <Star size={16} strokeWidth={1.5} className="shrink-0" />
                  我的評價
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  disabled={loggingOut}
                  className="text-danger data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger"
                >
                  <LogOut size={16} strokeWidth={1.5} className="shrink-0" />
                  {loggingOut ? '登出中…' : '登出'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? '切換成淺色模式' : '切換成深色模式'}
                className="grid h-14 flex-1 place-items-center rounded-2xl text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
              >
                {theme === 'dark' ? <Sun size={22} strokeWidth={1.5} /> : <Moon size={22} strokeWidth={1.5} />}
              </button>
              <a
                href="/login"
                onClick={closeAll}
                aria-label="登入會員"
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
              >
                <LogIn size={20} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate whitespace-nowrap text-sm font-extrabold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 group-data-[force-open=true]/nav:opacity-100">登入會員</span>
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
