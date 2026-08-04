import { Bell, MessageSquare } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { CountBadge } from './navShared'

export default function MobileHeader({ loggedIn, unreadNotifs, unreadMsgs, openNotify, openMessages }) {
  return (
    <>
      {/* 頭像／我的帳號／PM幣都在底部 Dock 最右邊的帳號選單裡，這裡只留 logo；
          右側依登入狀態留空間：訪客只有通知一顆圓形按鈕，登入才多留訊息按鈕的位置 */}
      <div className={`fixed left-3 top-3 z-50 lg:hidden ${loggedIn ? 'right-[8.75rem]' : 'right-[4.75rem]'}`}>
        <header className="flex h-14 items-center rounded-2xl border border-line bg-surface px-4 shadow-sm">
          <a href="/" className="flex items-center gap-2" aria-label="回首頁">
            <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
            <span className="text-[1rem] font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
          </a>
        </header>
      </div>

      {loggedIn && (
        <button
          onClick={openMessages}
          aria-label="訊息"
          className="fixed right-[4.75rem] top-3 z-50 grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-raised hover:text-ink lg:hidden"
        >
          <MessageSquare size={22} strokeWidth={2} />
          <CountBadge count={unreadMsgs} />
        </button>
      )}

      <button
        onClick={openNotify}
        aria-label="通知"
        className="fixed right-3 top-3 z-50 grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-raised hover:text-ink lg:hidden"
      >
        <Bell size={22} strokeWidth={2} />
        <CountBadge count={unreadNotifs} />
      </button>
    </>
  )
}
