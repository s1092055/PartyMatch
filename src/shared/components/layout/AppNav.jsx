import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, LogIn, LogOut, Menu, Search, User, UserPlus, X, Zap } from 'lucide-react'
import { getCurrentUser, isAuthenticated, logoutUser } from '../../stores/authStore'
import { NAV_SECTIONS } from '../../constants/nav'
import { useClickOutside } from '../../utils/hooks'
import {
  addRecentSearch,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearches,
  searchGroups,
} from '../../utils/searchUtils'
import ServiceLogo from '../ui/ServiceLogo'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches)

  const searchPanelRef   = useRef(null)
  const userMenuRef      = useRef(null)
  const userMenuMobileRef = useRef(null)
  const searchInputRef   = useRef(null)

  const showSearch   = activePanel === 'search'
  const showUserMenu = activePanel === 'userMenu'
  const searchResults = useMemo(() => searchGroups(searchQuery), [searchQuery])

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50)
    else if (searchQuery !== '') setTimeout(() => setSearchQuery(''), 0)
  }, [showSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { setActivePanel(null); setDrawerOpen(false) }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (drawerOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.overflowY = 'hidden'
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.documentElement.style.overflowY = ''
      document.documentElement.style.paddingRight = ''
    }
    return () => {
      document.documentElement.style.overflowY = ''
      document.documentElement.style.paddingRight = ''
    }
  }, [drawerOpen])

  useClickOutside(showSearch,   [searchPanelRef], () => setActivePanel(null))
  useClickOutside(showUserMenu, [userMenuRef, userMenuMobileRef], () => setActivePanel(null))

  function closeAll() { setActivePanel(null); setDrawerOpen(false); document.activeElement?.blur() }

  function handleMobileSearch() {
    setDrawerOpen(false)
    window.dispatchEvent(new CustomEvent('pm:open-search'))
  }

  function handleSearchSubmit(term) {
    const t = (term ?? searchQuery).trim()
    if (!t) return
    addRecentSearch(t)
    setRecentSearches(loadRecentSearches())
    navigate(`/explore?q=${encodeURIComponent(t)}`)
    setActivePanel(null)
  }

  function handleRemoveRecent(term, e) {
    e.stopPropagation()
    removeRecentSearch(term)
    setRecentSearches(loadRecentSearches())
  }

  async function confirmLogout() {
    try { await logoutUser() } catch { /* proceed regardless */ }
    window.location.replace('/login')
  }

  if (variant === 'top') {
    return (
      <>
        {/* Desktop floating bar */}
        <nav className="fixed left-4 right-4 top-4 z-50 hidden items-center justify-between rounded-2xl border border-line bg-white px-5 py-3 shadow-sm md:flex">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="回首頁">
            <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-8 w-8" />
            <span className="text-[1.1rem] font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-raised hover:text-ink"
            aria-label="開啟選單"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </nav>

        {/* Mobile header */}
        <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="回首頁">
            <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-8 w-8" />
            <span className="font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-raised hover:text-ink"
            aria-label="開啟選單"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </header>

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
              className="grid h-11 w-11 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
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
                {section.items.filter(item => item.to).map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeAll}
                    className={({ isActive }) =>
                      `flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-colors ${
                        isActive
                          ? 'bg-brand-subtle font-extrabold text-brand'
                          : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
                      }`
                    }
                  >
                    <item.icon size={20} strokeWidth={2.1} />
                    {item.label}
                  </NavLink>
                ))}
              </Fragment>
            ))}
          </nav>

          <div className="shrink-0 border-t border-line px-3 pb-8 pt-3">
            {loggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setActivePanel(p => p === 'userMenu' ? null : 'userMenu')}
                  className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-colors hover:bg-raised"
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
                      onClick={() => { closeAll(); navigate('/account') }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                    >
                      <User size={16} />
                      帳號中心
                    </button>
                    <div className="my-1 h-px bg-line-subtle" />
                    <button
                      onClick={confirmLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
                    >
                      <LogOut size={16} />
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/register"
                  onClick={closeAll}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  <UserPlus size={18} strokeWidth={2.1} />
                  免費註冊
                </Link>
                <Link
                  to="/login"
                  onClick={closeAll}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                >
                  <LogIn size={18} strokeWidth={2.1} />
                  登入
                </Link>
              </div>
            )}
          </div>
        </div>

      </>
    )
  }

  return (
    <>
      {/* Desktop floating sidebar */}
      <aside
        className={`group/nav fixed bottom-4 left-4 top-4 z-50 hidden flex-col rounded-2xl border border-line bg-white shadow-sm transition-[width] duration-300 ease-out md:flex ${
          showUserMenu ? '' : 'overflow-hidden'
        } ${
          showSearch ? 'w-0' : 'w-16 hover:w-56 focus-within:w-56'
        }`}
      >
        <Link
          to="/"
          onClick={closeAll}
          className="flex h-16 shrink-0 items-center gap-3 px-4"
          aria-label="回首頁"
        >
          <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-8 w-8 shrink-0" />
          <span className="whitespace-nowrap text-[1.1rem] font-extrabold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-2">
          <div className="my-auto space-y-0.5">
            {NAV_SECTIONS.map((section, i) => (
              <Fragment key={section.label}>
                {i > 0 && <div className="mx-2 my-2 h-px bg-line-subtle" />}
                <p className="mb-1 mt-1 whitespace-nowrap px-2 text-[0.6rem] font-extrabold uppercase tracking-widest text-ink-4 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                  {section.label}
                </p>
                {section.items.map(item =>
                  item.type === 'search' ? (
                    <button
                      key="search"
                      onClick={() => setActivePanel('search')}
                      aria-label="搜尋"
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <Search size={22} strokeWidth={2.1} />
                      </span>
                      <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                        搜尋
                      </span>
                    </button>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeAll}
                      className={({ isActive }) =>
                        `flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-[0.95rem] transition-colors ${
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
                className="flex h-14 w-full items-center gap-3 rounded-2xl px-1 text-left transition-colors hover:bg-raised"
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
                    onClick={() => { closeAll(); navigate('/account') }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <User size={16} />
                    帳號中心
                  </button>
                  <div className="my-1 h-px bg-line-subtle" />
                  <button
                    onClick={confirmLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
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
                to="/register"
                onClick={closeAll}
                className="flex h-12 w-full items-center gap-3 rounded-2xl bg-brand px-1 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center">
                  <UserPlus size={20} strokeWidth={2.1} />
                </span>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100">
                  免費註冊
                </span>
              </Link>
              <Link
                to="/login"
                onClick={closeAll}
                className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
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

      {/* Desktop floating search panel */}
      <div
        ref={searchPanelRef}
        className={`fixed bottom-4 left-4 top-4 z-50 hidden w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 ease-out md:flex ${
          showSearch ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between px-6">
          <h2 className="text-xl font-extrabold text-ink">搜尋</h2>
          <button
            onClick={() => setActivePanel(null)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="關閉搜尋"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜尋群組、服務..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
              className="w-full rounded-2xl bg-raised py-2.5 pl-9 pr-9 text-sm font-medium text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-4 w-4 place-items-center rounded-full bg-ink-3 text-white"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-line-subtle" />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {searchQuery === '' ? (
            recentSearches.length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-ink">最近搜尋</p>
                  <button
                    onClick={() => { saveRecentSearches([]); setRecentSearches([]) }}
                    className="text-xs font-bold text-brand hover:text-brand-hover"
                  >
                    全部清除
                  </button>
                </div>
                <div className="space-y-0.5">
                  {recentSearches.map(item => (
                    <button
                      key={item}
                      onClick={() => { setSearchQuery(item); handleSearchSubmit(item) }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised">
                        <Search size={14} className="text-ink-3" />
                      </span>
                      <span className="flex-1 text-left">{item}</span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={e => handleRemoveRecent(item, e)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleRemoveRecent(item, e)}
                        aria-label={`移除「${item}」搜尋紀錄`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                      >
                        <X size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-6 text-center text-sm text-ink-3">沒有最近搜尋紀錄</p>
            )
          ) : searchResults.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-3">
                搜尋結果（{searchResults.length}）
              </p>
              <div className="space-y-1">
                {searchResults.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      addRecentSearch(searchQuery)
                      setRecentSearches(loadRecentSearches())
                      navigate(`/groups/${group.id}`)
                      setActivePanel(null)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-raised"
                  >
                    <ServiceLogo serviceId={group.serviceId} size={32} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{group.serviceName}</p>
                      <p className="truncate text-xs text-ink-3">{group.planName} · NT${group.pricePerSeat}/月</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                      group.joinMode === 'instant'
                        ? 'bg-success-subtle text-success-text'
                        : 'bg-raised text-ink-3'
                    }`}>
                      {group.joinMode === 'instant' ? '立即' : '審核'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm text-ink-3">找不到「<span className="font-bold text-ink">{searchQuery}</span>」的結果</p>
              <p className="mt-1 text-xs text-ink-3">試試其他關鍵字</p>
            </div>
          )}
        </div>

        {searchQuery && (
          <div className="border-t border-line px-4 py-4">
            <button
              onClick={() => handleSearchSubmit()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              <Zap size={14} />
              在探索頁查看全部結果
            </button>
          </div>
        )}
      </div>

      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
        <Link to="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-8 w-8" />
        </Link>
        <button
          onClick={() => setDrawerOpen(v => !v)}
          className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          aria-label="開啟選單"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
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
            className="grid h-11 w-11 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
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
                  <button
                    key="search"
                    onClick={handleMobileSearch}
                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <Search size={20} strokeWidth={2.1} />
                    搜尋
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeAll}
                    className={({ isActive }) =>
                      `flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-colors ${
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
                className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-colors hover:bg-raised"
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
                    onClick={() => { closeAll(); navigate('/account') }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <User size={16} />
                    帳號中心
                  </button>
                  <div className="my-1 h-px bg-line-subtle" />
                  <button
                    onClick={confirmLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
                  >
                    <LogOut size={16} />
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                to="/register"
                onClick={closeAll}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <UserPlus size={18} strokeWidth={2.1} />
                免費註冊
              </Link>
              <Link
                to="/login"
                onClick={closeAll}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
              >
                <LogIn size={18} strokeWidth={2.1} />
                登入
              </Link>
            </div>
          )}
        </div>
      </div>

    </>
  )
}
