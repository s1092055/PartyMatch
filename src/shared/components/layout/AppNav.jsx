import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogIn, LogOut, Menu, MessageSquare, Search, X } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { getCurrentUser, isAuthenticated, logoutUser } from '../../stores/authStore'
import { NAV_SECTIONS } from '../../constants/nav'
import { useClickOutside, useScrollLock } from '../../utils/hooks'

export default function AppNav({ variant = 'side' }) {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const currentUser = getCurrentUser()
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const userEmail = currentUser?.email ?? ''
  const avatarInitial = userName[0] ?? 'U'
  const avatarColor = currentUser?.avatarColor ?? null

  const [activePanel, setActivePanel] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const userMenuRef      = useRef(null)
  const userMenuMobileRef = useRef(null)

  const showUserMenu = activePanel === 'userMenu'

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { setActivePanel(null); setDrawerOpen(false) }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useScrollLock(drawerOpen)

  useClickOutside(showUserMenu, [userMenuRef, userMenuMobileRef], () => setActivePanel(null))

  function closeAll() { setActivePanel(null); setDrawerOpen(false); document.activeElement?.blur() }

  function openSearch() {
    setDrawerOpen(false)
    document.activeElement?.blur()
    window.dispatchEvent(new CustomEvent('pm:open-search'))
  }

  function openCreate() {
    closeAll()
    if (!loggedIn) {
      navigate('/login?redirectTo=/create-group')
      return
    }
    window.dispatchEvent(new CustomEvent('pm:open-create'))
  }

  function openNotify() {
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-notify'))
  }

  function openMessages() {
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-messages'))
  }

  function openMatch() {
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-match'))
  }

  async function confirmLogout() {
    try { await logoutUser() } catch { /* proceed regardless */ }
    window.location.replace('/login')
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
                {section.items.map(item =>
                  item.type === 'search' ? (
                    <button key="search" onClick={openSearch}
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
                      <Search size={20} strokeWidth={2.1} />
                      搜尋
                    </button>
                  ) : item.type === 'create' ? (
                    <button key="create" onClick={openCreate}
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
                      <item.icon size={20} strokeWidth={2.1} />
                      {item.label}
                    </button>
                  ) : item.type === 'match' ? (
                    <button key="match" onClick={openMatch}
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
                      <item.icon size={20} strokeWidth={2.1} />
                      {item.label}
                    </button>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeAll}
                      className={({ isActive }) =>
                        `flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
                          isActive
                            ? 'bg-brand-subtle font-extrabold text-brand'
                            : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
                        }`
                      }
                    >
                      <item.icon size={20} strokeWidth={2.1} />
                      {item.label}
                    </NavLink>
                  )
                )}
              </Fragment>
            ))}
          </nav>

          <div className="shrink-0 border-t border-line px-3 pb-8 pt-3">
            {loggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setActivePanel(p => p === 'userMenu' ? null : 'userMenu')}
                  className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-all hover:bg-raised"
                  aria-label="開啟使用者選單"
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
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                  />
                </button>
                {showUserMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-popover">
                    <button
                      onClick={confirmLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-danger transition-all hover:bg-danger-subtle"
                    >
                      <LogOut size={16} />
                      登出
                    </button>
                  </div>
                )}
              </div>
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
          className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white shadow-md text-ink-2 transition-all hover:scale-105 hover:bg-raised hover:text-ink active:scale-95"
          aria-label="通知"
        >
          <Bell size={20} strokeWidth={2} />
        </button>
        <button
          onClick={openMessages}
          className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white shadow-md text-ink-2 transition-all hover:scale-105 hover:bg-raised hover:text-ink active:scale-95"
          aria-label="訊息"
        >
          <MessageSquare size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Desktop floating sidebar */}
      <aside
        className={`group/nav fixed bottom-4 left-4 top-4 z-50 hidden w-16 flex-col rounded-2xl border border-line bg-white shadow-sm transition-[width] duration-300 ease-out hover:w-56 focus-within:w-56 md:flex ${
          showUserMenu ? '' : 'overflow-hidden'
        }`}
      >
        <Link
          to="/"
          onClick={closeAll}
          className="flex h-16 shrink-0 items-center gap-3 px-4"
          aria-label="回首頁"
        >
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8 shrink-0" />
          <span className="whitespace-nowrap text-[1.1rem] font-extrabold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="my-auto space-y-0.5">
            {NAV_SECTIONS.map((section, i) => (
              <Fragment key={section.label}>
                {i > 0 && <div className="mx-2 my-2 h-px bg-line-subtle" />}
                <p className="mb-1 mt-1 whitespace-nowrap px-2 text-[0.6rem] font-extrabold uppercase tracking-widest text-ink-4 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                  {section.label}
                </p>
                {section.items.map(item =>
                  item.type === 'search' ? (
                    <button key="search" onClick={openSearch} aria-label="搜尋"
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:bg-raised hover:text-brand">
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <Search size={22} strokeWidth={2.1} />
                      </span>
                      <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                        搜尋
                      </span>
                    </button>
                  ) : item.type === 'create' ? (
                    <button key="create" onClick={openCreate} aria-label={item.label}
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:bg-raised hover:text-brand">
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <item.icon size={22} strokeWidth={2.1} />
                      </span>
                      <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                        {item.label}
                      </span>
                    </button>
                  ) : item.type === 'match' ? (
                    <button key="match" onClick={openMatch} aria-label={item.label}
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:bg-raised hover:text-brand">
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <item.icon size={22} strokeWidth={2.1} />
                      </span>
                      <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeAll}
                      className={({ isActive }) =>
                        `flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-[0.95rem] transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
                          isActive
                            ? 'bg-brand-subtle font-extrabold text-brand'
                            : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
                        }`
                      }
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <item.icon size={22} strokeWidth={2.1} />
                      </span>
                      <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                        {item.label}
                      </span>
                    </NavLink>
                  )
                )}
              </Fragment>
            ))}
          </div>
        </nav>

        <div className="px-2 pb-4">
          {loggedIn ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setActivePanel(p => p === 'userMenu' ? null : 'userMenu')}
                className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised"
                aria-label="開啟使用者選單"
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
              </button>

              {showUserMenu && (
                <div className="absolute bottom-0 left-[calc(100%+0.75rem)] w-52 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-popover">
                  <button
                    onClick={confirmLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-danger transition-all hover:bg-danger-subtle"
                  >
                    <LogOut size={16} />
                    登出
                  </button>
                </div>
              )}
            </div>
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
        <Link to="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={openNotify}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="通知"
          >
            <Bell size={20} strokeWidth={2} />
          </button>
          <button
            onClick={openMessages}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="訊息中心"
          >
            <MessageSquare size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="開啟選單"
          >
            <Menu size={22} strokeWidth={2} />
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
          {NAV_SECTIONS.map((section, i) => (
            <Fragment key={section.label}>
              {i > 0 && <div className="my-2 h-px bg-line-subtle" />}
              <p className="mb-1 mt-1 px-3 text-xs font-extrabold uppercase tracking-widest text-ink-4">
                {section.label}
              </p>
              {section.items.map(item =>
                item.type === 'search' ? (
                  <button key="search" onClick={openSearch}
                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
                    <Search size={20} strokeWidth={2.1} />
                    搜尋
                  </button>
                ) : item.type === 'create' ? (
                  <button key="create" onClick={openCreate}
                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
                    <item.icon size={20} strokeWidth={2.1} />
                    {item.label}
                  </button>
                ) : item.type === 'match' ? (
                  <button key="match" onClick={openMatch}
                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-all hover:bg-raised hover:text-brand">
                    <item.icon size={20} strokeWidth={2.1} />
                    {item.label}
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeAll}
                    className={({ isActive }) =>
                      `flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
                        isActive
                          ? 'bg-brand-subtle font-extrabold text-brand'
                          : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
                      }`
                    }
                  >
                    <item.icon size={20} strokeWidth={2.1} />
                    {item.label}
                  </NavLink>
                )
              )}
            </Fragment>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line px-3 pb-8 pt-3">
          {loggedIn ? (
            <div ref={userMenuMobileRef} className="relative">
              <button
                onClick={() => setActivePanel(p => p === 'userMenu' ? null : 'userMenu')}
                className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-all hover:bg-raised"
                aria-label="開啟使用者選單"
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
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-ink-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-popover">
                  <button
                    onClick={confirmLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-danger transition-all hover:bg-danger-subtle"
                  >
                    <LogOut size={16} />
                    登出
                  </button>
                </div>
              )}
            </div>
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
