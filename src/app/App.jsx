import { useEffect, useRef, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { Toaster } from '../components/ui/sonner'
import { ThemeProvider } from '../components/theme-provider'
import LoadingScreen from '../common/layout/LoadingScreen'
import { useAuthStore } from '../common/stores/useAuthStore'
import { useAdminAuthStore } from '../common/stores/useAdminAuthStore'
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
    if (bootedRef.current)
      return;
    bootedRef.current = true

    async function bootApp() {
      await Promise.all([
        useAuthStore.getState().init(),
        useAdminAuthStore.getState().init(),
        useServiceStore.getState().init(),
        useGroupStore.getState().init({ all: false }),
        useNotificationStore.getState().init(),
      ]);

      const failedPublicStores = [
        useGroupStore.getState().error,
        useNotificationStore.getState().error,
      ].filter(Boolean)
      if (failedPublicStores.length > 0) {
        toast('部分資料載入失敗，請重新整理頁面', 'error', { persistent: true })
      }

      setReady(true);

      const user = useAuthStore.getState().getProfile();
      if (user) {
        Promise.all([
          useGroupStore.getState().init({ all: true }),
          useApplicationStore.getState().init(),
          useSubscriptionStore.getState().init(),
          useMemberStore.getState().init(),
          useFavoriteStore.getState().init(),
        ]).then(() => {
          const failedPrivateStores = [
            useGroupStore.getState().error,
            useApplicationStore.getState().error,
            useSubscriptionStore.getState().error,
            useMemberStore.getState().error,
            useFavoriteStore.getState().error,
          ].filter(Boolean);
          if (failedPrivateStores.length > 0) {
            toast('部分資料載入失敗，請重新整理頁面', 'error', { persistent: true })
          }
          useConversationStore.getState().init(user.id);
          useNotificationStore.getState().startPolling(user.id)
        });
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
