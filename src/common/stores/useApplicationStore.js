import { create } from 'zustand'
import {
  readAllApplications,
  insertApplication,
  patchApplication,
  deleteApplication,
} from '../api/applicationsApi'

import { normalizeApplication } from '../utils/modelNormalizers'
import { nowISO, byNewest } from '../utils/date'
import { createId } from '../utils/storage'
import { useAuthStore } from './useAuthStore'
import { useNotificationStore } from './useNotificationStore'
import { useMemberStore } from './useMemberStore'
import { useSubscriptionStore } from './useSubscriptionStore'

export const useApplicationStore = create((set, get) => ({
  applications: [],
  loading:      false,
  error:        null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const applications = await readAllApplications()
      set({ applications: applications.map(normalizeApplication), loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getByGroupId: (groupId) =>
    get().applications.filter(a => a.groupId === groupId).sort(byNewest),

  getByUserId: (userId) =>
    get().applications.filter(a => (a.applicantId ?? a.userId) === userId).sort(byNewest),

  getByUserAndGroup: (userId, groupId) => {
    const matches = get().applications.filter(
      a => (a.applicantId ?? a.userId) === userId && a.groupId === groupId
    )
    if (!matches.length) return null
    return matches.sort(byNewest)[0]
  },

  getByHostId: (hostId, groups) => {
    const hostGroupIds = new Set(groups.filter(g => g.hostId === hostId).map(g => g.id))
    return get().applications.filter(a => hostGroupIds.has(a.groupId)).sort(byNewest)
  },

  // ── 送出申請 ────────────────────────────────────────────────────────────────
  create: async (data, activeUser) => {
    if (!activeUser) throw new Error('登入後才能申請加入群組')
    const { groupId, groupName, serviceId, serviceName, planName, hostId, hostName, hostAvatarInitial, hostAvatarColor, message } = data
    const tempId = createId('app')
    const app = normalizeApplication({
      id:                     tempId,
      groupId,
      groupName,
      serviceId,
      serviceName,
      planName,
      hostId,
      hostName,
      hostAvatarInitial,
      hostAvatarColor,
      applicantId:            activeUser.id,
      applicantName:          activeUser.displayName,
      applicantAvatarInitial: activeUser.avatarInitial,
      applicantAvatarColor:   activeUser.avatarColor,
      applicantCreditScore:   activeUser.creditScore ?? 80,
      message:                message ?? '',
      status:                 'pending',
      createdAt:              nowISO(),
      updatedAt:              nowISO(),
    })
    // 等後端確認成功才寫入 store：先樂觀新增會讓探索頁卡片上的「已申請」badge
    // 在餘額不足等錯誤發生時閃一下（新增又立刻被回滾移除）
    const saved = await insertApplication({ groupId, message: message ?? '' })
    app.id = saved.id
    set(s => ({ applications: [app, ...s.applications] }))
    // 申請當下就會代管扣款，重新拉一次餘額讓畫面上的PM幣顯示同步
    useAuthStore.getState().refreshTokenBalance()
    // application_sent／new_application 通知已經由後端 POST /applications 在同一個請求裡建立，
    // 不在這裡另外呼叫，避免使用者關閉分頁時前端這段程式碼沒機會執行，通知就此消失
    return app
  },

  // ── 審核申請 ────────────────────────────────────────────────────────────────
  updateStatus: (id, status) => {
    const app = get().applications.find(a => a.id === id)
    set(s => ({
      applications: s.applications.map(a => a.id === id ? { ...a, status } : a),
    }))

    const notifStore = useNotificationStore.getState()
    if ((status === 'approved' || status === 'rejected') && app?.hostId) {
      const notif = notifStore.getByUserId(app.hostId)
        .find(n => n.type === 'new_application' && n.meta?.applicationId === id && !n.isRead)
      if (notif) notifStore.markRead(notif.id)
    }

    return patchApplication(id, { status })
  },

  // ── 取消申請（申請人自行取消 pending 申請）────────────────────────────────
  cancel: async (id) => {
    set(s => ({
      applications: s.applications.map(a => a.id === id ? { ...a, status: 'cancelled' } : a),
    }))
    try {
      await deleteApplication(id)
      // 取消會退還申請當下代管的金額，重新拉一次餘額讓畫面上的PM幣顯示同步
      useAuthStore.getState().refreshTokenBalance()
      // application_cancelled 通知已經由後端 DELETE /applications/:id 建立，不在這裡重複呼叫
    } catch (err) {
      // 取消失敗最常見的原因是團主剛好搶先一步審核通過（後端用條件式更新保證只有一邊會成功）：
      // 這種情況下自己已經是真正的成員，不能只重新整理 applications，member/subscription
      // 這兩個 store 也要一併重新拉，不然「我的訂閱」會漏掉這個剛剛才成立的群組
      await Promise.all([get().init(), useMemberStore.getState().init(), useSubscriptionStore.getState().init()])
      throw err
    }
  },
}))
