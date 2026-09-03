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
import { usePendingRefreshStore } from '../common/stores/usePendingRefreshStore'
import { useOpenGroupStore } from '../common/stores/useOpenGroupStore'
import { useConversationStore } from '../common/stores/useConversationStore'
import { toast, dismissToast } from '../common/utils/toast'
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

    const STORE_REFRESHERS = {
      group:        () => useGroupStore.getState().init({ all: true }),
      member:       () => useMemberStore.getState().init(),
      subscription: () => useSubscriptionStore.getState().init(),
      application:  () => useApplicationStore.getState().init(),
    }

    // pm:refresh-stores 只來自背景 polling（別人造成的變動），不是使用者自己的動作。
    // 通知本身（toast 內容）要立即顯示讓使用者知道發生了什麼事；
    // 但實際會讓畫面內容跳動的 store 資料延後套用，等使用者按下 toast 的
    // 「重新整理」才刷新，避免正在看的群組/申請內容忽然被背景 polling 換掉。
    // 待刷新清單放進 usePendingRefreshStore（而不是這裡的區域變數），
    // 讓 nav 上的小紅點也能反應「還有東西沒刷新」，就算 toast 被滑掉也看得到
    let pendingToastIds = new Set()
    // 團主端有些 toast 是針對特定群組的（例如「群組名額已滿」），如果他自己
    // 點開了那個群組的 Modal，等於已經看過了，這個 toast 就該自動消失，
    // 不用等他點 toast 上的動作按鈕——這裡記錄「哪個群組對應哪些 toast id」
    const pendingGroupToastIds = new Map()

    function registerGroupToast(groupId, toastId, page) {
      if (!groupId || page !== '/manage-groups') return
      if (!pendingGroupToastIds.has(groupId)) pendingGroupToastIds.set(groupId, new Set())
      pendingGroupToastIds.get(groupId).add(toastId)
    }

    const unsubscribeHostOpenGroup = useOpenGroupStore.subscribe(state => {
      const groupId = state.hostOpenGroupId
      const toastIds = groupId && pendingGroupToastIds.get(groupId)
      if (!toastIds) return
      toastIds.forEach(id => { dismissToast(id); pendingToastIds.delete(id) })
      pendingGroupToastIds.delete(groupId)
    })

    async function runPendingRefresh() {
      const user = useAuthStore.getState().getProfile()
      const pending = usePendingRefreshStore.getState().pending
      const refreshes = user
        ? [...pending].map(store => STORE_REFRESHERS[store]?.()).filter(Boolean)
        : []
      usePendingRefreshStore.getState().clear()
      pendingToastIds.forEach(id => dismissToast(id))
      pendingToastIds = new Set()
      pendingGroupToastIds.clear()
      // 等待被延後的 store 刷新真正落地，再讓 toast 動作（例如開啟群組 Modal）
      // 讀取資料，避免 Modal 開啟當下 groups/members 還沒更新完成、找不到對應
      // 群組而閃退，或跟 Modal 自己觸發的 refreshGroup 產生互相覆蓋的競態
      await Promise.all(refreshes)
    }

    // 部分通知類型除了「刷新資料」之外，還帶有明確的下一步動作，
    // 這裡集中定義那個動作的按鈕文字跟要做的事；沒列在這裡的類型
    // 一律用預設的「重新整理」（只套用待刷新資料，不做額外導覽）
    const TOAST_ACTIONS = {
      new_application: {
        label:   '前往查看',
        toastId: 'pm-new-application', // 短時間內多筆新申請共用同一則、彼此覆蓋，不疊成一排
        run:     (meta) => {
          if (!meta?.groupId) return
          window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: meta.groupId, openApplications: true } }))
        },
      },
      application_rejected: {
        label: '前往探索',
        // 直接整頁重新載入，而不是走 SPA 導頁：不只群組列表，
        // 探索頁用到的 application/member 等資料也一併重新抓一輪，
        // 不用另外一一列出要刷新哪些 store
        run: () => { window.location.href = '/explore' },
      },
      application_approved: {
        label: '前往查看',
        run:   (meta) => {
          if (!meta?.groupId) return
          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: meta.groupId } }))
        },
      },
      member_removed: {
        label: '前往查看',
        run:   (meta) => {
          if (!meta?.groupId) return
          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: meta.groupId } }))
        },
      },
      group_full_member: {
        label: '前往查看',
        run:   (meta) => {
          if (!meta?.groupId) return
          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: meta.groupId } }))
        },
      },
      group_full: {
        label: '前往查看',
        run:   (meta) => {
          if (!meta?.groupId) return
          window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: meta.groupId } }))
        },
      },
      member_left: {
        label: '前往查看',
        run:   (meta) => {
          if (!meta?.groupId) return
          window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: meta.groupId, openMembers: true } }))
        },
      },
    }

    function onRefreshStores(event) {
      const user = useAuthStore.getState().getProfile()
      if (!user) return
      const { stores = [], notifId, type, meta, title, message, silent, page } = event.detail ?? {}
      usePendingRefreshStore.getState().mark(stores, page)
      if (silent) return

      // 團主已經開著這個群組的 Modal 時，「群組名額已滿」不用再跳 toast 吵他——
      // 通知本身還是照樣進通知中心，只是不用再彈一次視窗蓋在他正在看的畫面上
      if (type === 'group_full' && meta?.groupId && useOpenGroupStore.getState().hostOpenGroupId === meta.groupId) {
        return
      }

      const toastAction = TOAST_ACTIONS[type]
      // 同一個群組、同一種類型的通知短時間內重複出現時（例如團主一直沒處理，
      // 名額滿了又有人取消、又滿了），toast id 用 type+groupId 組合，讓新的
      // 直接覆蓋舊的同一則，而不是每筆通知各自累積成一長串疊不完的 toast
      const toastId = toastAction?.toastId ?? (meta?.groupId ? `pm-${type}-${meta.groupId}` : notifId) ?? 'pm-pending-data-refresh'
      pendingToastIds.add(toastId)
      registerGroupToast(meta?.groupId, toastId, page)

      toast(title || message || '有群組或申請狀態更新了', 'info', {
        id: toastId,
        persistent: true,
        action: {
          label: toastAction?.label ?? '重新整理',
          onClick: async () => {
            await runPendingRefresh()
            toastAction?.run(meta)
          },
        },
      })
    }
    window.addEventListener('pm:refresh-member-stores', onRefreshMemberStores)
    window.addEventListener('pm:refresh-stores', onRefreshStores)
    return () => {
      window.removeEventListener('pm:refresh-member-stores', onRefreshMemberStores)
      window.removeEventListener('pm:refresh-stores', onRefreshStores)
      unsubscribeHostOpenGroup()
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
        toast('部分資料載入失敗，請重新整理頁面', 'error', { id: 'pm-boot-load-failed', persistent: true })
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
            toast('部分資料載入失敗，請重新整理頁面', 'error', { id: 'pm-boot-load-failed', persistent: true })
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
