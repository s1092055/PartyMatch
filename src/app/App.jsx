import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { initAuth } from '../shared/stores/authStore'
import { initGroups } from '../shared/stores/groupStore'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([initAuth(), initGroups()])
      .then(() => setReady(true))
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

  return <RouterProvider router={router} />
}
