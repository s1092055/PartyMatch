import { Fragment, useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Menu, Search, User, UserPlus, X } from 'lucide-react'
import { getCurrentUser, isAuthenticated, logoutUser } from '../../stores/authStore'
import { NAV_SECTIONS, NAV_UTILITY } from '../../constants/nav'
import LogoutConfirmModal from '../modals/LogoutConfirmModal'

export default function Topbar() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const userEmail = currentUser?.email ?? '@partymatch'
  const avatarInitial = userName[0]

  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { if (drawerOpen) document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return
    function onKeyDown(e) { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  function closeDrawer() { setDrawerOpen(false) }

  function handleSearchClick() {
    setDrawerOpen(false)
    window.dispatchEvent(new CustomEvent('pm:open-search'))
  }

  async function confirmLogout() {
    await logoutUser()
    setShowLogoutConfirm(false)
    setDrawerOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
        <Link to="/explore" className="flex items-center gap-2" aria-label="回探索群組">
          <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-8 w-8 rounded-xl" />
        </Link>

        <button
          onClick={() => setDrawerOpen(v => !v)}
          className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-raised"
          aria-label="開啟選單"
        >
          <Menu size={22} className="text-ink" strokeWidth={2} />
        </button>
      </header>

<div
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

<div
        className={`fixed inset-y-0 right-0 z-[51] flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-base font-extrabold leading-none">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
          <button
            onClick={closeDrawer}
            className="grid h-11 w-11 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="關閉選單"
          >
            <X size={20} />
          </button>
        </div>

<nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section, i) => (
            <Fragment key={section.label}>
              {i > 0 && <DrawerDivider />}
              <DrawerSection label={section.label} />
              {section.items.map(item =>
                item.type === 'search' ? (
                  <button
                    key="search"
                    onClick={handleSearchClick}
                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <Search size={20} strokeWidth={2.1} />
                    搜尋
                  </button>
                ) : (
                  <DrawerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={closeDrawer} />
                )
              )}
            </Fragment>
          ))}

          <DrawerDivider />
          {NAV_UTILITY.map(item => (
            <DrawerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={closeDrawer} />
          ))}
        </nav>

<div className="shrink-0 space-y-1 border-t border-line px-3 pb-8 pt-3">
          {isAuthenticated() ? (
            <>
              
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-500 text-sm font-black text-white">
                  {avatarInitial}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{userName}</p>
                  <p className="truncate text-xs text-ink-3">{userEmail}</p>
                </div>
              </div>

              <button
                onClick={() => { closeDrawer(); navigate('/account') }}
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
              >
                <User size={20} strokeWidth={2.1} />
                帳號中心
              </button>

              <button
                onClick={() => { closeDrawer(); setShowLogoutConfirm(true) }}
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
              >
                <LogOut size={20} strokeWidth={2.1} />
                登出
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                onClick={closeDrawer}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <UserPlus size={18} strokeWidth={2.1} />
                免費註冊
              </Link>
              <Link
                to="/login"
                onClick={closeDrawer}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
              >
                <LogIn size={18} strokeWidth={2.1} />
                登入
              </Link>
            </>
          )}
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </>
  )
}

function DrawerNavLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-colors ${
          isActive
            ? 'bg-brand-subtle font-extrabold text-brand'
            : 'font-bold text-ink-2 hover:bg-raised hover:text-brand'
        }`
      }
    >
      <Icon size={20} strokeWidth={2.1} />
      {label}
    </NavLink>
  )
}

function DrawerSection({ label }) {
  return (
    <p className="mb-1 mt-1 px-3 text-xs font-extrabold uppercase tracking-widest text-ink-4">
      {label}
    </p>
  )
}

function DrawerDivider() {
  return <div className="my-2 h-px bg-line-subtle" />
}
