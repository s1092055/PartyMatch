import { create } from 'zustand'
import {
  readAllApplications,
  insertApplication,
  patchApplication,
} from '../api/applicationsApi'
import { insertNotification } from '../api/notificationsApi'

import { normalizeApplication } from '../utils/modelNormalizers'
import { nowISO } from '../utils/date'
import { createId } from '../utils/storage'
import { useNotificationStore } from './useNotificationStore'

function byNewest(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
}

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
    set(s => ({ applications: [app, ...s.applications] }))
    try {
      // 只送後端需要的欄位，並用後端回傳的 DB id 取代本地 tempId
      const saved = await insertApplication({ groupId, message: message ?? '' })
      set(s => ({
        // 先移除可能存在的舊紀錄（重新申請時 saved.id 與舊的 rejected 紀錄相同）
        // 再將 tempId 替換為真實 id
        applications: s.applications
          .filter(a => a.id !== saved.id)
          .map(a => a.id === tempId ? { ...a, id: saved.id, status: 'pending' } : a),
      }))
      app.id = saved.id
    } catch (err) {
      set(s => ({ applications: s.applications.filter(a => a.id !== tempId) }))
      throw err
    }
    const notifStore = useNotificationStore.getState()
    // 通知申請人（本人，即時寫入本地 store + DB）
    notifStore.create({
      userId:  app.applicantId,
      type:    'application_sent',
      title:   '申請已送出',
      message: `你的加入申請已送達「${app.groupName ?? app.serviceName}」團主，等待審核。`,
      meta:    { groupId: app.groupId, applicationId: app.id },
    })
    // 宿主通知：只寫入 DB，宿主刷新頁面後自然出現（不即時推入對方 session 的 store）
    if (app.hostId) {
      insertNotification({
        userId:  app.hostId,
        type:    'new_application',
        title:   '收到新的加入申請',
        message: `${app.applicantName ?? '有人'} 申請加入「${app.groupName ?? app.serviceName}」群組。`,
        meta:    { groupId: app.groupId, applicationId: app.id },
      }).catch(console.error)
    }
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

  // ── 撤回申請 ────────────────────────────────────────────────────────────────
  withdraw: (id) => get().updateStatus(id, 'removed'),

  // 冷啟動補通知：init + notifications init 都完成後呼叫
  checkMissedNotifications: (currentUser) => {
    if (!currentUser) return
    const notifStore = useNotificationStore.getState()
    const existingNotifAppIds = new Set(
      notifStore.getByUserId(currentUser.id)
        .filter(n => ['application_approved', 'application_rejected', 'new_application'].includes(n.type))
        .map(n => n.meta?.applicationId)
        .filter(Boolean)
    )

    get().applications.forEach(app => {
      const applicantId = app.applicantId ?? app.userId

      if (applicantId === currentUser.id && !existingNotifAppIds.has(app.id)) {
        if (app.status === 'approved') {
          notifStore.create({
            userId:  currentUser.id,
            type:    'application_approved',
            title:   '申請已通過',
            message: `你申請加入的「${app.groupName ?? app.serviceName}」群組已通過審核，歡迎加入！`,
            meta:    { applicationId: app.id, groupId: app.groupId },
          })
        } else if (app.status === 'rejected') {
          notifStore.create({
            userId:  currentUser.id,
            type:    'application_rejected',
            title:   '申請未通過',
            message: `很抱歉，你申請加入的「${app.groupName ?? app.serviceName}」群組申請未通過。`,
            meta:    { applicationId: app.id },
          })
        }
      }

      if (app.hostId === currentUser.id && app.status === 'pending' && !existingNotifAppIds.has(app.id)) {
        notifStore.create({
          userId:  currentUser.id,
          type:    'new_application',
          title:   '收到新的加入申請',
          message: `${app.applicantName ?? '有人'} 申請加入「${app.groupName ?? app.serviceName}」群組。`,
          meta:    { groupId: app.groupId, applicationId: app.id },
        })
      }
    })
  },
}))
