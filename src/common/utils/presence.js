import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

const HEARTBEAT_INTERVAL_MS = 15_000
// 短暫失焦（例如彈出瀏覽器原生的檔案選取視窗、切到另一個視窗確認一下馬上切回來）
// 先給一點緩衝，超過這段時間還沒回來才真的判定離線，避免正常操作被誤判離線又立刻
// 恢復在線，畫面上的狀態點一直閃
const BLUR_GRACE_MS = 1_500

function isWindowActive() {
  return document.visibilityState === 'visible' && document.hasFocus()
}

// 使用者狀態改成自動偵測：視窗在前景且有焦點才算在線，切走/最小化/被其他視窗
// 蓋住就算離線；每 15 秒送一次心跳，讓後端知道這個 online 狀態還是最新的
// （見 server/src/lib/presenceSweeper.js，太久沒心跳會被背景掃描判定離線）
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
