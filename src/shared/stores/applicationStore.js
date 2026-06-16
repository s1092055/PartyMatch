import { readAllApplications, insertApplication, patchApplication } from '../api/applicationsApi'
import { addParticipantToConversation, sendSystemMessage } from '../api/messagesApi'
import { normalizeApplication } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUserProfile } from './authStore'
import { createNotification } from './notificationStore'

let _apps = []

function emitApplicationsChanged(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('pm:applications-changed', { detail }))
}

export async function initApplications() {
  _apps = await readAllApplications()
}

export function getApplicationsByGroupId(groupId) {
  return _apps.filter(a => a.groupId === groupId)
}

export function getApplicationsByUserId(userId) {
  return _apps.filter(a => (a.applicantId ?? a.userId) === userId)
}

export function getApplicationByUserAndGroup(userId, groupId) {
  return _apps.find(
    a => (a.applicantId ?? a.userId) === userId && a.groupId === groupId
  ) ?? null
}

export function getApplicationsByHostId(hostId, groups) {
  const hostGroupIds = new Set(groups.filter(g => g.hostId === hostId).map(g => g.id))
  return _apps.filter(a => hostGroupIds.has(a.groupId))
}

export function createApplication({ groupId, groupName, serviceId, serviceName, planName, hostId, hostName, hostAvatarInitial, hostAvatarColor, message }) {
  const activeUser = getActiveUserProfile()
  if (!activeUser) throw new Error('登入後才能申請加入群組')

  const now = todayISO()
  const app = normalizeApplication({
    id:                     createId('app'),
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
    createdAt:              now,
    updatedAt:              now,
  })
  _apps.push(app)
  insertApplication(app).catch(console.error)
  createNotification({
    userId:  app.hostId,
    type:    'new_application',
    title:   '收到新的加入申請',
    message: `${app.applicantName} 申請加入「${app.groupName ?? app.serviceName}」群組。`,
  })
  emitApplicationsChanged({ type: 'created', application: app })
  return app
}

export function updateApplicationStatus(id, status) {
  const app = _apps.find(a => a.id === id)
  _apps = _apps.map(a => a.id === id ? { ...a, status } : a)
  emitApplicationsChanged({ type: 'status_changed', applicationId: id, status })
  patchApplication(id, { status }).catch(console.error)

  if (status === 'approved' && app) {
    const convId = `group_${app.groupId}`
    const applicantId = app.applicantId ?? app.userId
    const applicantName = app.applicantName ?? app.userName ?? '新成員'
    addParticipantToConversation(convId, applicantId, {
      name:          applicantName,
      avatarInitial: app.applicantAvatarInitial ?? applicantName[0] ?? '?',
      avatarColor:   app.applicantAvatarColor   ?? '#94A3B8',
    })
      .then(() => sendSystemMessage(convId, `${applicantName} 加入了群組`))
      .catch(console.error)
  }
}
