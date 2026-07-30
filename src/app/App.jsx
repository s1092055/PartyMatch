import { useEffect, useRef, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { Toaster } from '../components/ui/sonner'
import LoadingScreen from '../shared/layout/LoadingScreen'
import { useAuthStore } from '../shared/stores/useAuthStore'
import { useServiceStore } from '../shared/stores/useServiceStore'
import { useGroupStore } from '../shared/stores/useGroupStore'
import { useApplicationStore } from '../shared/stores/useApplicationStore'
import { useSubscriptionStore } from '../shared/stores/useSubscriptionStore'
import { useMemberStore } from '../shared/stores/useMemberStore'
import { useFavoriteStore } from '../shared/stores/useFavoriteStore'
import { useNotificationStore } from '../shared/stores/useNotificationStore'
import { useConversationStore } from '../shared/stores/useConversationStore'
import { toast } from '../shared/utils/toast'

export default function App() {
  const [ready, setReady] = useState(false)
  const bootedRef = useRef(false)

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

      // 第二階段：只有已登入才載入私人資料
      const user = useAuthStore.getState().getProfile()
      if (user) {
        // 已登入：重新拉所有狀態的群組，覆蓋第一階段的 recruiting-only 資料
        await Promise.all([
          useGroupStore.getState().init({ all: true }),
          useApplicationStore.getState().init(),
          useSubscriptionStore.getState().init(),
          useMemberStore.getState().init(),
          useFavoriteStore.getState().init(),
        ])
        // initConversations 必須在 notifications init 完成後才執行
        useConversationStore.getState().init(user.id)
        useNotificationStore.getState().startPolling(user.id)
        useApplicationStore.getState().checkMissedNotifications(user)
      }

      // 各 store 的 init() 內部已自行 catch 錯誤（記錄在各自的 error 欄位，不會讓這裡的
      // Promise.all reject），所以要在這裡統一檢查一次，失敗時跳一個彙總 Toast，
      // 避免資料載入失敗時畫面看起來只是「空的」，使用者不知道其實是連線出了問題
      const failedStores = [
        useGroupStore.getState().error,
        useApplicationStore.getState().error,
        useSubscriptionStore.getState().error,
        useMemberStore.getState().error,
        useFavoriteStore.getState().error,
        useNotificationStore.getState().error,
      ].filter(Boolean)
      if (failedStores.length > 0) {
        toast('部分資料載入失敗，請重新整理頁面', 'error', { persistent: true })
      }

      setReady(true)
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
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}
