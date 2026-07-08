import { Compass, Heart, LayoutGrid, MessageSquare, PlusCircle, Search, Zap } from 'lucide-react'
import { Badge } from './navShared'

export default function MobileDock({
  pathname,
  loggedIn,
  closeAll,
  openMatch,
  openCreate,
  openMessages,
  preventLockedAction,
  createMenuOpen,
  setCreateMenuOpen,
  createMenuRef,
  myMenuOpen,
  setMyMenuOpen,
  myMenuRef,
  unreadMsgs,
}) {
  return (
    <nav
      className="fixed left-3 right-3 z-50 rounded-2xl border border-line bg-white shadow-sm md:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex h-16 items-stretch">

        {/* 搜尋 */}
        <button
          onClick={() => window.dispatchEvent(new Event('pm:open-search'))}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-bold text-ink-3 transition-colors active:text-brand"
        >
          <Search size={22} strokeWidth={2.1} />
          搜尋
        </button>

        {/* 功能 — 配對 + 建立群組 dropdown */}
        <div ref={createMenuRef} className="relative flex flex-1 flex-col items-center justify-center">
          {createMenuOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-popover">
              <button
                onClick={() => { setCreateMenuOpen(false); openMatch() }}
                className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap text-ink transition-colors hover:bg-raised"
              >
                <Zap size={20} strokeWidth={2.1} />
                快速配對
              </button>
              {loggedIn ? (
                <button
                  onClick={() => { setCreateMenuOpen(false); openCreate() }}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap text-ink transition-colors hover:bg-raised"
                >
                  <PlusCircle size={20} strokeWidth={2.1} />
                  建立群組
                </button>
              ) : (
                <button
                  onClick={e => { setCreateMenuOpen(false); preventLockedAction(e, '/create-group') }}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap text-ink-3 opacity-40"
                >
                  <PlusCircle size={20} strokeWidth={2.1} />
                  建立群組
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setCreateMenuOpen(v => !v)}
            className={`flex flex-col items-center gap-1 text-[0.65rem] font-bold transition-colors ${createMenuOpen ? 'text-brand' : 'text-ink-3'}`}
          >
            <PlusCircle size={22} strokeWidth={2.1} />
            功能
          </button>
        </div>

        {/* 探索 — 中央圓形按鈕 */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <a
            href="/explore"
            onClick={closeAll}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-all active:scale-95 hover:bg-brand-hover"
            aria-label="探索"
          >
            <Compass size={22} strokeWidth={2} />
          </a>
        </div>

        {/* 我的 — dropdown */}
        <div ref={myMenuRef} className="relative flex flex-1 flex-col items-center justify-center">
          <span className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-brand transition-opacity ${(pathname.startsWith('/my-groups') || pathname === '/favorites') ? 'opacity-100' : 'opacity-0'}`} />
          {myMenuOpen && loggedIn && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-popover">
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
  )
}
