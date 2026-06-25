import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import ToastContainer from '../shared/ui/ToastContainer'
import { initAuth, getCurrentUser } from '../shared/stores/authStore'
import { initServices } from '../shared/stores/serviceStore'
import { initGroups } from '../shared/stores/groupStore'
import { initApplications, checkMissedApplicationNotifications } from '../shared/stores/applicationStore'
import { initSubscriptions } from '../shared/stores/subscriptionStore'
import { initMembers } from '../shared/stores/memberStore'
import { initFavorites } from '../shared/stores/favoriteStore'
import { initNotifications } from '../shared/stores/notificationStore'
import { initPayments } from '../shared/stores/paymentStore'
import { initConversations } from '../shared/stores/conversationStore'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      initAuth(),
      initServices(),
      initGroups(),
      initApplications(),
      initSubscriptions(),
      initMembers(),
      initFavorites(),
      initNotifications(),
      initPayments(),
    ])
      .then(() => {
        // initConversations 必須在 initNotifications 完成後才執行，
        // 否則冷啟動的通知判斷會讀到空的 notifications，導致重複建立通知。
        const user = getCurrentUser()
        if (user) initConversations(user.id)
        checkMissedApplicationNotifications()
        setReady(true)
      })
      .catch(err => {
        console.error('[App] Init failed:', err)
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-3">載入中…</p>
      </div>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}
