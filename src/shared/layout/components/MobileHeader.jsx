import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Settings, UserCircle2 } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { useAuthStore } from '../../stores/useAuthStore'
import { TokenBadge } from '../../ui/TokenAmount'
import { Badge } from './navShared'

export default function MobileHeader({
  loggedIn,
  userName,
  avatarInitial,
  avatarColor,
  unreadNotifs,
  tokenBalance,
  mobileMenuOpen,
  setMobileMenuOpen,
  mobileMenuRef,
  setTopupOpen,
  openNotify,
}) {
  const navigate = useNavigate()

  return (
    <div ref={mobileMenuRef} className="fixed left-3 right-3 top-3 z-50 md:hidden">
      <header className="flex h-14 items-center justify-between rounded-2xl border border-line bg-white px-4 shadow-sm">
        <a href="/" className="flex items-center gap-2" aria-label="回首頁">
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
          <span className="text-[1rem] font-extrabold">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </a>
        <div className="flex items-center gap-1">
          {/* 通知按鈕 */}
          <button
            onClick={openNotify}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-all hover:bg-raised hover:text-ink"
            aria-label="通知"
          >
            <Bell size={20} strokeWidth={2} />
            <Badge count={unreadNotifs} />
          </button>
          {/* 頭像按鈕 / 登入按鈕 */}
          {loggedIn ? (
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="個人選單"
              aria-expanded={mobileMenuOpen}
              className="relative ml-1 shrink-0"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
                style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
              >
                {avatarInitial}
              </span>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </button>
          ) : (
            <a
              href="/login"
              aria-label="前往登入"
              className="relative ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-brand-subtle hover:text-brand"
            >
              <UserCircle2 size={22} strokeWidth={1.8} />
            </a>
          )}
        </div>
      </header>

      {/* Avatar dropdown */}
      {mobileMenuOpen && loggedIn && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          {/* 使用者資訊 */}
          <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4">
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white shadow-md"
              style={{ background: avatarColor ?? 'linear-gradient(135deg, #cbd5e1, #64748b)' }}
            >
              {avatarInitial}
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <p className="text-sm font-extrabold text-ink">{userName}</p>
          </div>

          {/* PM 幣餘額 */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl bg-raised px-4 py-2.5">
              <TokenBadge className="shrink-0" />
              <span className="text-sm font-bold text-ink">{tokenBalance.toLocaleString()} PM</span>
              <button
                onClick={() => { setMobileMenuOpen(false); setTopupOpen(true) }}
                className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-brand-hover active:opacity-80"
              >
                加值
              </button>
            </div>
          </div>

          <div className="border-t border-line-subtle" />

          {/* 帳號設定 + 登出 */}
          <div className="flex divide-x divide-line-subtle">
            <a
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-ink transition-colors hover:bg-raised"
            >
              <Settings size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
              帳號設定
            </a>
            <button
              onClick={() => { setMobileMenuOpen(false); useAuthStore.getState().logout(); navigate('/login', { replace: true }) }}
              className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
            >
              <LogOut size={16} strokeWidth={2} className="shrink-0" />
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
