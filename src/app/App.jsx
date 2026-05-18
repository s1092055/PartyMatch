import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { initGroups } from '../shared/stores/groupStore'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initGroups()
      .then(() => setReady(true))
      .catch(err => {
        console.error('[App] Failed to load groups from Firestore:', err)
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
