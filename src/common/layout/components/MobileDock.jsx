import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, LayoutGrid, LogIn, LogOut, Moon, PlusCircle, Search, Settings, Sun } from 'lucide-react'
import { NAV_SECTIONS } from '../nav'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { Button } from '../../../components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer'
import { useAuthStore } from '../../stores/useAuthStore'
import { useTheme } from '../../../components/theme-provider'
import { LockBadge, PresenceDot } from './navShared'
import { useHideOnScroll } from '../../utils/hooks'

const MY_ITEMS = NAV_SECTIONS[1].items

// 「我的」跟「我的帳號」都用同一套底部 Drawer（bottom sheet）骨架呈現選單內容，
// 不再用貼在觸發點上方的小 popup——手機上滑出式比固定定位的小選單好操作、也不用
// 擔心選單寬度超出螢幕邊界；safe-area 的底部留白在這裡收斂成一處
function DrawerSheet({ open, onOpenChange, title, children }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down" showSwipeHandle>
      <DrawerContent>
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <div className="pb-[max(0px,env(safe-area-inset-bottom))]">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}

function LockedDockButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
    >
      <span className="relative">
        <Icon size={22} strokeWidth={2.1} />
        <LockBadge className="-right-1 -top-1" />
      </span>
      {label}
    </button>
  )
}

export default function MobileDock({
  pathname,
  loggedIn,
  userName,
  avatarInitial,
  avatarColor,
  presenceStatus,
  tokenBalance,
  setTopupOpen,
  closeAll,
  openMatch,
  openCreate,
  preventLockedAction,
  myMenuOpen,
  setMyMenuOpen,
  accountMenuOpen,
  setAccountMenuOpen,
}) {
  const visible = useHideOnScroll()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const { theme, setTheme } = useTheme()

  const isMyActive = MY_ITEMS.some(item => item.to === pathname)

  async function handleLogout() {
    setLoggingOut(true)
    setAccountMenuOpen(false)
    await useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav
      className={`fixed left-3 right-3 z-50 rounded-2xl border border-line bg-surface shadow-sm transition-transform duration-300 ease-in-out lg:hidden ${visible ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'}`}
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex h-16 items-stretch">

        <button
          onClick={openMatch}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-all hover:-translate-y-0.5 active:text-brand"
        >
          <Search size={22} strokeWidth={2.1} />
          快速搜尋
        </button>

        {loggedIn ? (
          <button
            onClick={openCreate}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-all hover:-translate-y-0.5 active:text-brand"
          >
            <PlusCircle size={22} strokeWidth={2.1} />
            建立群組
          </button>
        ) : (
          <LockedDockButton icon={PlusCircle} label="建立群組" onClick={preventLockedAction} />
        )}

        {/* 探索 — 中央圓形按鈕 */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <a
            href="/explore"
            onClick={closeAll}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            aria-label="探索"
          >
            <Compass size={22} strokeWidth={2} />
          </a>
        </div>

        {/* 我的 — Drawer 觸發點 */}
        <div className="relative flex flex-1 flex-col items-center justify-center">
          <span className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-brand transition-opacity ${isMyActive ? 'opacity-100' : 'opacity-0'}`} />
          {loggedIn ? (
            <button
              onClick={() => setMyMenuOpen(v => !v)}
              aria-expanded={myMenuOpen}
              className={`flex flex-col items-center gap-1 text-[0.65rem] font-bold transition-all hover:-translate-y-0.5 ${(isMyActive || myMenuOpen) ? 'text-brand' : 'text-ink-3'}`}
            >
              <LayoutGrid size={22} strokeWidth={2.1} />
              我的
            </button>
          ) : (
            <LockedDockButton icon={LayoutGrid} label="我的" onClick={preventLockedAction} />
          )}
        </div>

        {loggedIn ? (
          <button
            onClick={() => setAccountMenuOpen(true)}
            aria-label="我的帳號"
            aria-expanded={accountMenuOpen}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold transition-all hover:-translate-y-0.5 active:text-brand ${pathname === '/account' ? 'text-brand' : 'text-ink-3'}`}
          >
            <Avatar initial={avatarInitial} color={avatarColor} size="xs" className={pathname === '/account' ? 'ring-2 ring-brand' : ''} />
            我的帳號
          </button>
        ) : (
          <button
            onClick={() => setAccountMenuOpen(true)}
            aria-label="登入"
            aria-expanded={accountMenuOpen}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-all hover:-translate-y-0.5 active:text-brand"
          >
            <LogIn size={22} strokeWidth={2.1} />
            登入
          </button>
        )}

      </div>

      {loggedIn && (
        <DrawerSheet open={myMenuOpen} onOpenChange={setMyMenuOpen} title="我的">
          <div className="flex divide-x divide-line-subtle">
            {MY_ITEMS.map(item => (
              <a
                key={item.to}
                href={item.to}
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-1 flex-col items-center gap-2 py-5 text-sm font-bold transition-colors hover:bg-raised ${pathname === item.to ? 'text-brand' : 'text-ink'}`}
              >
                <item.icon size={26} strokeWidth={2.1} />
                {item.label}
              </a>
            ))}
          </div>
        </DrawerSheet>
      )}

      {/* 帳號選單：登入時顯示大頭像／名稱／PM幣／我的帳號／登出，訪客則顯示 PartyMatch
          logo＋「訪客」，只留登入入口；深色模式切換兩種身份都看得到、都能用 */}
      <DrawerSheet open={accountMenuOpen} onOpenChange={setAccountMenuOpen} title={loggedIn ? '帳號選單' : '訪客選單'}>
        <div className="flex flex-col items-center gap-3 px-6 pt-2 pb-4">
          <span className="relative shadow-md rounded-full">
            <Avatar initial={loggedIn ? avatarInitial : null} color={avatarColor} className="!h-14 !w-14 !text-lg" />
            {loggedIn && <PresenceDot status={presenceStatus} className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5" />}
          </span>
          <p className="text-sm font-extrabold text-ink">{loggedIn ? userName : '訪客'}</p>
        </div>

        {loggedIn && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-lg bg-raised px-4 py-2.5">
                <TokenBadge className="shrink-0" />
                <span className="text-sm font-bold text-ink">{tokenBalance.toLocaleString()} PM</span>
                <Button
                  onClick={() => { setAccountMenuOpen(false); setTopupOpen(true) }}
                  className="h-auto rounded-full px-2.5 py-1 text-xs"
                >
                  加值
                </Button>
              </div>
            </div>
            <div className="border-t border-line-subtle" />
          </>
        )}

        <div className="flex divide-x divide-line-subtle">
          {loggedIn ? (
            <a
              href="/account"
              onClick={() => setAccountMenuOpen(false)}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
            >
              <Settings size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
              我的帳號
            </a>
          ) : (
            <a
              href="/login"
              onClick={() => setAccountMenuOpen(false)}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
            >
              <LogIn size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
              登入
            </a>
          )}
          <button
            type="button"
            onClick={() => { toggleTheme(); setAccountMenuOpen(false) }}
            aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={2} className="shrink-0 text-ink-3" /> : <Moon size={16} strokeWidth={2} className="shrink-0 text-ink-3" />}
            {theme === 'dark' ? '淺色模式' : '深色模式'}
          </button>
          {loggedIn && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              loading={loggingOut}
              className="h-auto min-w-0 flex-1 px-0 py-4 text-danger hover:bg-danger-subtle"
            >
              <LogOut size={16} strokeWidth={2} className="shrink-0" />
              登出
            </Button>
          )}
        </div>
      </DrawerSheet>
    </nav>
  )
}
