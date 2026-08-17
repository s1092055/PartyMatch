import { Bell, MessageSquare } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { CountBadge } from './navShared'

function HeaderIconButton({ onClick, label, icon: Icon, count }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
    >
      <Icon size={22} strokeWidth={2} />
      <CountBadge count={count} />
    </button>
  )
}

export default function MobileHeader({ loggedIn, unreadNotifs, unreadMsgs, openNotify, openMessages }) {
  return (
    <div data-mobile-header className="fixed left-3 right-3 top-3 z-50 flex items-center gap-2 can-hover:lg:hidden">
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
