import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import router from './router'
import ToastContainer from '../shared/ui/ToastContainer'
import { useAuthStore } from '../shared/stores/useAuthStore'
import { useServiceStore } from '../shared/stores/useServiceStore'
import { useGroupStore } from '../shared/stores/useGroupStore'
import { useApplicationStore } from '../shared/stores/useApplicationStore'
import { useSubscriptionStore } from '../shared/stores/useSubscriptionStore'
import { useMemberStore } from '../shared/stores/useMemberStore'
import { useFavoriteStore } from '../shared/stores/useFavoriteStore'
import { useNotificationStore } from '../shared/stores/useNotificationStore'
import { usePaymentStore } from '../shared/stores/usePaymentStore'
import { useConversationStore } from '../shared/stores/useConversationStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
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
          usePaymentStore.getState().init(),
        ])
        // initConversations 必須在 notifications init 完成後才執行
        useConversationStore.getState().init(user.id)
        useApplicationStore.getState().checkMissedNotifications(user)
      }

      setReady(true)
    }

    bootApp().catch(err => {
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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer />
    </QueryClientProvider>
  )
}
