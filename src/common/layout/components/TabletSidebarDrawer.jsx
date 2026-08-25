import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogIn, LogOut, Menu, Settings, ShieldCheck, Star, User } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'
import { NAV_SECTIONS } from '../nav'
import { Avatar } from '../../../components/ui/avatar'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogCloseButton } from '../../../components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
import { ProfileModalBody } from '../../../components/ui/ProfileModal'
import { CreditScoreModalBody } from '../../../components/ui/CreditScoreModal'
import { SettingsModalBody } from '../../../components/ui/SettingsModal'
import { HostReviewsModalBody } from '../../../features/manage-groups/components/HostReviewsModal'
import { useAuthStore } from '../../stores/useAuthStore'
import { toast } from '../../utils/toast'
import { PresenceDot, LockBadge } from './navShared'
import { LOCKED_MESSAGE, PRESENCE_LABELS, getNavItemKey, isProtectedNavItem } from './navConstants'

const USER_PANELS = {
  profile:  { title: '個人資料', icon: User },
  credit:   { title: '信用分數', icon: ShieldCheck },
  reviews:  { title: '我的評價', icon: Star },
  settings: { title: '偏好設定', icon: Settings },
}

export default function TabletSidebarDrawer(
  {
    loggedIn,
    pathname,
    userName,
    avatarInitial,
    avatarColor,
    presenceStatus,
    tokenBalance,
    host,
    setTopupOpen,
    closeAll,
    openCreate,
    openMatch,
    preventLockedAction,
    logout,
    loggingOut,
  }
) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userPanel, setUserPanel] = useState('menu')
  const [activeDetailPanel, setActiveDetailPanel] = useState(null)

  function openUserMenu() {
    setOpen(false)
    setUserPanel('menu')
    setActiveDetailPanel(null)
    setUserMenuOpen(true)
  }

  function openUserPanel(panel) {
    setActiveDetailPanel(panel)
    setUserPanel(panel)
  }

  function backToUserMenu() {
    setUserPanel('menu')
  }

  function handleUserPanelTrackTransitionEnd() {
    if (userPanel === 'menu') setActiveDetailPanel(null)
  }

  async function changePresence(next) {
    if (next === presenceStatus) return
    const result = await useAuthStore.getState().updateProfile({ presenceStatus: next })
    if (!result.ok) toast(result.error ?? '儲存失敗，請稍後再試', 'error')
  }

  function closeUserMenu() {
    setUserMenuOpen(false)
  }

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
        className="fixed left-4 top-6 z-50 grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-colors hover:bg-raised can-hover:lg:hidden dark:border-[#238EC7] dark:text-[#238EC7]"
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

            <button
              type="button"
              onClick={() => { setOpen(false); setUserPanel('settings'); setActiveDetailPanel('settings'); setUserMenuOpen(true) }}
              aria-label="偏好設定"
              className="mb-1 flex h-12 w-full items-center gap-3 rounded-2xl px-1 text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center">
                <Settings size={22} strokeWidth={1.5} />
              </span>
              <span className="whitespace-nowrap text-base font-bold">偏好設定</span>
            </button>

            {loggedIn ? (
              <button
                type="button"
                onClick={openUserMenu}
                aria-label="使用者選單"
                className="flex h-14 min-w-0 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:-translate-y-0.5 hover:bg-brand-subtle"
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
              <button
                type="button"
                onClick={openUserMenu}
                aria-label="匿名使用者選單"
                className="flex h-14 min-w-0 w-full items-center gap-3 rounded-2xl px-1 text-left transition-all hover:-translate-y-0.5 hover:bg-brand-subtle"
              >
                <span className="shrink-0 shadow-md rounded-full">
                  <Avatar initial={null} size="md" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold text-ink">匿名使用者</span>
                </span>
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <DialogContent maxWidth="max-w-md" height="min(80dvh, 640px)" className="p-0">
            <DialogTitle className="sr-only">{userPanel === 'menu' ? '使用者選單' : USER_PANELS[userPanel].title}</DialogTitle>
            <DialogDescription>{loggedIn ? userName : '匿名使用者'} 的使用者選單</DialogDescription>

            <div className="flex shrink-0 items-center gap-2 px-4 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {userPanel !== 'menu' && (
                  <>
                    {userPanel !== 'settings' && (
                      <button
                        type="button"
                        onClick={backToUserMenu}
                        aria-label="返回使用者選單"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                      >
                        <ChevronLeft size={18} strokeWidth={1.5} />
                      </button>
                    )}
                    {(() => {
                      const PanelIcon = USER_PANELS[userPanel].icon
                      return <PanelIcon size={16} strokeWidth={1.5} className="shrink-0 text-ink" />
                    })()}
                    <span className="min-w-0 truncate font-extrabold text-ink">{USER_PANELS[userPanel].title}</span>
                  </>
                )}
              </div>
              <DialogCloseButton />
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 flex transition-transform duration-300 ease-in-out"
                style={{ width: '200%', transform: userPanel !== 'menu' ? 'translateX(-50%)' : 'translateX(0)' }}
                onTransitionEnd={handleUserPanelTrackTransitionEnd}
              >
                <div
                  className="flex h-full shrink-0 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ width: '50%' }}
                >
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-3 py-4">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <span className="shrink-0 shadow-md rounded-full">
                        <Avatar initial={loggedIn ? avatarInitial : null} color={avatarColor} size="xl" className="h-28 w-28 text-4xl" />
                      </span>
                      <span className="min-w-0 truncate text-lg font-extrabold text-ink">{loggedIn ? userName : '匿名使用者'}</span>
                    </div>
                    {loggedIn && (
                      <Select value={presenceStatus} onValueChange={changePresence}>
                        <SelectTrigger aria-label="設定目前狀態" className="mx-auto w-auto min-w-36 justify-center gap-2 [&>svg]:hidden">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[60]">
                          {Object.entries(PRESENCE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="pl-2 [&>span:first-child]:hidden">
                              <span className="flex items-center gap-2">
                                <PresenceDot status={value} className="h-2.5 w-2.5 shrink-0" />
                                {label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {loggedIn && (
                      <div className="flex w-full flex-col gap-4 px-1">
                        <button
                          type="button"
                          onClick={() => openUserPanel('profile')}
                          className="flex h-12 w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-2 transition-colors hover:border-brand-border hover:bg-brand-subtle hover:text-brand"
                        >
                          <User size={20} strokeWidth={1.5} className="shrink-0" />
                          <span className="flex-1 text-left">個人資料</span>
                          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-ink-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openUserPanel('credit')}
                          className="flex h-12 w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-2 transition-colors hover:border-brand-border hover:bg-brand-subtle hover:text-brand"
                        >
                          <ShieldCheck size={20} strokeWidth={1.5} className="shrink-0" />
                          <span className="flex-1 text-left">信用分數</span>
                          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-ink-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openUserPanel('reviews')}
                          className="flex h-12 w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-2 transition-colors hover:border-brand-border hover:bg-brand-subtle hover:text-brand"
                        >
                          <Star size={20} strokeWidth={1.5} className="shrink-0" />
                          <span className="flex-1 text-left">我的評價</span>
                          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-ink-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 px-4 pb-4 pt-3">
                    {loggedIn ? (
                      <button
                        type="button"
                        onClick={() => { closeUserMenu(); logout() }}
                        disabled={loggingOut}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-danger/30 px-3 text-center text-sm font-bold text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                      >
                        <LogOut size={18} strokeWidth={1.5} className="shrink-0" />
                        {loggingOut ? '登出中…' : '登出'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { closeUserMenu(); navigate('/login') }}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-subtle px-3 text-center text-sm font-bold text-brand transition-colors hover:bg-brand-muted"
                      >
                        <LogIn size={18} strokeWidth={1.5} className="shrink-0" />
                        登入會員
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="flex shrink-0 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ width: '50%' }}
                >
                  {activeDetailPanel === 'profile' && (
                    <div className="px-6 py-5">
                      <ProfileModalBody />
                    </div>
                  )}
                  {activeDetailPanel === 'credit' && (
                    <CreditScoreModalBody onClose={closeUserMenu} hideFooter />
                  )}
                  {activeDetailPanel === 'reviews' && (
                    <HostReviewsModalBody host={host} />
                  )}
                  {activeDetailPanel === 'settings' && (
                    <div className="space-y-6 px-6 py-5">
                      <SettingsModalBody onClose={closeUserMenu} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
      </Dialog>
    </>
  );
}
