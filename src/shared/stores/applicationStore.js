import { readAllApplications, insertApplication, patchApplication } from '../api/applicationsApi'
import { normalizeApplication } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUserProfile } from './userStore'

export function getApplications() {
  return readAllApplications()
}

export function getApplicationsByGroupId(groupId) {
  return readAllApplications().filter(a => a.groupId === groupId)
}

export function getApplicationsByUserId(userId) {
  return readAllApplications().filter(a => (a.applicantId ?? a.userId) === userId)
}

export function getApplicationByUserAndGroup(userId, groupId) {
  return readAllApplications().find(
    a => (a.applicantId ?? a.userId) === userId && a.groupId === groupId
  ) ?? null
}

export function getApplicationsByHostId(hostId, groups) {
  const hostGroupIds = new Set(groups.filter(g => g.hostId === hostId).map(g => g.id))
  return readAllApplications().filter(a => hostGroupIds.has(a.groupId))
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
  return insertApplication(app)
}

export function updateApplicationStatus(id, status) {
  return patchApplication(id, { status })
}
