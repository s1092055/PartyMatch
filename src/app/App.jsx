import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import ToastContainer from '../shared/ui/ToastContainer'
import { initAuth } from '../shared/stores/authStore'
import { initServices } from '../shared/stores/serviceStore'
import { initGroups } from '../shared/stores/groupStore'
import { initApplications, checkMissedApplicationNotifications } from '../shared/stores/applicationStore'
import { initSubscriptions } from '../shared/stores/subscriptionStore'
import { initMembers } from '../shared/stores/memberStore'
import { initFavorites } from '../shared/stores/favoriteStore'
import { initNotifications } from '../shared/stores/notificationStore'
import { initPayments } from '../shared/stores/paymentStore'

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
      .then(() => { checkMissedApplicationNotifications(); setReady(true) })
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
