import { useState } from 'react'
import { LogIn, LogOut, Menu, Settings, ShieldCheck, Star, User } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { NAV_SECTIONS } from '../nav'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogCloseButton } from '../../../components/ui/dialog'
import { PresenceDot, LockBadge } from './navShared'
import { LOCKED_MESSAGE, getNavItemKey, isProtectedNavItem } from './navConstants'

export default function TabletSidebarDrawer(
  {
    loggedIn,
    pathname,
    userName,
    avatarInitial,
    avatarColor,
    presenceStatus,
    tokenBalance,
    setTopupOpen,
    closeAll,
    openCreate,
    openMatch,
    openSettings,
    openProfile,
    openCreditScore,
    openReviews,
    preventLockedAction,
    logout,
    loggingOut,
  }
) {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  function isGuestLocked(item) {
    return !loggedIn && isProtectedNavItem(item)
  }

  function handleNavigate() {
    setOpen(false)
    closeAll()
  }

  function renderItem(item) {
    if (isGuestLocked(item)) {
      const Icon = item.icon ?? LogIn
      return (
        <button
          key={getNavItemKey(item)}
          type="button"
          aria-label={`${item.label}，${LOCKED_MESSAGE}`}
          onClick={e => { setOpen(false); preventLockedAction(e) }}
          className="relative flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-4 transition-colors hover:bg-raised"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center">
            <Icon size={22} strokeWidth={1.5} />
            <LockBadge className="right-0 top-0" />
          </span>
          <span className="whitespace-nowrap text-base font-bold">{item.label}</span>
        </button>
      )
    }

    if (item.type === 'create' || item.type === 'match') {
      const onClick = item.type === 'create' ? openCreate : openMatch
      return (
        <button
          key={item.type}
          type="button"
          onClick={() => { setOpen(false); onClick() }}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center">
            <item.icon size={22} strokeWidth={1.5} />
          </span>
          <span className="whitespace-nowrap text-base font-bold">{item.label}</span>
        </button>
      )
    }

    const isActive = pathname === item.to
    return (
      <a
        key={item.to}
        href={item.to}
        onClick={handleNavigate}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-base transition-all hover:-translate-y-0.5 ${
          isActive
            ? 'bg-brand font-extrabold text-white'
            : 'font-bold text-ink-2 hover:bg-brand-subtle hover:text-brand'
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center">
          <item.icon size={22} strokeWidth={1.5} />
        </span>
        <span className="whitespace-nowrap">{item.label}</span>
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="開啟導覽選單"
        className="fixed left-4 top-6 z-50 grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-colors hover:bg-raised can-hover:lg:hidden"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>
      <Drawer open={open} onOpenChange={setOpen} swipeDirection="left">

        <DrawerContent
          style={{ '--drawer-content-width': '16rem' }}
          className="data-[swipe-direction=left]:border-r-0"
        >
          <DrawerTitle className="sr-only">導覽選單</DrawerTitle>
          <a href="/" onClick={handleNavigate} className="flex h-16 shrink-0 items-center gap-3 px-4" aria-label="回首頁">
            <img src={logoUrl} alt="PartyMatch" className="h-8 w-8 shrink-0" />
            <span className="text-lg font-extrabold">
              <span className="text-brand">Party</span><span className="text-ink">Match</span>
            </span>
          </a>

          <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-2">
            <div className="my-auto space-y-6">
              {NAV_SECTIONS.flatMap(section => section.items).map(renderItem)}
            </div>
          </nav>
          <div className="px-2 pb-4">
            {loggedIn && (
              <button
                type="button"
                onClick={() => { setOpen(false); setTopupOpen(true) }}
                aria-label="PM幣儲值"
                className="mb-1 flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center">
                  <TokenBadge className="shrink-0" />
                </span>
                <span className="whitespace-nowrap text-base font-bold">{tokenBalance.toLocaleString()} PM</span>
              </button>
            )}

            {loggedIn ? (
              <button
                type="button"
                onClick={() => { setOpen(false); setUserMenuOpen(true) }}
                aria-label="使用者選單"
                className="flex h-14 min-w-0 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:bg-raised"
              >
                <span className="relative shrink-0 shadow-md rounded-full">
                  <Avatar initial={avatarInitial} color={avatarColor} size="md" />
                  <PresenceDot status={presenceStatus} className="absolute bottom-0 right-0 h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold text-ink">{userName}</span>
                </span>
              </button>
            ) : (
              <a href="/login" onClick={handleNavigate} className="flex h-14 min-w-0 w-full items-center gap-3 rounded-2xl px-1 text-left text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand">
                <span className="grid h-10 w-10 shrink-0 place-items-center">
                  <LogIn size={22} strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1 whitespace-nowrap">
                  <span className="block truncate text-base font-extrabold">登入</span>
                </span>
              </a>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {loggedIn && (
        <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <DialogContent maxWidth="max-w-xs" className="p-2">
            <DialogTitle className="sr-only">使用者選單</DialogTitle>
            <DialogDescription>{userName} 的使用者選單</DialogDescription>
            <DialogCloseButton className="absolute right-3 top-3" />
            <div className="flex flex-col items-center gap-2 px-3 pb-3 pt-2 text-center">
              <span className="relative shrink-0 shadow-md rounded-full">
                <Avatar initial={avatarInitial} color={avatarColor} size="md" />
                <PresenceDot status={presenceStatus} className="absolute bottom-0 right-0 h-3 w-3" />
              </span>
              <span className="min-w-0 truncate text-base font-extrabold text-ink">{userName}</span>
            </div>
            <div className="flex flex-col gap-1 border-t border-line-subtle pt-2">
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); openProfile() }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
              >
                <User size={18} strokeWidth={1.5} className="shrink-0" />
                個人資料
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); openCreditScore() }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
              >
                <ShieldCheck size={18} strokeWidth={1.5} className="shrink-0" />
                信用分數
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); openReviews() }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
              >
                <Star size={18} strokeWidth={1.5} className="shrink-0" />
                我的評價
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); openSettings() }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
              >
                <Settings size={18} strokeWidth={1.5} className="shrink-0" />
                偏好設定
              </button>
              <div className="my-1 h-px bg-line-subtle" />
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); logout() }}
                disabled={loggingOut}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-bold text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
              >
                <LogOut size={18} strokeWidth={1.5} className="shrink-0" />
                {loggingOut ? '登出中…' : '登出'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
