import { useEffect } from 'react'
import { startPolling } from './poller'
import { toast } from './toast'

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 分鐘

// 部署新版本後，舊分頁記得的 JS 檔名 hash 會被新版本取代，這時候動態載入某個尚未載入過的
// 路由（例如切換頁面）會拿到 404 → SPA fallback 的 index.html，觸發「MIME type 不對」的錯誤。
// 用這支輪詢偵測「目前部署的版本」是否已經跟這個分頁載入當下不同，及早提示使用者重新整理，
// 而不是等到真的踩到壞掉的動態載入才發現
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
          toast('有新版本可用，重新整理即可更新', 'info', {
            persistent: true,
            action: { label: '重新整理', onClick: () => window.location.reload() },
          })
        }
      } catch {
        // 網路異常或離線時不用特別處理，下次輪詢再試
      }
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
