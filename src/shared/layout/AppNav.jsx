import { Fragment, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Lock, LogIn, Menu, MessageSquare, Search, X } from 'lucide-react'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import { NAV_SECTIONS } from '../constants/nav'
import { useScrollLock } from '../utils/hooks'

const LOCKED_MESSAGE = '請先登入會員'

function Badge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[0.6rem] font-black leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function RedDot({ show }) {
  if (!show) return null
  return <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
}

const PROTECTED_NAV_ROUTES = new Set([
  '/my-subscriptions',
  '/favorites',
  '/account',
  '/manage-groups',
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

export default function AppNav({ variant = 'side' }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const userEmail = currentUser?.email ?? ''
  const avatarInitial = userName[0] ?? 'U'
  const avatarColor = currentUser?.avatarColor ?? null

  const [drawerOpen, setDrawerOpen] = useState(false)
  const unreadNotifs = useNotificationStore(s => loggedIn && currentUser?.id ? s.getUnreadCount(currentUser.id) : 0)
  const unreadMsgs = useConversationStore(s => loggedIn && currentUser?.id ? s.getUnreadMsgCount(currentUser.id) : 0)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { setDrawerOpen(false) }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useScrollLock(drawerOpen)

  function closeAll() { setDrawerOpen(false); document.activeElement?.blur() }

  function openSearch() {
    setDrawerOpen(false)
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
    const target = redirectTo || '/'
    closeAll()
    navigate(`/login?redirectTo=${encodeURIComponent(target)}`)
  }

  function isGuestLocked(item) {
    return !loggedIn && isProtectedNavItem(item)
  }

  function renderDrawerItem(item) {
    if (isGuestLocked(item)) {
      const Icon = item.icon ?? Lock
      const redirectTo = item.type === 'create' ? '/create-group' : item.to

      return (
        <button
          key={getNavItemKey(item)}
          type="button"
          aria-label={`${item.label}，${LOCKED_MESSAGE}`}
          title={LOCKED_MESSAGE}
          onClick={e => preventLockedAction(e, redirectTo)}
          className="group/locked relative flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-4 transition-colors hover:!translate-y-0 hover:bg-raised active:!scale-100"
        >
          <Icon size={20} strokeWidth={2.1} />
          <span className="flex-1 text-left">{item.label}</span>
          <Lock size={15} strokeWidth={2.2} className="shrink-0" />
          <LockedHint className="right-3 top-1/2 -translate-y-1/2" />
        </button>
      )
    }

    if (item.type === 'search') {
      return (
        <button key="search" onClick={openSearch}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
          <Search size={20} strokeWidth={2.1} />
          搜尋
        </button>
      )
    }

    if (item.type === 'create') {
      return (
        <button key="create" onClick={openCreate}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
          <item.icon size={20} strokeWidth={2.1} />
          {item.label}
        </button>
      )
    }

    if (item.type === 'match') {
      return (
        <button key="match" onClick={openMatch}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
          <item.icon size={20} strokeWidth={2.1} />
          {item.label}
        </button>
      )
    }

    const isActive = pathname === item.to
    return (
      <a
        key={item.to}
        href={item.to}
        onClick={closeAll}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
          isActive
            ? 'bg-brand-subtle font-extrabold text-brand'
            : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
        }`}
      >
        <item.icon size={20} strokeWidth={2.1} />
        {item.label}
      </a>
    )
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
          title={LOCKED_MESSAGE}
          onClick={e => preventLockedAction(e, redirectTo)}
          className="group/locked relative flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-4 transition-colors hover:!translate-y-0 hover:bg-raised active:!scale-100"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center">
            <Icon size={22} strokeWidth={2.1} />
            <Lock
              size={11}
              strokeWidth={2.3}
              className="absolute right-0 top-0 rounded-full bg-white text-ink-4"
            />
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
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:bg-raised hover:text-brand">
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
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:bg-raised hover:text-brand">
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
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:bg-raised hover:text-brand">
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
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-[0.95rem] transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
          isActive
            ? 'bg-brand-subtle font-extrabold text-brand'
            : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
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
          <Lock size={13} strokeWidth={2.3} className="absolute right-2 top-2 rounded-full bg-white" />
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

  if (variant === 'top') {
    return (
      <>
        {/* Floating menu button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed right-6 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white shadow-sm text-ink-2 transition-all hover:bg-raised hover:text-ink"
          aria-label="開啟選單"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        {/* Shared drawer overlay */}
        <div
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        {/* Shared drawer */}
        <div
          className={`fixed inset-y-0 right-0 z-[51] flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
            <span className="text-base font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-full text-ink-3 transition-all hover:bg-raised hover:text-ink"
              aria-label="關閉選單"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section, i) => (
              <Fragment key={section.label}>
                {i > 0 && <div className="my-2 h-px bg-line-subtle" />}
                <p className="mb-1 mt-1 px-3 text-xs font-extrabold uppercase tracking-widest text-ink-4">
                  {section.label}
                </p>
                {section.items.map(renderDrawerItem)}
              </Fragment>
            ))}
          </nav>

          <div className="shrink-0 border-t border-line px-3 pb-8 pt-3">
            {loggedIn ? (
              <Link
                to="/account"
                onClick={closeAll}
                className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-all hover:bg-raised"
                aria-label="前往帳號中心"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-white shadow-md"
                  style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
                >
                  {avatarInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{userName}</p>
                  <p className="truncate text-xs text-ink-3">{userEmail}</p>
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={closeAll}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.96] hover:bg-brand-hover"
              >
                <LogIn size={18} strokeWidth={2.1} />
                登入
              </Link>
            )}
          </div>
        </div>

      </>
    )
  }

  return (
    <>
      {/* Desktop action buttons — fixed top-right */}
      <div className="fixed top-6 z-50 hidden flex-col gap-3 md:flex lg:top-8" style={{ right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        <button
          onClick={openNotify}
          className="relative grid h-12 w-12 place-items-center rounded-full border border-line bg-white shadow-md text-ink-2 transition-all hover:scale-105 hover:bg-raised hover:text-ink active:scale-95"
          aria-label="通知"
        >
          <Bell size={20} strokeWidth={2} />
          <Badge count={unreadNotifs} />
        </button>
        <div className="relative">
          {renderMessageButton({
            className: 'grid h-12 w-12 place-items-center rounded-full border border-line bg-white shadow-md text-ink-2 transition-all hover:scale-105 hover:bg-raised hover:text-ink active:scale-95',
            iconSize: 20,
            tooltipClassName: 'right-full top-1/2 mr-2 -translate-y-1/2',
          })}
          <Badge count={unreadMsgs} />
        </div>
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
          <div className="my-auto space-y-0.5">
            {NAV_SECTIONS.map((section, i) => (
              <Fragment key={section.label}>
                {i > 0 && <div className="mx-2 my-2 h-px bg-line-subtle" />}
                <p className="mb-1 mt-1 whitespace-nowrap px-2 text-[0.6rem] font-extrabold uppercase tracking-widest text-ink-4 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                  {section.label}
                </p>
                {section.items.map(renderSideItem)}
              </Fragment>
            ))}
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
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
        <a href="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
        </a>
        <div className="flex items-center gap-1">
          <button
            onClick={openNotify}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="通知中心"
          >
            <Bell size={22} strokeWidth={2} />
            <Badge count={unreadNotifs} />
          </button>
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="開啟選單"
          >
            <Menu size={22} strokeWidth={2} />
            <RedDot show={unreadMsgs > 0 && !drawerOpen} />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-[51] flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-base font-extrabold">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-full text-ink-3 transition-all hover:bg-raised hover:text-ink"
            aria-label="關閉選單"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* 訊息快捷按鈕 */}
          <div className="mb-3">
            {loggedIn ? (
              <button
                onClick={openMessages}
                className="relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-raised text-sm font-bold text-ink-2 transition-colors hover:bg-line-subtle hover:text-brand"
              >
                <MessageSquare size={18} strokeWidth={2.1} />
                訊息
                <Badge count={unreadMsgs} />
              </button>
            ) : (
              <button
                type="button"
                aria-disabled="true"
                title={LOCKED_MESSAGE}
                onClick={preventLockedAction}
                className="group/locked relative flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-raised text-sm font-bold text-ink-4"
              >
                <MessageSquare size={18} strokeWidth={2.1} className="opacity-55" />
                訊息
                <Lock size={11} strokeWidth={2.3} className="absolute right-2 top-2 rounded-full bg-raised text-ink-4" />
                <LockedHint className="left-1/2 top-full mt-1 -translate-x-1/2" />
              </button>
            )}
          </div>
          <div className="mb-2 h-px bg-line-subtle" />

          {NAV_SECTIONS.map((section, i) => (
            <Fragment key={section.label}>
              {i > 0 && <div className="my-2 h-px bg-line-subtle" />}
              <p className="mb-1 mt-1 px-3 text-xs font-extrabold uppercase tracking-widest text-ink-4">
                {section.label}
              </p>
              {section.items.map(renderDrawerItem)}
            </Fragment>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line px-3 pb-8 pt-3">
          {loggedIn ? (
            <Link
              to="/account"
              onClick={closeAll}
              className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-all hover:bg-raised"
              aria-label="前往帳號中心"
            >
              <span
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-white shadow-md"
                style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
              >
                {avatarInitial}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">{userName}</p>
                <p className="truncate text-xs text-ink-3">{userEmail}</p>
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={closeAll}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.96] hover:bg-brand-hover"
            >
              <LogIn size={18} strokeWidth={2.1} />
              登入
            </Link>
          )}
        </div>
      </div>

    </>
  )
}
