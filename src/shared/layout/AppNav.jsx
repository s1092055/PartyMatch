import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, Compass, Heart, LayoutGrid, Lock, LogIn, LogOut, MessageSquare, PlusCircle, Search, Settings, UserCircle2, Zap } from 'lucide-react'
import { toast } from '../utils/toast'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import { NAV_SECTIONS } from '../constants/nav'
import { TokenBadge } from '../ui/TokenAmount'
import TopupModal from '../ui/TopupModal'

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
  const [myMenuOpen, setMyMenuOpen] = useState(false)
  const myMenuRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [desktopMenuPos, setDesktopMenuPos] = useState(null)
  const desktopMenuRef = useRef(null)
  const desktopAvatarRef = useRef(null)

  useEffect(() => {
    if (!myMenuOpen) return
    function handleOutside(e) {
      if (myMenuRef.current && !myMenuRef.current.contains(e.target)) setMyMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [myMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleOutside(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!desktopMenuOpen) return
    function handleOutside(e) {
      if (
        desktopMenuRef.current && !desktopMenuRef.current.contains(e.target) &&
        desktopAvatarRef.current && !desktopAvatarRef.current.contains(e.target)
      ) setDesktopMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [desktopMenuOpen])

  function toggleDesktopMenu() {
    if (!desktopMenuOpen && desktopAvatarRef.current) {
      const rect = desktopAvatarRef.current.getBoundingClientRect()
      setDesktopMenuPos({ left: rect.right + 10, bottom: window.innerHeight - rect.bottom })
    }
    setDesktopMenuOpen(v => !v)
  }

  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const avatarInitial = userName[0] ?? 'U'
  const avatarColor = currentUser?.avatarColor ?? null

  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [topupOpen, setTopupOpen] = useState(false)

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
      <div className="fixed top-6 z-50 hidden items-start gap-2 md:flex lg:top-8" style={{ right: 'calc(1.5rem + var(--scrollbar-compensation, 0px))' }}>
        {/* 通知 + 訊息垂直排 */}
        <div className="flex flex-col gap-1 rounded-2xl border border-white/40 bg-slate-100/70 p-1.5 shadow-md backdrop-blur-md">
          <button
            onClick={openNotify}
            className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-2 transition-all hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
            aria-label="通知"
          >
            <Bell size={18} strokeWidth={2} />
            <Badge count={unreadNotifs} />
          </button>
          {loggedIn ? (
            <button
              onClick={openMessages}
              className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-2 transition-all hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
              aria-label="訊息"
            >
              <MessageSquare size={18} strokeWidth={2} />
              <Badge count={unreadMsgs} />
            </button>
          ) : (
            <button
              type="button"
              aria-disabled="true"
              aria-label={`訊息，${LOCKED_MESSAGE}`}
              onClick={e => preventLockedAction(e)}
              className="group/locked relative grid h-9 w-9 cursor-not-allowed place-items-center rounded-xl text-ink-2 opacity-40"
            >
              <MessageSquare size={18} strokeWidth={2} />
              <LockedHint className="right-full top-1/2 mr-2 -translate-y-1/2" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop avatar dropdown — portal */}
      {desktopMenuOpen && loggedIn && desktopMenuPos && createPortal(
        <div
          ref={desktopMenuRef}
          className="fixed z-[100] w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
          style={{ left: desktopMenuPos.left, bottom: desktopMenuPos.bottom }}
        >
          {/* 使用者資訊 */}
          <div className="flex items-center gap-3 px-4 py-4">
            <span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-md"
              style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
            >
              {avatarInitial}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <p className="min-w-0 truncate text-sm font-extrabold text-ink">{userName}</p>
          </div>

          {/* PM 幣餘額 */}
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl bg-raised px-3 py-2.5">
            <TokenBadge className="shrink-0" />
            <span className="flex-1 text-sm font-bold text-ink">{tokenBalance.toLocaleString()} PM</span>
            <button
              onClick={() => { setDesktopMenuOpen(false); setTopupOpen(true) }}
              className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-brand-hover active:opacity-80"
            >
              加值
            </button>
          </div>

          <div className="border-t border-line-subtle" />

          {/* 帳號設定 */}
          <a
            href="/account"
            onClick={() => setDesktopMenuOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            <Settings size={17} strokeWidth={2} className="shrink-0 text-ink-3" />
            前往帳號設定
          </a>

          <div className="border-t border-line-subtle" />

          {/* 登出 */}
          <button
            onClick={() => { setDesktopMenuOpen(false); useAuthStore.getState().logout(); navigate('/login', { replace: true }) }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
          >
            <LogOut size={17} strokeWidth={2} className="shrink-0" />
            登出
          </button>
        </div>,
        document.body
      )}

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
            <button
              ref={desktopAvatarRef}
              onClick={toggleDesktopMenu}
              aria-label="個人選單"
              aria-expanded={desktopMenuOpen}
              className={`flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised ${desktopMenuOpen ? 'bg-raised' : ''}`}
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
            </button>
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

      {/* Mobile / Tablet header */}
      <div ref={mobileMenuRef} className="fixed left-3 right-3 top-3 z-50 md:hidden">
        <header className="flex h-14 items-center justify-between rounded-2xl border border-white/40 bg-slate-100/80 px-4 shadow-sm backdrop-blur-md">
          <a href="/" className="flex items-center gap-2" aria-label="回首頁">
            <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
            <span className="text-[1rem] font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
          </a>
          <div className="flex items-center gap-1">
            {/* 通知按鈕 */}
            <button
              onClick={openNotify}
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
              aria-label="通知"
            >
              <Bell size={20} strokeWidth={2} />
              <Badge count={unreadNotifs} />
            </button>
            {/* 頭像按鈕 / 登入按鈕 */}
            {loggedIn ? (
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="個人選單"
                aria-expanded={mobileMenuOpen}
                className="relative ml-1 shrink-0"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
                  style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
                >
                  {avatarInitial}
                </span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </button>
            ) : (
              <a
                href="/login"
                aria-label="前往登入"
                className="relative ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-ink-3 transition-colors hover:bg-brand-subtle hover:text-brand"
              >
                <UserCircle2 size={22} strokeWidth={1.8} />
              </a>
            )}
          </div>
        </header>

        {/* Avatar dropdown */}
        {mobileMenuOpen && loggedIn && (
          <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            {/* 使用者資訊 */}
            <div className="flex items-center gap-3 px-4 py-4">
              <span
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-md"
                style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
              >
                {avatarInitial}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <p className="min-w-0 truncate text-sm font-extrabold text-ink">{userName}</p>
            </div>

            {/* PM 幣餘額 */}
            <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl bg-raised px-3 py-2.5">
              <TokenBadge className="shrink-0" />
              <span className="flex-1 text-sm font-bold text-ink">{tokenBalance.toLocaleString()} PM</span>
              <button
                onClick={() => { setMobileMenuOpen(false); setTopupOpen(true) }}
                className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-brand-hover active:opacity-80"
              >
                加值
              </button>
            </div>

            <div className="border-t border-line-subtle" />

            {/* 帳號設定 */}
            <a
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
            >
              <Settings size={17} strokeWidth={2} className="shrink-0 text-ink-3" />
              前往帳號設定
            </a>

            <div className="border-t border-line-subtle" />

            {/* 登出 */}
            <button
              onClick={() => { setMobileMenuOpen(false); useAuthStore.getState().logout(); navigate('/login', { replace: true }) }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
            >
              <LogOut size={17} strokeWidth={2} className="shrink-0" />
              登出
            </button>
          </div>
        )}
      </div>

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />

      {/* Mobile / Tablet bottom dock */}
      <nav
        className="fixed left-3 right-3 z-50 rounded-2xl border border-white/40 bg-slate-100/80 shadow-sm backdrop-blur-md md:hidden"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex h-16 items-stretch">

          {/* 探索 */}
          <a
            href="/explore"
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold transition-colors ${pathname === '/explore' ? 'text-brand' : 'text-ink-3'}`}
          >
            <Compass size={22} strokeWidth={2.1} />
            探索
            <span className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-brand transition-opacity ${pathname === '/explore' ? 'opacity-100' : 'opacity-0'}`} />
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

          {/* 我的 — dropdown */}
          <div ref={myMenuRef} className="relative flex flex-1 flex-col items-center justify-center">
            <span className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-brand transition-opacity ${(pathname.startsWith('/my-groups') || pathname === '/favorites') ? 'opacity-100' : 'opacity-0'}`} />
            {/* 向上展開 dropdown */}
            {myMenuOpen && loggedIn && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-1 rounded-2xl border border-white/40 bg-slate-100/95 p-1.5 shadow-popover backdrop-blur-md">
                <a
                  href="/my-groups"
                  onClick={() => setMyMenuOpen(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-raised ${pathname.startsWith('/my-groups') ? 'text-brand' : 'text-ink'}`}
                >
                  <LayoutGrid size={20} strokeWidth={2.1} />
                  我的群組
                </a>
                <a
                  href="/favorites"
                  onClick={() => setMyMenuOpen(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-raised ${pathname === '/favorites' ? 'text-brand' : 'text-ink'}`}
                >
                  <Heart size={20} strokeWidth={2.1} />
                  我的收藏
                </a>
              </div>
            )}
            {loggedIn ? (
              <button
                onClick={() => setMyMenuOpen(v => !v)}
                className={`flex flex-col items-center gap-1 text-[0.65rem] font-bold transition-colors ${(pathname.startsWith('/my-groups') || pathname === '/favorites') ? 'text-brand' : myMenuOpen ? 'text-brand' : 'text-ink-3'}`}
              >
                <LayoutGrid size={22} strokeWidth={2.1} />
                我的
              </button>
            ) : (
              <button
                onClick={e => preventLockedAction(e, '/my-groups')}
                className="flex flex-col items-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
              >
                <LayoutGrid size={22} strokeWidth={2.1} />
                我的
              </button>
            )}
          </div>

          {/* 訊息 */}
          {loggedIn ? (
            <button
              onClick={openMessages}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-colors active:text-brand"
            >
              <span className="relative">
                <MessageSquare size={22} strokeWidth={2.1} />
                <Badge count={unreadMsgs} />
              </span>
              訊息
            </button>
          ) : (
            <button
              onClick={e => preventLockedAction(e)}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
            >
              <MessageSquare size={22} strokeWidth={2.1} />
              訊息
            </button>
          )}

        </div>
      </nav>
    </>
  )
}
