import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '../utils/toast'
import { useClickOutside } from '../utils/hooks'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import TopupModal from '../ui/TopupModal'
import { LOCKED_MESSAGE } from './components/navConstants'
import DesktopSidebar from './components/DesktopSidebar'
import MobileHeader from './components/MobileHeader'
import MobileDock from './components/MobileDock'

export default function AppNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [myMenuOpen, setMyMenuOpen] = useState(false)
  const myMenuRef = useRef(null)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const createMenuRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)

  useClickOutside(myMenuOpen, [myMenuRef], () => setMyMenuOpen(false))
  useClickOutside(createMenuOpen, [createMenuRef], () => setCreateMenuOpen(false))
  useClickOutside(mobileMenuOpen, [mobileMenuRef], () => setMobileMenuOpen(false))

  // 路由切換時關閉所有選單：於 render 期間比對前一次 pathname 並直接呼叫 setState，
  // 避免用 useEffect（會多觸發一次無謂的 render-commit-effect 循環）
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setDesktopMenuOpen(false)
    setMobileMenuOpen(false)
    setMyMenuOpen(false)
    setCreateMenuOpen(false)
  }

  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userName = currentUser?.name ?? currentUser?.displayName ?? '使用者'
  const avatarInitial = userName[0] ?? 'U'
  const avatarColor = currentUser?.avatarColor ?? null

  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [topupOpen, setTopupOpen] = useState(false)

  useEffect(() => {
    function openTopup() { setTopupOpen(true) }
    window.addEventListener('pm:open-topup', openTopup)
    return () => window.removeEventListener('pm:open-topup', openTopup)
  }, [])

  const unreadNotifs = useNotificationStore(s => loggedIn && currentUser?.id ? s.getUnreadCount(currentUser.id) : 0)
  const unreadMsgs = useConversationStore(s => loggedIn && currentUser?.id ? s.getUnreadMsgCount(currentUser.id) : 0)

  const [prevLoggedIn, setPrevLoggedIn] = useState(loggedIn)
  if (loggedIn !== prevLoggedIn) {
    setPrevLoggedIn(loggedIn)
    if (!loggedIn) {
      setDesktopMenuOpen(false)
      setMobileMenuOpen(false)
    }
  }

  function closeAll() {
    document.activeElement?.blur()
    setDesktopMenuOpen(false)
    setMobileMenuOpen(false)
    setMyMenuOpen(false)
    setCreateMenuOpen(false)
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

  function preventLockedAction(e, redirectTo) {
    e.preventDefault()
    e.stopPropagation()
    closeAll()
    const target = redirectTo || '/'
    toast(LOCKED_MESSAGE, 'info', {
      action: {
        label: '前往登入',
        onClick: () => navigate(`/login?redirectTo=${encodeURIComponent(target)}`),
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
        unreadNotifs={unreadNotifs}
        unreadMsgs={unreadMsgs}
        tokenBalance={tokenBalance}
        desktopMenuOpen={desktopMenuOpen}
        setDesktopMenuOpen={setDesktopMenuOpen}
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
        userName={userName}
        avatarInitial={avatarInitial}
        avatarColor={avatarColor}
        unreadNotifs={unreadNotifs}
        tokenBalance={tokenBalance}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        mobileMenuRef={mobileMenuRef}
        setTopupOpen={setTopupOpen}
        openNotify={openNotify}
      />

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />

      <MobileDock
        pathname={pathname}
        loggedIn={loggedIn}
        closeAll={closeAll}
        openMatch={openMatch}
        openCreate={openCreate}
        openMessages={openMessages}
        preventLockedAction={preventLockedAction}
        createMenuOpen={createMenuOpen}
        setCreateMenuOpen={setCreateMenuOpen}
        createMenuRef={createMenuRef}
        myMenuOpen={myMenuOpen}
        setMyMenuOpen={setMyMenuOpen}
        myMenuRef={myMenuRef}
        unreadMsgs={unreadMsgs}
      />
    </>
  )
}
