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
    const saved = await insertApplication({ groupId, message: message ?? '' });
    app.id = saved.id
    set(s => ({ applications: [app, ...s.applications] }))
    useAuthStore.getState().refreshTokenBalance();
    return app;
  },

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

  cancel: async (id) => {
    set(s => ({
      applications: s.applications.map(a => a.id === id ? { ...a, status: 'cancelled' } : a),
    }))
    try {
      await deleteApplication(id)
      useAuthStore.getState().refreshTokenBalance();
    } catch (err) {
      await Promise.all([get().init(), useMemberStore.getState().init(), useSubscriptionStore.getState().init()]);
      throw err
    }
  },
}))
