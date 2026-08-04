import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Lock, LogIn, MessageSquare, Moon, Sun } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { NAV_SECTIONS } from '../nav'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { CountBadge, LockBadge, LockedHint, PresenceDot } from './navShared'
import { LOCKED_MESSAGE, getNavItemKey, isProtectedNavItem } from './navConstants'
import { useTheme } from '../../../components/theme-provider'

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
  preventLockedAction,
}) {
  const [lockedTip, setLockedTip] = useState(null)
  const { theme, setTheme } = useTheme()

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
            <Icon size={22} strokeWidth={2.1} />
            <LockBadge className="right-0 top-0" />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
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
            <item.icon size={22} strokeWidth={2.1} />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
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
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-[0.95rem] transition-all hover:-translate-y-0.5 ${
          isActive
            ? 'bg-brand font-extrabold text-white'
            : 'font-bold text-ink-2 hover:bg-brand-subtle hover:text-brand'
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center">
          <item.icon size={22} strokeWidth={2.1} />
        </span>
        <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
          {item.label}
        </span>
      </a>
    )
  }

  return (
    <>
      {/* Sidebar locked tooltip portal */}
      {lockedTip && createPortal(
        <span
          className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-popover"
          style={{ top: lockedTip.top, left: lockedTip.left }}
        >
          {LOCKED_MESSAGE}
        </span>,
        document.body
      )}

      {/* Desktop 通知按鈕 + PM幣顯示 — fixed top-right，PM幣寬度貼齊通知按鈕 */}
      <div className="fixed top-6 z-50 hidden flex-col items-stretch gap-2 lg:flex lg:top-8" style={{ right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        <button
          onClick={openNotify}
          className="relative flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
          aria-label="通知"
        >
          <Bell size={16} strokeWidth={2} />
          通知
          <CountBadge count={unreadNotifs} />
        </button>

        {loggedIn && (
          <button
            onClick={() => setTopupOpen(true)}
            aria-label="PM幣儲值"
            className="flex h-10 items-center gap-2 rounded-lg bg-brand px-3 text-left text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
          >
            <TokenBadge className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-xs font-bold leading-none">
              {tokenBalance.toLocaleString()}
            </span>
          </button>
        )}
      </div>

      {/* Desktop 訊息按鈕 — fixed bottom-right，對齊 sidebar 頭像 */}
      <div className="fixed z-50 hidden lg:block" style={{ bottom: '2.25rem', right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        {loggedIn ? (
          <button
            onClick={openMessages}
            className="relative flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            aria-label="訊息"
          >
            <MessageSquare size={16} strokeWidth={2} />
            訊息
            <CountBadge count={unreadMsgs} className="-right-1.5 -top-1.5" />
          </button>
        ) : (
          <button
            type="button"
            aria-disabled="true"
            aria-label={`訊息，${LOCKED_MESSAGE}`}
            onClick={e => preventLockedAction(e)}
            className="group/locked relative flex h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white opacity-40 shadow-sm"
          >
            <MessageSquare size={16} strokeWidth={2} />
            訊息
            <LockBadge className="right-1 top-1" />
            <LockedHint className="right-full top-1/2 mr-2 -translate-y-1/2" />
          </button>
        )}
      </div>

      {/* Desktop floating sidebar */}
      <aside
        className="group/nav fixed bottom-4 left-4 top-4 z-50 hidden w-16 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-[width] duration-300 ease-out hover:w-64 focus-within:w-64 lg:flex"
      >
        <a
          href="/"
          onClick={closeAll}
          className="flex h-16 shrink-0 items-center gap-3 px-4"
          aria-label="回首頁"
        >
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8 shrink-0" />
          <span className="whitespace-nowrap text-[1.1rem] font-extrabold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </a>

        <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="my-auto space-y-6">
            {NAV_SECTIONS.flatMap(section => section.items).map(renderSideItem)}
          </div>
        </nav>

        <div className="px-2 pb-4">
          <button
            type="button"
            onClick={e => { setTheme(theme === 'dark' ? 'light' : 'dark'); e.currentTarget.blur() }}
            aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
            className="mb-1 flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center">
              {theme === 'dark' ? <Sun size={22} strokeWidth={2.1} /> : <Moon size={22} strokeWidth={2.1} />}
            </span>
            <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
              {theme === 'dark' ? '淺色模式' : '深色模式'}
            </span>
          </button>
          {loggedIn ? (
            <a
              href="/account"
              onClick={closeAll}
              aria-label="我的帳號"
              className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised"
            >
              <span className="relative shrink-0 shadow-md rounded-full">
                <Avatar initial={avatarInitial} color={avatarColor} size="md" />
                <PresenceDot status={presenceStatus} className="absolute bottom-0 right-0 h-3 w-3" />
              </span>
              <span className="min-w-0 flex-1 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                <span className="block truncate text-sm font-extrabold text-ink">{userName}</span>
              </span>
            </a>
          ) : (
            <a
              href="/login"
              onClick={closeAll}
              aria-label="登入"
              className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center">
                <LogIn size={22} strokeWidth={2.1} />
              </span>
              <span className="min-w-0 flex-1 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                <span className="block truncate text-sm font-extrabold">登入</span>
              </span>
            </a>
          )}
        </div>
      </aside>
    </>
  )
}
