import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Bell, Lock, LogIn, MessageSquare } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { NAV_SECTIONS } from '../../constants/nav'
import { TokenBadge } from '../../ui/TokenAmount'
import { Badge, LockedHint } from './navShared'
import { LOCKED_MESSAGE, getNavItemKey, isProtectedNavItem } from './navConstants'

export default function DesktopSidebar({
  loggedIn,
  pathname,
  userName,
  avatarInitial,
  avatarColor,
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
  const [searchParams] = useSearchParams()
  const [lockedTip, setLockedTip] = useState(null)

  function isGuestLocked(item) {
    return !loggedIn && isProtectedNavItem(item)
  }

  function renderSideItem(item) {
    if (isGuestLocked(item)) {
      const Icon = item.icon ?? Lock
      const redirectTo = item.type === 'create' ? '/create-group' : item.to

      return (
        <button
          key={getNavItemKey(item)}
          type="button"
          aria-label={`${item.label}，${LOCKED_MESSAGE}`}
          onClick={e => preventLockedAction(e, redirectTo)}
          onMouseEnter={e => setLockedTip({ top: e.clientY + 14, left: e.clientX + 12 })}
          onMouseMove={e => setLockedTip({ top: e.clientY + 14, left: e.clientX + 12 })}
          onMouseLeave={() => setLockedTip(null)}
          className="relative flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-4 transition-colors hover:bg-raised"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center">
            <Icon size={22} strokeWidth={2.1} />
            <Lock size={11} strokeWidth={2.3} className="absolute right-0 top-0 rounded-full bg-canvas text-ink-4" />
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
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white active:scale-[0.96]">
          <span className="grid h-9 w-9 shrink-0 place-items-center">
            <item.icon size={22} strokeWidth={2.1} />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
            {item.label}
          </span>
        </button>
      )
    }

    const isActive = pathname === item.to && (
      !item.view ||
      searchParams.get('view') === item.view ||
      (!searchParams.get('view') && item.view === 'member')
    )
    return (
      <a
        key={item.view ? `${item.to}?view=${item.view}` : item.to}
        href={item.view ? `${item.to}?view=${item.view}` : item.to}
        onClick={closeAll}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-[0.95rem] transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
          isActive
            ? 'bg-brand-subtle font-extrabold text-brand'
            : 'font-bold text-ink-2 hover:bg-brand hover:text-white'
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
          className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-white shadow-lg"
          style={{ top: lockedTip.top, left: lockedTip.left }}
        >
          {LOCKED_MESSAGE}
        </span>,
        document.body
      )}

      {/* Desktop 通知按鈕 — fixed top-right */}
      <div className="fixed top-6 z-50 hidden md:block lg:top-8" style={{ right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        <button
          onClick={openNotify}
          className="relative flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white active:scale-[0.96]"
          aria-label="通知"
        >
          <Bell size={16} strokeWidth={2} />
          通知
          <Badge count={unreadNotifs} />
        </button>
      </div>

      {/* Desktop 訊息按鈕 — fixed bottom-right，對齊 sidebar 頭像 */}
      <div className="fixed z-50 hidden md:block" style={{ bottom: '2.25rem', right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        {loggedIn ? (
          <button
            onClick={openMessages}
            className="relative flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white active:scale-[0.96]"
            aria-label="訊息"
          >
            <MessageSquare size={16} strokeWidth={2} />
            訊息
            <Badge count={unreadMsgs} />
          </button>
        ) : (
          <button
            type="button"
            aria-disabled="true"
            aria-label={`訊息，${LOCKED_MESSAGE}`}
            onClick={e => preventLockedAction(e)}
            className="group/locked relative flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink-2 opacity-40 shadow-sm"
          >
            <MessageSquare size={16} strokeWidth={2} />
            訊息
            <LockedHint className="right-full top-1/2 mr-2 -translate-y-1/2" />
          </button>
        )}
      </div>

      {/* Desktop floating sidebar */}
      <aside
        className="group/nav fixed bottom-4 left-4 top-4 z-50 hidden w-16 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-[width] duration-300 ease-out hover:w-56 focus-within:w-56 md:flex"
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
          {loggedIn && (
            <div className="mb-2 flex h-10 w-full items-center gap-2 overflow-hidden rounded-xl bg-brand-subtle px-3 opacity-0 transition-all duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
              <TokenBadge className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-ink">
                {tokenBalance.toLocaleString()} PM
              </span>
              <button
                onClick={() => { document.activeElement?.blur(); setTopupOpen(true) }}
                className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white transition-colors hover:bg-brand-hover"
              >
                加值
              </button>
            </div>
          )}
          {loggedIn ? (
            <a
              href="/account"
              onClick={closeAll}
              aria-label="帳號設定"
              className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised"
            >
              <span
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-white shadow-md"
                style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
              >
                {avatarInitial}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <span className="min-w-0 flex-1 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                <span className="block truncate text-sm font-extrabold text-ink">{userName}</span>
              </span>
            </a>
          ) : (
            <a
              href="/login"
              onClick={closeAll}
              className="flex h-12 w-full items-center gap-3 rounded-2xl bg-brand px-1 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.96] hover:bg-brand-hover"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center">
                <LogIn size={20} strokeWidth={2.1} />
              </span>
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                登入
              </span>
            </a>
          )}
        </div>
      </aside>
    </>
  )
}
