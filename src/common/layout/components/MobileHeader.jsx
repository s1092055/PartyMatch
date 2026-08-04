import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Settings } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { useAuthStore } from '../../stores/useAuthStore'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { CountBadge, PresenceDot } from './navShared'
import { Button } from '../../../components/ui/button'

export default function MobileHeader({
  loggedIn,
  userName,
  avatarInitial,
  avatarColor,
  presenceStatus,
  unreadNotifs,
  tokenBalance,
  mobileMenuOpen,
  setMobileMenuOpen,
  mobileMenuRef,
  setTopupOpen,
  openNotify,
}) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    setMobileMenuOpen(false)
    await useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }

  return (
    <div ref={mobileMenuRef} className="fixed left-3 right-3 top-3 z-50 lg:hidden">
      <header className="flex h-14 items-center justify-between rounded-2xl border border-line bg-surface px-4 shadow-sm">
        <a href="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
          <span className="text-[1rem] font-extrabold">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </a>
        <div className="flex items-center gap-1">
          <button
            onClick={openNotify}
            className="relative grid h-11 w-11 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="通知"
          >
            <Bell size={24} strokeWidth={2} />
            <CountBadge count={unreadNotifs} />
          </button>
          {loggedIn ? (
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="個人選單"
              aria-expanded={mobileMenuOpen}
              className="relative ml-1 shrink-0"
            >
              <Avatar initial={avatarInitial} color={avatarColor} className="!h-9 !w-9 shadow-md" />
              <PresenceDot status={presenceStatus} className="absolute bottom-0 right-0 h-2.5 w-2.5" />
            </button>
          ) : (
            <a
              href="/login"
              aria-label="訪客，前往登入"
              className="relative ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all hover:bg-raised"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface shadow-md">
                <img src={logoUrl} alt="" className="h-5 w-5" />
              </span>
            </a>
          )}
        </div>
      </header>

      {mobileMenuOpen && loggedIn && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4">
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
                onClick={() => { setMobileMenuOpen(false); setTopupOpen(true) }}
                className="h-auto rounded-full px-2.5 py-1 text-xs"
              >
                加值
              </Button>
            </div>
          </div>

          <div className="border-t border-line-subtle" />

          <div className="flex divide-x divide-line-subtle">
            <a
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
            >
              <Settings size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
              我的帳號
            </a>
            <Button
              variant="ghost"
              onClick={handleLogout}
              loading={loggingOut}
              className="h-auto flex-1 py-4 text-danger hover:bg-danger-subtle"
            >
              <LogOut size={16} strokeWidth={2} className="shrink-0" />
              登出
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
