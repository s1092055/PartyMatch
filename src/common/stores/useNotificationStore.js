import { create } from 'zustand'
import {
  readAllNotifications,
  patchNotification,
  markAllNotificationsRead,
} from '../api/notificationsApi'
import { useAuthStore } from './useAuthStore'
import { todayISO, byNewest } from '../utils/date'
import { startPolling } from '../utils/poller'
import { notifyError } from '../utils/toast'

const POLL_INTERVAL_MS = 5000

let _stopPolling = null
let _notifUserId = null

const SYSTEM_NOTIFICATION_TYPES = new Set(['system'])

// 背景輪詢收到新通知時，只重新抓「這個通知類型真的會影響到的 store」，
// 不要每種類型都把 group/member/subscription/application 四個 store 全部重抓一次
const NOTIFICATION_REFRESH_STORES = {
  member_removed:          ['group', 'member', 'subscription'],
  member_left:              ['group', 'member'],
  group_cancelled:          ['group'],
  application_approved:     ['group', 'member', 'subscription', 'application'],
  application_rejected:     ['application'],
  all_service_info_filled:  ['group', 'member'],
  billing_date_confirmed:   ['group', 'member'],
  billing_date_adjusted:    ['group', 'member'],
  group_full_member:        ['group', 'member'],
  escrow_released_member:   ['group', 'member'],
  new_application:          ['application'],
  application_cancelled:    ['application'],
  application_sent:         ['application'],
  group_full:                ['group'],
}

// group/member 這兩個 store 同時被團主視角（群組管理）跟成員視角（我的訂閱）用到，
// 不能直接用「這筆通知動到哪個 store」來決定 nav 紅點要點在哪一頁——
// 每種通知類型其實都只會發給「團主」或「成員」其中一方，這裡直接依照
// 收到通知的那個人的身分，明確標記紅點該點在哪一頁（跟 store 名稱無關）
const NOTIFICATION_REFRESH_PAGE = {
  member_removed:          '/my-subscriptions', // 成員被移出，該群組的訂閱卡片要消失
  member_left:              '/manage-groups',    // 團主視角：自己群組有人退出、要補位
  group_cancelled:          '/my-subscriptions', // 成員視角：自己訂閱的群組被取消
  application_approved:     '/my-subscriptions', // 成員視角：自己的申請通過了
  application_rejected:     '/my-subscriptions', // 成員視角：自己的申請未通過
  all_service_info_filled:  '/manage-groups',    // 團主視角：全員填完服務資訊，可以啟用了
  billing_date_confirmed:   '/my-subscriptions',
  billing_date_adjusted:    '/my-subscriptions',
  group_full_member:        '/my-subscriptions', // 成員視角：自己所在的群組額滿了
  escrow_released_member:   '/my-subscriptions',
  new_application:          '/manage-groups',    // 團主視角：自己群組收到新申請
  application_cancelled:    '/manage-groups',    // 團主視角：申請人取消了申請
  application_sent:         '/my-subscriptions', // 成員視角：自己送出的申請
  group_full:                '/manage-groups',    // 團主視角：自己群組名額已滿，可以鎖定了
}

// application_cancelled 在人氣群組會短時間內連續發生（很多人一起取消），
// 而且對團主來說沒有需要馬上處理的動作，每筆都跳一則 toast 只會洗版；
// 本來就有申請清單頁跟通知面板可以看，靜默標記待刷新、讓 nav 紅點反映就好。
// application_sent 是使用者自己送出申請當下就已經跳過一次「申請已送出！」
// 的即時 toast（見 GroupDetailModal.jsx），背景 polling 抓到同一筆通知時
// 不用再跳第二次，靜默標記待刷新即可。
// new_application 則保留 toast（見 App.jsx），但用固定 id 讓短時間內多筆
// 新申請共用同一則、彼此覆蓋更新，不會疊成一排
const SILENT_REFRESH_TYPES = new Set(['application_cancelled', 'application_sent'])

function dedupeById(list) {
  const seen = new Set()
  return list.filter(n => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })
}

// 只給「還沒登入的訪客」看的前端假資料——訪客沒有帳號，後端不可能有真正
// 的通知 row 可以顯示。已登入會員一律有真正的歡迎通知（註冊時 server/src/
// routes/auth.js 的 notify() 建立），不需要、也不應該再用假資料頂替
function getFallbackSystemNotifications() {
  return [
    {
      id:        'system_guest_welcome',
      userId:    'system',
      type:      'system',
      title:     '歡迎來到 PartyMatch',
      message:   '你可以先探索群組與使用條件搜尋；登入後即可收藏、訂閱、建立與管理群組。',
      isRead:    true,
      createdAt: todayISO(),
      isPublic:  true,
    },
  ]
}

export function isSystemNotification(notification) {
  return (
    SYSTEM_NOTIFICATION_TYPES.has(notification.type) ||
    notification.isPublic === true ||
    !notification.userId
  )
}

function isPublicSystemNotification(notification) {
  const isPublic = notification.isPublic === true || !notification.userId
  return isPublic && isSystemNotification(notification)
}

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading:       false,
  error:         null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const notifications = await readAllNotifications()
      set({ notifications: dedupeById(notifications), loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  startPolling: (userId) => {
    if (_stopPolling) _stopPolling()
    _notifUserId = userId

    _stopPolling = startPolling(async (isActive) => {
      if (!_notifUserId) return
      const polledForUserId = _notifUserId
      try {
        const latest = await readAllNotifications()
        if (!isActive() || _notifUserId !== polledForUserId)
          return;
        const currentIds = new Set(useNotificationStore.getState().notifications.map(n => n.id))
        const newNotifs = latest.filter(n => n.userId === _notifUserId && !currentIds.has(n.id))
        // 最後一位成員被接受時，那位成員會同一批同時收到 application_approved
        // （自己申請通過）跟 group_full_member（群組額滿）兩則通知——
        // 兩則都跟「這個群組現在額滿了」是同一件事，toast 只留額滿那則就好，
        // application_approved 改成靜默（通知中心兩則照樣都會有）
        const fullMemberGroupIds = new Set(
          newNotifs.filter(n => n.type === 'group_full_member').map(n => n.meta?.groupId).filter(Boolean)
        )
        // 通知本身（bell/toast）要立即讓使用者知道發生了什麼事；
        // 實際會讓畫面內容跳動的 store 資料則附在同一個事件裡，交給
        // App.jsx 用「有事件內容的 toast + 手動重新整理」延後套用，
        // 不要讓背景 polling 悄悄把使用者正在看的畫面內容換掉
        newNotifs.forEach(n => {
          const stores = NOTIFICATION_REFRESH_STORES[n.type]
          if (!stores?.length) return
          const silent = SILENT_REFRESH_TYPES.has(n.type) ||
            (n.type === 'application_approved' && fullMemberGroupIds.has(n.meta?.groupId))
          window.dispatchEvent(new CustomEvent('pm:refresh-stores', {
            detail: {
              stores, notifId: n.id, type: n.type, meta: n.meta, title: n.title, message: n.message,
              silent,
              page:   NOTIFICATION_REFRESH_PAGE[n.type],
            },
          }))
        })
        const BALANCE_AFFECTING_TYPES = new Set(['member_removed', 'application_rejected', 'escrow_released', 'dispute_resolved', 'group_cancelled']);
        if (newNotifs.some(n => BALANCE_AFFECTING_TYPES.has(n.type))) {
          useAuthStore.getState().refreshTokenBalance().catch(console.error)
        }
        set({ notifications: dedupeById(latest) })
      } catch {}
    }, POLL_INTERVAL_MS)
  },

  teardown: () => {
    if (_stopPolling) { _stopPolling(); _stopPolling = null }
    _notifUserId = null
    set({ notifications: [] })
  },

  getByUserId: (userId) =>
    get().notifications.filter(n => n.userId === userId).sort(byNewest),

  // 只給訪客用：訪客沒有登入、不可能有真正的通知，完全沒有真實公告時
  // 用前端假資料頂一則歡迎訊息，避免通知中心空白
  getSystemNotifications: () => {
    const systemNotifications = get().notifications
      .filter(isPublicSystemNotification)
      .sort(byNewest)
    return systemNotifications.length > 0 ? systemNotifications : getFallbackSystemNotifications()
  },

  // 給已登入會員用：只回傳資料庫裡真正的公開系統通知，完全沒有的話就是
  // 沒有，不套用假資料頂替（會員的歡迎通知走個人通知，不會是空的）
  getRealSystemNotifications: () =>
    get().notifications.filter(isPublicSystemNotification).sort(byNewest),

  getUnreadCount: (userId) => {
    if (!userId) return 0
    return get().notifications.filter(n => n.userId === userId && !n.isRead).length
  },

  // 跟 nav 紅點共用同一份 NOTIFICATION_REFRESH_PAGE 分類，讓「進入該頁面」
  // 這個動作除了清 nav 紅點，也一併清掉通知中心的未讀（bell 上的紅點）
  getUnreadCountForPage: (userId, page) => {
    if (!userId || !page) return 0
    return get().notifications.filter(n => n.userId === userId && !n.isRead && NOTIFICATION_REFRESH_PAGE[n.type] === page).length
  },

  markReadForPage: (userId, page) => {
    if (!userId || !page) return
    get().notifications
      .filter(n => n.userId === userId && !n.isRead && NOTIFICATION_REFRESH_PAGE[n.type] === page)
      .forEach(n => get().markRead(n.id))
  },

  // 更細顆粒度的版本：打開特定群組的 Modal（不管是團主管理視角還是
  // 成員視角）時，把「跟這個群組有關」的未讀通知都標記已讀，不看類型
  // ——使用者都已經在看這個群組的最新狀態了，不用等他劃過整個頁面
  getUnreadCountForGroup: (userId, groupId) => {
    if (!userId || !groupId) return 0
    return get().notifications.filter(n => n.userId === userId && !n.isRead && n.meta?.groupId === groupId).length
  },

  markReadForGroup: (userId, groupId) => {
    if (!userId || !groupId) return
    get().notifications
      .filter(n => n.userId === userId && !n.isRead && n.meta?.groupId === groupId)
      .forEach(n => get().markRead(n.id))
  },

  markRead: (id) => {
    const prior = get().notifications.find(n => n.id === id) ?? null
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    }))
    patchNotification(id).catch(err => {
      if (prior) set(s => ({ notifications: s.notifications.map(n => n.id === id ? prior : n) }))
      notifyError(err, '標記已讀失敗，請稍後再試')
    })
  },

  markAllRead: (userId) => {
    const priors = get().notifications.filter(n => n.userId === userId)
    set(s => ({
      notifications: s.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n),
    }))
    markAllNotificationsRead().catch(err => {
      set(s => ({
        notifications: s.notifications.map(n => priors.find(p => p.id === n.id) ?? n),
      }))
      notifyError(err, '全部標記已讀失敗，請稍後再試')
    })
  },
}))
