import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '../utils/toast'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import TopupModal from '../../components/ui/TopupModal'
import { LOCKED_MESSAGE } from './components/navConstants'
import DesktopSidebar from './components/DesktopSidebar'
import MobileHeader from './components/MobileHeader'
import MobileDock from './components/MobileDock'

export default function AppNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // 「我的」跟帳號選單都是底部 Drawer（bottom sheet），Base UI Drawer 本身的 backdrop
  // 點擊／Esc 已經會處理「點外面關閉」，不需要再額外用 useClickOutside 偵測
  const [myMenuOpen, setMyMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  // 路由切換時關閉所有選單：於 render 期間比對前一次 pathname 並直接呼叫 setState，
  // 避免用 useEffect（會多觸發一次無謂的 render-commit-effect 循環）
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMyMenuOpen(false)
    setAccountMenuOpen(false)
  }

  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const avatarInitial = currentUser?.avatarInitial ?? null
  const avatarColor = currentUser?.avatarColor ?? null
  const presenceStatus = currentUser?.presenceStatus ?? 'online'

  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [topupOpen, setTopupOpen] = useState(false)

  useEffect(() => {
    function openTopup() { setTopupOpen(true) }
    window.addEventListener('pm:open-topup', openTopup)
    return () => window.removeEventListener('pm:open-topup', openTopup)
  }, [])

  const unreadNotifs = useNotificationStore(s => loggedIn && currentUser?.id ? s.getUnreadCount(currentUser.id) : 0)
  const unreadMsgs = useConversationStore(s => loggedIn && currentUser?.id ? s.getUnreadMsgCount(currentUser.id) : 0)

  function closeAll() {
    document.activeElement?.blur()
    setMyMenuOpen(false)
    setAccountMenuOpen(false)
  }

  function openCreate() {
    closeAll()
    if (!loggedIn) return
    navigate('/create-group')
  }

  function openNotify() {
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-notify'))
  }

  function openMessages() {
    if (!loggedIn) return
    closeAll()
    window.dispatchEvent(new CustomEvent('pm:open-messages'))
  }

  function openMatch() {
    closeAll()
    navigate('/quick-match')
  }

  function preventLockedAction(e) {
    e.preventDefault()
    e.stopPropagation()
    closeAll()
    toast(LOCKED_MESSAGE, 'info', {
      action: {
        label: '前往登入',
        onClick: () => navigate('/login'),
      },
    })
  }

  return (
    <>
      <DesktopSidebar
        loggedIn={loggedIn}
        pathname={pathname}
        userName={userName}
        avatarInitial={avatarInitial}
        avatarColor={avatarColor}
        presenceStatus={presenceStatus}
        unreadNotifs={unreadNotifs}
        unreadMsgs={unreadMsgs}
        tokenBalance={tokenBalance}
        setTopupOpen={setTopupOpen}
        closeAll={closeAll}
        openCreate={openCreate}
        openMatch={openMatch}
        openNotify={openNotify}
        openMessages={openMessages}
        preventLockedAction={preventLockedAction}
      />

      <MobileHeader
        loggedIn={loggedIn}
        unreadNotifs={unreadNotifs}
        unreadMsgs={unreadMsgs}
        openNotify={openNotify}
        openMessages={openMessages}
      />

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />

      <MobileDock
        pathname={pathname}
        loggedIn={loggedIn}
        userName={userName}
        avatarInitial={avatarInitial}
        avatarColor={avatarColor}
        presenceStatus={presenceStatus}
        tokenBalance={tokenBalance}
        setTopupOpen={setTopupOpen}
        closeAll={closeAll}
        openMatch={openMatch}
        openCreate={openCreate}
        preventLockedAction={preventLockedAction}
        myMenuOpen={myMenuOpen}
        setMyMenuOpen={setMyMenuOpen}
        accountMenuOpen={accountMenuOpen}
        setAccountMenuOpen={setAccountMenuOpen}
      />
    </>
  )
}
