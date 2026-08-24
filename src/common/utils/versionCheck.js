import { useEffect } from 'react'
import { startPolling } from './poller'
import { toast } from './toast'

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function useVersionCheck() {
  useEffect(() => {
    let notified = false

    async function check() {
      if (notified) return
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { buildId } = await res.json()
        if (buildId && buildId !== __APP_BUILD_ID__) {
          notified = true
          toast('有新版本可用，請重新整理', 'info', {
            persistent: true,
            action: { label: '重新整理', onClick: () => window.location.reload() },
          })
        }
      } catch {}
    }

    const stopPolling = startPolling(check, CHECK_INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
