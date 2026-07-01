import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, Compass, LayoutGrid, Lock, LogIn, MessageSquare, PlusCircle, Search, Zap } from 'lucide-react'
import { toast } from '../utils/toast'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import { NAV_SECTIONS } from '../constants/nav'

const LOCKED_MESSAGE = '請先登入會員'

function Badge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[0.6rem] font-black leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

const PROTECTED_NAV_ROUTES = new Set([
  '/my-groups',
  '/favorites',
  '/account',
])

function getNavItemKey(item) {
  return item.to ?? item.type
}

function isProtectedNavItem(item) {
  return item.type === 'create' || PROTECTED_NAV_ROUTES.has(item.to)
}

function LockedHint({ className = '' }) {
  return (
    <span
      className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-popover transition-opacity duration-150 group-hover/locked:opacity-100 group-focus-visible/locked:opacity-100 ${className}`}
    >
      {LOCKED_MESSAGE}
    </span>
  )
}

export default function AppNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const [lockedTip, setLockedTip] = useState(null)

  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const userEmail = currentUser?.email ?? ''
  const avatarInitial = userName[0] ?? 'U'
  const avatarColor = currentUser?.avatarColor ?? null

  const unreadNotifs = useNotificationStore(s => loggedIn && currentUser?.id ? s.getUnreadCount(currentUser.id) : 0)
  const unreadMsgs = useConversationStore(s => loggedIn && currentUser?.id ? s.getUnreadMsgCount(currentUser.id) : 0)

  function closeAll() { document.activeElement?.blur() }

  function openSearch() {
    document.activeElement?.blur()
    window.dispatchEvent(new CustomEvent('pm:open-search'))
  }

  function openCreate() {
    closeAll()
    if (!loggedIn) return
    window.dispatchEvent(new CustomEvent('pm:open-create'))
  }

  function openNotify() {
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-notify'))
  }

  function openMessages() {
    if (!loggedIn) return
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-messages'))
  }

  function openMatch() {
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-match'))
  }

  function preventLockedAction(e, redirectTo) {
    e.preventDefault()
    e.stopPropagation()
    closeAll()
    const target = redirectTo || '/'
    toast(LOCKED_MESSAGE, 'info', {
      action: {
        label: '前往登入',
        onClick: () => navigate(`/login?redirectTo=${encodeURIComponent(target)}`),
      },
    })
  }

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

    if (item.type === 'search') {
      return (
        <button key="search" onClick={openSearch} aria-label="搜尋"
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand active:scale-[0.96]">
          <span className="grid h-9 w-9 shrink-0 place-items-center">
            <Search size={22} strokeWidth={2.1} />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
            搜尋
          </span>
        </button>
      )
    }

    if (item.type === 'create') {
      return (
        <button key="create" onClick={openCreate} aria-label={item.label}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand active:scale-[0.96]">
          <span className="grid h-9 w-9 shrink-0 place-items-center">
            <item.icon size={22} strokeWidth={2.1} />
          </span>
          <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
            {item.label}
          </span>
        </button>
      )
    }

    if (item.type === 'match') {
      return (
        <button key="match" onClick={openMatch} aria-label={item.label}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand active:scale-[0.96]">
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

  function renderMessageButton({ className, iconSize, tooltipClassName }) {
    if (!loggedIn) {
      return (
        <button
          type="button"
          aria-disabled="true"
          aria-label={`訊息，${LOCKED_MESSAGE}`}
          title={LOCKED_MESSAGE}
          onClick={preventLockedAction}
          className={`group/locked relative cursor-not-allowed !text-ink-4 hover:!translate-y-0 hover:!scale-100 hover:!text-ink-4 active:!scale-100 ${className}`}
        >
          <MessageSquare size={iconSize} strokeWidth={2} className="opacity-55" />
          <Lock size={13} strokeWidth={2.3} className="absolute right-2 top-2 rounded-full bg-canvas" />
          <LockedHint className={tooltipClassName} />
        </button>
      )
    }

    return (
      <button
        onClick={openMessages}
        className={className}
        aria-label="訊息"
      >
        <MessageSquare size={iconSize} strokeWidth={2} />
      </button>
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

      {/* Desktop action buttons — fixed top-right */}
      <div className="fixed top-6 z-50 hidden flex-col gap-3 md:flex lg:top-8" style={{ right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        <button
          onClick={openNotify}
          className="relative grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-slate-100/70 shadow-md backdrop-blur-md text-ink-2 transition-all hover:scale-105 hover:bg-slate-100/90 hover:text-ink active:scale-95"
          aria-label="通知"
        >
          <Bell size={20} strokeWidth={2} />
          <Badge count={unreadNotifs} />
        </button>
        <div className="relative">
          {renderMessageButton({
            className: 'grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-slate-100/70 shadow-md backdrop-blur-md text-ink-2 transition-all hover:scale-105 hover:bg-slate-100/90 hover:text-ink active:scale-95',
            iconSize: 20,
            tooltipClassName: 'right-full top-1/2 mr-2 -translate-y-1/2',
          })}
          <Badge count={unreadMsgs} />
        </div>
      </div>

      {/* Desktop floating sidebar */}
      <aside
        className="group/nav fixed bottom-4 left-4 top-4 z-50 hidden w-16 flex-col overflow-hidden rounded-2xl border border-white/40 bg-slate-100/80 shadow-sm backdrop-blur-md transition-[width] duration-300 ease-out hover:w-56 focus-within:w-56 md:flex"
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
          {loggedIn ? (
            <Link
              to="/account"
              onClick={closeAll}
              className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised"
              aria-label="前往帳號中心"
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
                <span className="block truncate text-xs font-medium text-ink-3">{userEmail}</span>
              </span>
            </Link>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Link
                to="/login"
                onClick={closeAll}
                className="flex h-12 w-full items-center gap-3 rounded-2xl bg-brand px-1 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.96] hover:bg-brand-hover"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center">
                  <LogIn size={20} strokeWidth={2.1} />
                </span>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                  登入
                </span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/30 bg-slate-100/80 px-4 backdrop-blur-md md:hidden">
        <a href="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
          <span className="text-[1rem] font-extrabold">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </a>
        <div className="flex items-center gap-1">
          <button
            onClick={openSearch}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="搜尋"
          >
            <Search size={22} strokeWidth={2} />
          </button>
          {loggedIn ? (
            <button
              onClick={openMessages}
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
              aria-label="訊息"
            >
              <MessageSquare size={22} strokeWidth={2} />
              <Badge count={unreadMsgs} />
            </button>
          ) : (
            <button
              type="button"
              aria-disabled="true"
              aria-label={`訊息，${LOCKED_MESSAGE}`}
              onClick={preventLockedAction}
              className="relative grid h-10 w-10 cursor-not-allowed place-items-center rounded-full text-ink-3 opacity-40"
            >
              <MessageSquare size={22} strokeWidth={2} />
            </button>
          )}
          <button
            onClick={openNotify}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="通知中心"
          >
            <Bell size={22} strokeWidth={2} />
            <Badge count={unreadNotifs} />
          </button>
        </div>
      </header>

      {/* Mobile bottom dock */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/30 bg-slate-100/80 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-16 items-stretch">

          {/* 探索 */}
          <a
            href="/explore"
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold transition-colors ${pathname === '/explore' ? 'text-brand' : 'text-ink-3'}`}
          >
            <Compass size={22} strokeWidth={2.1} />
            探索
          </a>

          {/* 快速配對 */}
          <button
            onClick={openMatch}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-colors active:text-brand"
          >
            <Zap size={22} strokeWidth={2.1} />
            配對
          </button>

          {/* 建立群組 — 中央圓形按鈕 */}
          <div className="flex flex-1 flex-col items-center justify-center gap-1">
            {loggedIn ? (
              <button
                onClick={openCreate}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-all active:scale-95 hover:bg-brand-hover"
                aria-label="建立群組"
              >
                <PlusCircle size={22} strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={e => preventLockedAction(e, '/create-group')}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-md opacity-50"
                aria-label={`建立群組，${LOCKED_MESSAGE}`}
              >
                <PlusCircle size={22} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* 我的 */}
          {loggedIn ? (
            <a
              href="/my-groups"
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold transition-colors ${pathname.startsWith('/my-groups') ? 'text-brand' : 'text-ink-3'}`}
            >
              <LayoutGrid size={22} strokeWidth={2.1} />
              我的
            </a>
          ) : (
            <button
              onClick={e => preventLockedAction(e, '/my-groups')}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
            >
              <LayoutGrid size={22} strokeWidth={2.1} />
              我的
            </button>
          )}

          {/* 帳號 / 登入 */}
          {loggedIn ? (
            <button
              onClick={() => navigate('/account')}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold transition-colors ${pathname === '/account' ? 'text-brand' : 'text-ink-3'}`}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-black text-white shadow"
                style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
              >
                {avatarInitial}
              </span>
              帳號
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-colors active:text-brand"
            >
              <LogIn size={22} strokeWidth={2.1} />
              登入
            </button>
          )}

        </div>
      </nav>
    </>
  )
}
