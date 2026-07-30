import { CalendarClock, Compass, Heart, LayoutDashboard, LayoutGrid, MessageSquare, PlusCircle, Search } from 'lucide-react'
import { CountBadge, LockBadge } from './navShared'
import { useHideOnScroll } from '../../utils/hooks'

export default function MobileDock({
  pathname,
  loggedIn,
  closeAll,
  openMatch,
  openCreate,
  openMessages,
  preventLockedAction,
  myMenuOpen,
  setMyMenuOpen,
  myMenuRef,
  unreadMsgs,
}) {
  const visible = useHideOnScroll()

  return (
    <nav
      className={`fixed left-3 right-3 z-50 rounded-2xl border border-line bg-white shadow-sm transition-transform duration-300 ease-in-out lg:hidden ${visible ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'}`}
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
              <LockBadge className="-right-1 -top-1 bg-white text-ink-4" />
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

        {/* 我的 — dropdown */}
        <div ref={myMenuRef} className="relative flex flex-1 flex-col items-center justify-center">
          <span className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-brand transition-opacity ${(pathname === '/my-subscriptions' || pathname === '/manage-groups' || pathname === '/favorites') ? 'opacity-100' : 'opacity-0'}`} />
          {myMenuOpen && loggedIn && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex flex-row gap-0 rounded-2xl border border-line bg-white p-1.5 shadow-popover">
              <a
                href="/manage-groups"
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-raised ${pathname === '/manage-groups' ? 'text-brand' : 'text-ink'}`}
              >
                <LayoutDashboard size={20} strokeWidth={2.1} />
                群組管理
              </a>
              <a
                href="/my-subscriptions"
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-raised ${pathname === '/my-subscriptions' ? 'text-brand' : 'text-ink'}`}
              >
                <CalendarClock size={20} strokeWidth={2.1} />
                我的訂閱
              </a>
              <a
                href="/favorites"
                onClick={() => setMyMenuOpen(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-raised ${pathname === '/favorites' ? 'text-brand' : 'text-ink'}`}
              >
                <Heart size={20} strokeWidth={2.1} />
                我的收藏
              </a>
            </div>
          )}
          {loggedIn ? (
            <button
              onClick={() => setMyMenuOpen(v => !v)}
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
                <LockBadge className="-right-1 -top-1 bg-white text-ink-4" />
              </span>
              我的
            </button>
          )}
        </div>

        {loggedIn ? (
          <button
            onClick={openMessages}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-all hover:-translate-y-0.5 active:text-brand"
          >
            <span className="relative">
              <MessageSquare size={22} strokeWidth={2.1} />
              <CountBadge count={unreadMsgs} />
            </span>
            訊息
          </button>
        ) : (
          <button
            onClick={e => preventLockedAction(e)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 opacity-40"
          >
            <MessageSquare size={22} strokeWidth={2.1} />
            訊息
            <LockBadge className="right-4 top-1.5 bg-white text-ink-4" />
          </button>
        )}

      </div>
    </nav>
  )
}
