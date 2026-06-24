import { readAllApplications, subscribeToApplications, insertApplication, patchApplication } from '../api/applicationsApi'
import { addParticipantToConversation, sendSystemMessage } from '../api/messagesApi'
import { normalizeApplication } from '../utils/modelNormalizers'
import { nowISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUserProfile } from './authStore'
import { createNotification, getNotifications } from './notificationStore'

let _apps = []
let _unsub = null

function emitApplicationsChanged(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('pm:applications-changed', { detail }))
}

export async function initApplications() {
  _apps = await readAllApplications()
}

export function initLiveApplications() {
  teardownLiveApplications()
  let _prevStatuses = null  // null = 首次 snapshot，建立基線不發通知
  _unsub = subscribeToApplications(applications => {
    if (_prevStatuses === null) {
      _prevStatuses = new Map(applications.map(a => [a.id, a.status]))
    } else {
      const currentUser = getActiveUserProfile()
      if (currentUser) {
        applications.forEach(app => {
          const prevStatus = _prevStatuses.get(app.id)
          const applicantId = app.applicantId ?? app.userId

          // 新申請且當前用戶是團主 → 通知自己
          if (prevStatus === undefined && app.hostId === currentUser.id) {
            createNotification({
              userId:  currentUser.id,
              type:    'new_application',
              title:   '收到新的加入申請',
              message: `${app.applicantName ?? '有人'} 申請加入「${app.groupName ?? app.serviceName}」群組。`,
              meta:    { groupId: app.groupId },
            })
          }

          // 申請狀態從 pending 變更，且當前用戶是申請人 → 通知自己
          if (prevStatus === 'pending' && applicantId === currentUser.id) {
            if (app.status === 'approved') {
              createNotification({
                userId:  currentUser.id,
                type:    'application_approved',
                title:   '申請已通過',
                message: `你申請加入的「${app.groupName ?? app.serviceName}」群組已通過審核，歡迎加入！`,
                meta:    { applicationId: app.id, groupId: app.groupId },
              })
            } else if (app.status === 'rejected') {
              createNotification({
                userId:  currentUser.id,
                type:    'application_rejected',
                title:   '申請未通過',
                message: `很抱歉，你申請加入的「${app.groupName ?? app.serviceName}」群組申請未通過。`,
                meta:    { applicationId: app.id },
              })
            }
          }
        })
      }
      _prevStatuses = new Map(applications.map(a => [a.id, a.status]))
    }
    _apps = applications
    emitApplicationsChanged()
  })
}

export function teardownLiveApplications() {
  if (_unsub) { _unsub(); _unsub = null }
}

function byNewest(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
}

export function getApplicationsByGroupId(groupId) {
  return _apps.filter(a => a.groupId === groupId).sort(byNewest)
}

export function getApplicationsByUserId(userId) {
  return _apps.filter(a => (a.applicantId ?? a.userId) === userId).sort(byNewest)
}

export function getMemberGroupIds(userId) {
  if (!userId) return new Set()
  return new Set(
    _apps.filter(a => (a.applicantId ?? a.userId) === userId && a.status === 'approved').map(a => a.groupId)
  )
}

export function getApplicationByUserAndGroup(userId, groupId) {
  const matches = _apps.filter(
    a => (a.applicantId ?? a.userId) === userId && a.groupId === groupId
  )
  if (!matches.length) return null
  return matches.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0]
}

export function getApplicationsByHostId(hostId, groups) {
  const hostGroupIds = new Set(groups.filter(g => g.hostId === hostId).map(g => g.id))
  return _apps.filter(a => hostGroupIds.has(a.groupId)).sort(byNewest)
}

export function createApplication({ groupId, groupName, serviceId, serviceName, planName, hostId, hostName, hostAvatarInitial, hostAvatarColor, message }) {
  const activeUser = getActiveUserProfile()
  if (!activeUser) throw new Error('登入後才能申請加入群組')

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
    createdAt:              nowISO(),
    updatedAt:              nowISO(),
  })
  _apps.push(app)
  insertApplication(app).catch(console.error)
  createNotification({
    userId:  app.applicantId,
    type:    'application_sent',
    title:   '申請已送出',
    message: `你的加入申請已送達「${app.groupName ?? app.serviceName}」團主，等待審核。`,
    meta:    { groupId: app.groupId },
  })
  emitApplicationsChanged({ type: 'created', application: app })
  return app
}

// 冷啟動補通知：在 initApplications + initNotifications 都完成後呼叫，
// 補上在 app 未開啟期間已變更的申請狀態通知（避免冷啟動遺漏）
export function checkMissedApplicationNotifications() {
  const currentUser = getActiveUserProfile()
  if (!currentUser) return
  const existingNotifAppIds = new Set(
    getNotifications(currentUser.id)
      .filter(n => n.type === 'application_approved' || n.type === 'application_rejected')
      .map(n => n.meta?.applicationId)
      .filter(Boolean)
  )
  _apps.forEach(app => {
    const applicantId = app.applicantId ?? app.userId
    if (applicantId !== currentUser.id) return
    if (existingNotifAppIds.has(app.id)) return
    if (app.status === 'approved') {
      createNotification({
        userId:  currentUser.id,
        type:    'application_approved',
        title:   '申請已通過',
        message: `你申請加入的「${app.groupName ?? app.serviceName}」群組已通過審核，歡迎加入！`,
        meta:    { applicationId: app.id, groupId: app.groupId },
      })
    } else if (app.status === 'rejected') {
      createNotification({
        userId:  currentUser.id,
        type:    'application_rejected',
        title:   '申請未通過',
        message: `很抱歉，你申請加入的「${app.groupName ?? app.serviceName}」群組申請未通過。`,
        meta:    { applicationId: app.id },
      })
    }
  })
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
