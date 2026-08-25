import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '../utils/toast'
import { useAuthStore } from '../stores/useAuthStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useConversationStore } from '../stores/useConversationStore'
import { useLogout } from '../utils/hooks'
import TopupModal from '../../components/ui/TopupModal'
import SettingsModal from '../../components/ui/SettingsModal'
import ProfileModal from '../../components/ui/ProfileModal'
import CreditScoreModal from '../../components/ui/CreditScoreModal'
import HostReviewsModal from '../../features/manage-groups/components/HostReviewsModal'
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

  const { loggingOut, logout } = useLogout()
  const [topupOpen, setTopupOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [creditScoreOpen, setCreditScoreOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)

  useEffect(() => {
    function openTopup() { setTopupOpen(true) }
    window.addEventListener('pm:open-topup', openTopup)
    return () => window.removeEventListener('pm:open-topup', openTopup)
  }, [])

  useEffect(() => {
    function openProfileEvent() { setProfileOpen(true) }
    window.addEventListener('pm:open-profile', openProfileEvent)
    return () => window.removeEventListener('pm:open-profile', openProfileEvent)
  }, [])

  const unreadNotifs = useNotificationStore(s => loggedIn && currentUser?.id ? s.getUnreadCount(currentUser.id) : 0)
  const unreadMsgs = useConversationStore(s => loggedIn && currentUser?.id ? s.getUnreadMsgCount(currentUser.id) : 0)

  function closeAll() {
    document.activeElement?.blur()
  }

  function openCreate() {
    closeAll()
    if (!loggedIn) return
    window.dispatchEvent(new CustomEvent('pm:open-create-group'))
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

  function openSettings() {
    closeAll()
    setSettingsOpen(true)
  }

  function openProfile() {
    closeAll()
    setProfileOpen(true)
  }

  function openCreditScore() {
    closeAll()
    setCreditScoreOpen(true)
  }

  function openReviews() {
    closeAll()
    setReviewsOpen(true)
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
        setTopupOpen={setTopupOpen}
        closeAll={closeAll}
        openCreate={openCreate}
        openMatch={openMatch}
        openNotify={openNotify}
        openMessages={openMessages}
        openSettings={openSettings}
        openProfile={openProfile}
        openCreditScore={openCreditScore}
        openReviews={openReviews}
        preventLockedAction={preventLockedAction}
        logout={logout}
        loggingOut={loggingOut}
      />

      <TabletSidebarDrawer
        loggedIn={loggedIn}
        pathname={pathname}
        userName={userName}
        avatarInitial={avatarInitial}
        avatarColor={avatarColor}
        presenceStatus={presenceStatus}
        host={{ id: currentUser?.id, displayName: userName, avatarInitial, avatarColor }}
        closeAll={closeAll}
        openCreate={openCreate}
        openMatch={openMatch}
        preventLockedAction={preventLockedAction}
        logout={logout}
        loggingOut={loggingOut}
      />

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <CreditScoreModal isOpen={creditScoreOpen} onClose={() => setCreditScoreOpen(false)} />
      <HostReviewsModal
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        host={{ id: currentUser?.id, displayName: userName, avatarInitial, avatarColor }}
      />
    </>
  )
}
