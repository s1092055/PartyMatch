import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clipboard, Compass, Heart, LayoutDashboard, LayoutGrid, LogIn, LogOut, Moon, PlusCircle, Search, Settings, Sun } from 'lucide-react'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { Button } from '../../../components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer'
import { useAuthStore } from '../../stores/useAuthStore'
import { useTheme } from '../../../components/theme-provider'
import { LockBadge, PresenceDot } from './navShared'
import { useHideOnScroll } from '../../utils/hooks'

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

  async function handleLogout() {
    setLoggingOut(true)
    setAccountMenuOpen(false)
    await useAuthStore.getState().logout()
    navigate('/login', { replace: true })
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
          <button
            onClick={e => preventLockedAction(e)}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
          >
            <span className="relative">
              <PlusCircle size={22} strokeWidth={2.1} />
              <LockBadge className="-right-1 -top-1" />
            </span>
            建立群組
          </button>
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
          <span className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-brand transition-opacity ${(pathname === '/my-subscriptions' || pathname === '/manage-groups' || pathname === '/favorites') ? 'opacity-100' : 'opacity-0'}`} />
          {loggedIn ? (
            <button
              onClick={() => setMyMenuOpen(v => !v)}
              aria-expanded={myMenuOpen}
              className={`flex flex-col items-center gap-1 text-[0.65rem] font-bold transition-all hover:-translate-y-0.5 ${(pathname === '/my-subscriptions' || pathname === '/manage-groups' || pathname === '/favorites') ? 'text-brand' : myMenuOpen ? 'text-brand' : 'text-ink-3'}`}
            >
              <LayoutGrid size={22} strokeWidth={2.1} />
              我的
            </button>
          ) : (
            <button
              onClick={e => preventLockedAction(e)}
              className="flex flex-col items-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
            >
              <span className="relative">
                <LayoutGrid size={22} strokeWidth={2.1} />
                <LockBadge className="-right-1 -top-1" />
              </span>
              我的
            </button>
          )}
        </div>

        {loggedIn ? (
          <button
            onClick={() => setAccountMenuOpen(true)}
            aria-label="我的帳號"
            aria-expanded={accountMenuOpen}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold transition-all hover:-translate-y-0.5 active:text-brand ${pathname === '/account' ? 'text-brand' : 'text-ink-3'}`}
          >
            <Avatar initial={avatarInitial} color={avatarColor} className={`!h-6 !w-6 ${pathname === '/account' ? 'ring-2 ring-brand' : ''}`} />
            我的帳號
          </button>
        ) : (
          <a
            href="/login"
            onClick={closeAll}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-all hover:-translate-y-0.5 active:text-brand"
          >
            <LogIn size={22} strokeWidth={2.1} />
            登入
          </a>
        )}

      </div>

      {/* 「我的」跟「我的帳號」都改用同一套底部 Drawer（bottom sheet）呈現選單內容，
          不再用貼在觸發點上方的小 popup——手機上滑出式比固定定位的小選單好操作、也不用
          擔心選單寬度超出螢幕邊界 */}
      {loggedIn && (
        <Drawer open={myMenuOpen} onOpenChange={setMyMenuOpen} swipeDirection="down" showSwipeHandle>
          <DrawerContent>
            <DrawerTitle className="sr-only">我的</DrawerTitle>
            <div className="flex divide-x divide-line-subtle pb-[max(0px,env(safe-area-inset-bottom))]">
              <a
                href="/manage-groups"
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-1 flex-col items-center gap-2 py-5 text-sm font-bold transition-colors hover:bg-raised ${pathname === '/manage-groups' ? 'text-brand' : 'text-ink'}`}
              >
                <LayoutDashboard size={26} strokeWidth={2.1} />
                群組管理
              </a>
              <a
                href="/my-subscriptions"
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-1 flex-col items-center gap-2 py-5 text-sm font-bold transition-colors hover:bg-raised ${pathname === '/my-subscriptions' ? 'text-brand' : 'text-ink'}`}
              >
                <Clipboard size={26} strokeWidth={2.1} />
                我的訂閱
              </a>
              <a
                href="/favorites"
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-1 flex-col items-center gap-2 py-5 text-sm font-bold transition-colors hover:bg-raised ${pathname === '/favorites' ? 'text-brand' : 'text-ink'}`}
              >
                <Heart size={26} strokeWidth={2.1} />
                我的收藏
              </a>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* 帳號選單用底部 Drawer（bottom sheet）：內容比較多（大頭像、名稱、PM幣、登出） */}
      {loggedIn && (
        <Drawer open={accountMenuOpen} onOpenChange={setAccountMenuOpen} swipeDirection="down" showSwipeHandle>
          <DrawerContent>
            <DrawerTitle className="sr-only">帳號選單</DrawerTitle>
            <div className="flex flex-col items-center gap-3 px-6 pt-2 pb-4">
              <span className="relative shadow-md rounded-full">
                <Avatar initial={avatarInitial} color={avatarColor} className="!h-14 !w-14 !text-lg" />
                <PresenceDot status={presenceStatus} className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-extrabold text-ink">{userName}</p>
            </div>

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

            <div className="flex divide-x divide-line-subtle pb-[max(0px,env(safe-area-inset-bottom))]">
              <a
                href="/account"
                onClick={() => setAccountMenuOpen(false)}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
              >
                <Settings size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
                我的帳號
              </a>
              <button
                type="button"
                onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setAccountMenuOpen(false) }}
                aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
              >
                {theme === 'dark' ? <Sun size={16} strokeWidth={2} className="shrink-0 text-ink-3" /> : <Moon size={16} strokeWidth={2} className="shrink-0 text-ink-3" />}
                {theme === 'dark' ? '淺色模式' : '深色模式'}
              </button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                loading={loggingOut}
                className="h-auto min-w-0 flex-1 px-0 py-4 text-danger hover:bg-danger-subtle"
              >
                <LogOut size={16} strokeWidth={2} className="shrink-0" />
                登出
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </nav>
  )
}
