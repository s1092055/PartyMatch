import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '../utils/toast'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import TopupModal from '../../components/ui/TopupModal'
import { LOCKED_MESSAGE } from './components/navConstants'
import DesktopSidebar from './components/DesktopSidebar'
import TabletSidebarDrawer from './components/TabletSidebarDrawer'

export default function AppNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

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
    window.dispatchEvent(new CustomEvent('pm:open-quick-match'))
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

      <TabletSidebarDrawer
        loggedIn={loggedIn}
        pathname={pathname}
        userName={userName}
        avatarInitial={avatarInitial}
        avatarColor={avatarColor}
        presenceStatus={presenceStatus}
        closeAll={closeAll}
        openCreate={openCreate}
        openMatch={openMatch}
        preventLockedAction={preventLockedAction}
      />

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </>
  )
}
