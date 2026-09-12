import { useEffect, useRef } from 'react'
import { useGroupStore } from '../stores/useGroupStore'

const MIN_REFRESH_INTERVAL_MS = 60_000

export function useRefreshGroupsOnFocus() {
  const lastRefreshedAtRef = useRef(null)

  useEffect(() => {
    if (lastRefreshedAtRef.current === null) lastRefreshedAtRef.current = Date.now()

    function onVisible() {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastRefreshedAtRef.current < MIN_REFRESH_INTERVAL_MS) return
      lastRefreshedAtRef.current = now
      useGroupStore.getState().init({ all: true }).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
}
