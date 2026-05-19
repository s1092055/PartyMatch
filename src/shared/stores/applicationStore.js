import { readAllApplications, insertApplication, patchApplication } from '../api/applicationsApi'
import { normalizeApplication } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUserProfile } from './userStore'

let _apps = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export async function initApplications() {
  const all = await readAllApplications()
  _apps = DEMO_MODE ? all : all.filter(a => !a._demo)
}

export function getApplications() { return _apps }

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

export function createApplication({ groupId, groupName, serviceId, serviceName, planName, hostId, hostName, message }) {
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
    applicantId:            activeUser.id,
    applicantName:          activeUser.displayName,
    applicantAvatarInitial: activeUser.avatarInitial,
    applicantAvatarColor:   activeUser.avatarColor,
    message:                message ?? '',
    status:                 'pending',
    createdAt:              now,
    updatedAt:              now,
  })
  _apps.push(app)
  insertApplication(app).catch(console.error)
  window.dispatchEvent(new CustomEvent('pm:application-created', { detail: { hostId: app.hostId } }))
  return app
}

export function updateApplicationStatus(id, status) {
  _apps = _apps.map(a => a.id === id ? { ...a, status } : a)
  patchApplication(id, { status }).catch(console.error)
}
