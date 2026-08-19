import { useEffect, useRef, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { Toaster } from '../components/ui/sonner'
import { ThemeProvider } from '../components/theme-provider'
import LoadingScreen from '../common/layout/LoadingScreen'
import { useAuthStore } from '../common/stores/useAuthStore'
import { useServiceStore } from '../common/stores/useServiceStore'
import { useGroupStore } from '../common/stores/useGroupStore'
import { useApplicationStore } from '../common/stores/useApplicationStore'
import { useSubscriptionStore } from '../common/stores/useSubscriptionStore'
import { useMemberStore } from '../common/stores/useMemberStore'
import { useFavoriteStore } from '../common/stores/useFavoriteStore'
import { useNotificationStore } from '../common/stores/useNotificationStore'
import { useConversationStore } from '../common/stores/useConversationStore'
import { toast } from '../common/utils/toast'
import { useVersionCheck } from '../common/utils/versionCheck'

// Modal／Drawer 開啟時鎖定捲動（見 common/utils/hooks.js 的 useScrollLock，或
// @base-ui/react 內建的 Dialog/Drawer 各自的鎖定機制，兩者都是對 <html> 設
// overflowY:hidden）——iOS Safari 在鎖定的當下有時不會立刻重新計算 position:fixed
// 元素的版面，導致 Modal／Drawer 背後殘留鎖定前捲動位置的頁面內容透出來（尤其是
// 使用者先把頁面往下捲，再開啟 Modal 的情境）。用同一個座標重新呼叫 scrollTo
// 強迫瀏覽器重新排版，畫面上不會真的移動，只是觸發重繪修正這個殘影
function useIosFixedPositionScrollFix() {
  useEffect(() => {
    const html = document.documentElement
    let wasLocked = html.style.overflowY === 'hidden'
    const observer = new MutationObserver(() => {
      const isLocked = html.style.overflowY === 'hidden'
      if (isLocked && !wasLocked) {
        requestAnimationFrame(() => window.scrollTo(window.scrollX, window.scrollY))
      }
      wasLocked = isLocked
    })
    observer.observe(html, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [])
}

export default function App() {
  const [ready, setReady] = useState(false)
  const bootedRef = useRef(false)
  useIosFixedPositionScrollFix()
  useVersionCheck()

  useEffect(() => {
    function onRefreshMemberStores() {
      const user = useAuthStore.getState().getProfile()
      if (!user) return
      useGroupStore.getState().init({ all: true })
      useMemberStore.getState().init()
      useSubscriptionStore.getState().init()
      useApplicationStore.getState().init()
    }
    function onRefreshApplicationStore() {
      const user = useAuthStore.getState().getProfile()
      if (!user) return
      useApplicationStore.getState().init()
    }
    window.addEventListener('pm:refresh-member-stores', onRefreshMemberStores)
    window.addEventListener('pm:refresh-application-store', onRefreshApplicationStore)
    return () => {
      window.removeEventListener('pm:refresh-member-stores', onRefreshMemberStores)
      window.removeEventListener('pm:refresh-application-store', onRefreshApplicationStore)
    }
  }, [])

  useEffect(() => {
    // React 19 StrictMode（開發模式）會把 mount 的 effect 故意多跑一次來測試 cleanup，
    // 這個 effect 沒有 cleanup、bootApp() 內部也沒有防重入機制，兩次呼叫會各自打一輪
    // API、各自判斷失敗與否，讀取失敗時因此會跳兩次彙總 Toast；用 ref 擋掉第二次呼叫
    if (bootedRef.current) return
    bootedRef.current = true

    async function bootApp() {
      // 第一階段：公開資料 + 驗證身份（不需要 token）
      await Promise.all([
        useAuthStore.getState().init(),
        useServiceStore.getState().init(),
        useGroupStore.getState().init({ all: false }), // 未登入只拿招募中群組（探索頁）
        useNotificationStore.getState().init(),
      ])

      const failedPublicStores = [
        useGroupStore.getState().error,
        useNotificationStore.getState().error,
      ].filter(Boolean)
      if (failedPublicStores.length > 0) {
        toast('部分資料載入失敗，請重新整理頁面', 'error', { persistent: true })
      }

      // 首頁/探索頁只需要第一階段的公開資料，不用再等私人資料才渲染——
      // 私人資料改成不 await，各自的 store 完成後靠 zustand 訂閱自動更新畫面，
      // 已登入使用者不會被拖著多等一輪 applications/subscriptions/members/favorites
      setReady(true)

      // 第二階段：只有已登入才載入私人資料
      const user = useAuthStore.getState().getProfile()
      if (user) {
        // 已登入：重新拉所有狀態的群組，覆蓋第一階段的 recruiting-only 資料
        Promise.all([
          useGroupStore.getState().init({ all: true }),
          useApplicationStore.getState().init(),
          useSubscriptionStore.getState().init(),
          useMemberStore.getState().init(),
          useFavoriteStore.getState().init(),
        ]).then(() => {
          // 各 store 的 init() 內部已自行 catch 錯誤（記錄在各自的 error 欄位，不會讓這裡的
          // Promise.all reject），所以要在這裡統一檢查一次，失敗時跳一個彙總 Toast，
          // 避免資料載入失敗時畫面看起來只是「空的」，使用者不知道其實是連線出了問題
          const failedPrivateStores = [
            useGroupStore.getState().error,
            useApplicationStore.getState().error,
            useSubscriptionStore.getState().error,
            useMemberStore.getState().error,
            useFavoriteStore.getState().error,
          ].filter(Boolean)
          if (failedPrivateStores.length > 0) {
            toast('部分資料載入失敗，請重新整理頁面', 'error', { persistent: true })
          }
          // initConversations 必須在 notifications init 完成後才執行
          useConversationStore.getState().init(user.id)
          useNotificationStore.getState().startPolling(user.id)
        })
      }
    }

    bootApp().catch(err => {
      console.error('[App] Init failed:', err)
      toast('應用程式初始化失敗，請重新整理頁面', 'error', { persistent: true })
      setReady(true)
    })
  }, [])

  if (!ready) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  )
}
