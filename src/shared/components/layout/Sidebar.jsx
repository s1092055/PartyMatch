import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Search, User, UserPlus, X, Zap } from 'lucide-react'
import { NAV_SECTIONS, NAV_UTILITY } from '../../constants/nav'
import { getCurrentUser, isAuthenticated, logoutUser } from '../../stores/authStore'
import { useClickOutside } from '../../utils/hooks'
import {
  addRecentSearch,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearches,
  searchGroups,
} from '../../utils/searchUtils'
import LogoutConfirmModal from '../modals/LogoutConfirmModal'
import ServiceLogo from '../ui/ServiceLogo'


export default function Sidebar() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const userEmail = currentUser?.email ?? '@partymatch'
  const avatarInitial = userName[0] ?? 'U'

  const [activePanel, setActivePanel]             = useState(null)
  const [searchQuery, setSearchQuery]             = useState('')
  const [recentSearches, setRecentSearches]       = useState(loadRecentSearches)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  // Controls overflow-hidden on aside: true during search open + slide-out animation
  const [clampOverflow, setClampOverflow]         = useState(false)

  const searchPanelRef = useRef(null)
  const userRef        = useRef(null)
  const searchInputRef = useRef(null)

  const showSearch   = activePanel === 'search'
  const showUserMenu = activePanel === 'userMenu'

  const searchResults = useMemo(() => searchGroups(searchQuery), [searchQuery])

  // Manage overflow-hidden timing around the search animation
  useEffect(() => {
    if (showSearch) setTimeout(() => setClampOverflow(true), 0)
    // When closing, onTransitionEnd will clear clampOverflow
  }, [showSearch])

  // Focus input when search opens
  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50)
    else setTimeout(() => setSearchQuery(''), 0)
  }, [showSearch])

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') setActivePanel(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useClickOutside(showSearch,   [searchPanelRef], () => setActivePanel(null))
  useClickOutside(showUserMenu, [userRef],         () => setActivePanel(null))

  function handleMenuNavigate(path) {
    navigate(path)
    setActivePanel(null)
  }

  function confirmLogout() {
    logoutUser()
    setShowLogoutConfirm(false)
    setActivePanel(null)
    navigate('/login', { replace: true })
  }

  function closeAll() {
    setActivePanel(null)
    document.activeElement?.blur()
  }

  function handleSearchSubmit(term) {
    const t = term ?? searchQuery
    if (!t.trim()) return
    addRecentSearch(t)
    setRecentSearches(loadRecentSearches())
    navigate(`/explore?q=${encodeURIComponent(t.trim())}`)
    setActivePanel(null)
  }

  function handleRemoveRecent(term, e) {
    e.stopPropagation()
    removeRecentSearch(term)
    setRecentSearches(loadRecentSearches())
  }

  function handleClearAll() {
    saveRecentSearches([])
    setRecentSearches([])
  }

  return (
    <>
      {/* Icon strip */}
      <aside
        className={`group/sidebar fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-line bg-white shadow-sm transition-[width] duration-300 ease-out md:flex ${
          clampOverflow ? 'overflow-hidden' : ''
        } ${
          showSearch ? 'w-0' : 'w-20 hover:w-64 focus-within:w-64'
        }`}
        onTransitionEnd={() => {
          if (!showSearch) setClampOverflow(false)
        }}
      >
        <Link
          to="/explore"
          onClick={closeAll}
          className="flex h-[5.75rem] shrink-0 items-center gap-3 px-4"
          aria-label="回探索群組"
        >
          <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-11 w-11 shrink-0 rounded-2xl" />
          <span className="pointer-events-none whitespace-nowrap text-[1.35rem] font-extrabold leading-none opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col items-stretch overflow-x-hidden overflow-y-auto px-3 py-4">
          <div className="my-auto">
            {NAV_SECTIONS.map((section, i) => (
              <Fragment key={section.label}>
                {i > 0 && <SidebarDivider />}
                <SidebarSection label={section.label} />
                {section.items.map(item =>
                  item.type === 'search' ? (
                    <button
                      key="search"
                      onClick={() => setActivePanel('search')}
                      aria-label="搜尋"
                      className="flex h-12 w-full items-center gap-3 rounded-2xl px-2 text-[0.95rem] text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <Search size={22} strokeWidth={2.1} />
                      </span>
                      <span className="whitespace-nowrap font-bold opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
                        搜尋
                      </span>
                    </button>
                  ) : (
                    <SidebarNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={closeAll} />
                  )
                )}
              </Fragment>
            ))}

            <div className="pt-3">
              <SidebarDivider />
              <SidebarSection label="其他" />
              {NAV_UTILITY.map(item => (
                <SidebarNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={closeAll} />
              ))}
            </div>
          </div>
        </nav>

        <div className="space-y-2 px-3 pb-4">
          {isAuthenticated() ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setActivePanel(p => p === 'userMenu' ? null : 'userMenu')}
                className="flex h-14 w-full items-center gap-3 rounded-2xl px-2 text-left transition-colors hover:bg-raised"
                aria-label="開啟使用者選單"
              >
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-500 text-sm font-black text-white shadow-[0_10px_24px_-18px_rgb(8_18_38_/_0.8)]">
                  {avatarInitial}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </span>
                <span className="min-w-0 flex-1 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
                  <span className="block truncate text-sm font-extrabold text-ink">{userName}</span>
                  <span className="block truncate text-xs font-medium text-ink-3">{userEmail}</span>
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-0 left-[calc(100%+0.75rem)] w-52 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-popover">
                  <UserMenuButton icon={User} label="帳號中心" onClick={() => handleMenuNavigate('/account')} />
                  <div className="my-1 h-px bg-line-subtle" />
                  <UserMenuButton
                    icon={LogOut}
                    label="登出"
                    tone="danger"
                    onClick={() => { setActivePanel(null); setShowLogoutConfirm(true) }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Link
                to="/register"
                onClick={closeAll}
                className="flex h-12 w-full items-center gap-3 rounded-2xl bg-brand px-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center">
                  <UserPlus size={20} strokeWidth={2.1} />
                </span>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
                  免費註冊
                </span>
              </Link>
              <Link
                to="/login"
                onClick={closeAll}
                className="flex h-12 w-full items-center gap-3 rounded-2xl px-2 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center">
                  <LogIn size={20} strokeWidth={2.1} />
                </span>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
                  登入
                </span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Search panel */}
      <div
        ref={searchPanelRef}
        className={`fixed left-0 top-0 z-50 hidden h-screen w-80 flex-col border-r border-line bg-white shadow-xl transition-transform duration-300 ease-out md:flex ${
          showSearch ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[5.75rem] shrink-0 items-center justify-between px-5">
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
              className="w-full rounded-xl bg-raised py-2.5 pl-9 pr-9 text-sm font-medium text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-4 w-4 place-items-center rounded-full bg-ink-3 text-white transition-colors hover:bg-ink"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-line-subtle" />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {searchQuery === '' ? (
            <>
              {recentSearches.length > 0 ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-extrabold text-ink">最近搜尋</p>
                    <button
                      onClick={handleClearAll}
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
                        <button
                          type="button"
                          tabIndex={0}
                          onClick={e => handleRemoveRecent(item, e)}
                          aria-label={`移除「${item}」搜尋紀錄`}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
                        >
                          <X size={14} />
                        </button>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-6 text-center text-sm text-ink-3">沒有最近搜尋紀錄</p>
              )}
            </>
          ) : (
            <>
              {searchResults.length > 0 ? (
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
                          <p className="truncate text-sm font-bold text-ink">
                            {group.serviceName}
                          </p>
                          <p className="truncate text-xs text-ink-3">
                            {group.planName} · NT${group.pricePerSeat}/月
                          </p>
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
            </>
          )}
        </div>

        {searchQuery && (
          <div className="border-t border-line px-4 py-3">
            <button
              onClick={() => handleSearchSubmit()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              <Zap size={14} />
              在探索頁查看全部結果
            </button>
          </div>
        )}
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </>
  )
}

function SidebarNavLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex h-12 w-full items-center gap-3 rounded-2xl px-2 text-[0.95rem] transition-colors ${
          isActive
            ? 'bg-brand-subtle text-brand font-extrabold'
            : 'text-ink-2 hover:bg-raised hover:text-brand font-bold'
        }`
      }
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center">
        <Icon size={22} strokeWidth={2.1} />
      </span>
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
        {label}
      </span>
    </NavLink>
  )
}

function SidebarSection({ label }) {
  return (
    <p className="mb-1 mt-1 whitespace-nowrap px-2 text-xs font-extrabold uppercase tracking-widest text-ink-4 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
      {label}
    </p>
  )
}

function SidebarDivider() {
  return <div className="my-2 h-px bg-line-subtle" />
}

function UserMenuButton({ icon: Icon, label, tone = 'default', onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors ${
        tone === 'danger'
          ? 'text-danger hover:bg-danger-subtle'
          : 'text-ink-2 hover:bg-raised hover:text-brand'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  )
}
