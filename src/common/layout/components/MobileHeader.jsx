import { Bell, MessageSquare } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { CountBadge } from './navShared'

function HeaderIconButton({ onClick, label, icon: Icon, count }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-ink-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-raised hover:text-ink dark:border-transparent dark:bg-brand dark:text-white dark:hover:bg-brand-hover"
    >
      <Icon size={22} strokeWidth={2} />
      <CountBadge count={count} />
    </button>
  )
}

export default function MobileHeader({ loggedIn, unreadNotifs, unreadMsgs, openNotify, openMessages }) {
  return (
    // 頭像／我的帳號／PM幣都在底部 Dock 最右邊的帳號選單裡，這裡只留 logo；右側按鈕
    // 用 flex + gap 排版，寬度／間距讓瀏覽器自己算，不用手動湊 right-[Nrem] 這種跟
    // 按鈕尺寸綁死的魔術數字（訊息按鈕加減都不用回來重算 header 該留多寬）
    <div className="fixed left-3 right-3 top-3 z-50 flex items-center gap-2 lg:hidden">
      <header className="flex h-14 min-w-0 flex-1 items-center rounded-2xl border border-line bg-surface px-4 shadow-sm">
        <a href="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
          <span className="text-[1rem] font-extrabold">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </a>
      </header>

      {loggedIn && <HeaderIconButton onClick={openMessages} label="訊息" icon={MessageSquare} count={unreadMsgs} />}
      <HeaderIconButton onClick={openNotify} label="通知" icon={Bell} count={unreadNotifs} />
    </div>
  )
}
