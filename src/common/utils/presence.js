import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

const HEARTBEAT_INTERVAL_MS = 15_000;
const BLUR_GRACE_MS = 1_500;

function isWindowActive() {
  return document.visibilityState === 'visible' && document.hasFocus()
}

export function usePresenceAutoStatus(enabled) {
  const lastSentRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    let heartbeatTimer = null
    let blurTimer = null

    function send(status) {
      if (lastSentRef.current === status) return
      lastSentRef.current = status
      useAuthStore.getState().updateProfile({ presenceStatus: status }).catch(() => {})
    }

    function handleChange() {
      clearTimeout(blurTimer)
      if (isWindowActive()) {
        send('online')
      } else {
        blurTimer = setTimeout(() => send('offline'), BLUR_GRACE_MS)
      }
    }

    window.addEventListener('focus', handleChange)
    window.addEventListener('blur', handleChange)
    document.addEventListener('visibilitychange', handleChange)

    handleChange()
    heartbeatTimer = setInterval(() => {
      if (isWindowActive()) send('online')
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      clearInterval(heartbeatTimer)
      clearTimeout(blurTimer)
      window.removeEventListener('focus', handleChange)
      window.removeEventListener('blur', handleChange)
      document.removeEventListener('visibilitychange', handleChange)
      send('offline')
      lastSentRef.current = null
    }
  }, [enabled])
}
