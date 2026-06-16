import { readAllMembers, insertMember, patchMember, deleteMemberRecord } from '../api/membersApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getCurrentUser } from './authStore'

let _members = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export async function initMembers() {
  const all = await readAllMembers()
  _members = DEMO_MODE ? all : all.filter(m => !m._demo)
}

export function getMembersByGroupId(groupId) {
  return _members.filter(m => m.groupId === groupId)
}

export function getMemberByUserAndGroup(userId, groupId) {
  return _members.find(m => m.userId === userId && m.groupId === groupId) ?? null
}

export function isUserGroupMember(userId, groupId) {
  return _members.some(m => m.userId === userId && m.groupId === groupId)
}

export function createMember({ groupId, groupName, userId, userName, userAvatarInitial, userAvatarColor }) {
  const member = {
    id:               createId('mem'),
    groupId,
    groupName,
    userId,
    userName,
    userAvatarInitial,
    userAvatarColor,
    role:             'member',
    joinedAt:         todayISO(),
    paymentStatus:    'pending',
    lastPaidAt:       null,
  }
  _members.push(member)
  insertMember(member).catch(console.error)
  return member
}

export function updateMember(memberId, patch) {
  _members = _members.map(m => m.id === memberId ? { ...m, ...patch } : m)
  patchMember(memberId, patch).catch(console.error)
}

export function removeMember(memberId) {
  _members = _members.filter(m => m.id !== memberId)
  deleteMemberRecord(memberId).catch(console.error)
}

export function resetMemberPaymentsForGroup(groupId) {
  const patch = { paymentStatus: 'pending' }
  const targets = _members.filter(m => m.groupId === groupId)
  _members = _members.map(m => m.groupId === groupId ? { ...m, ...patch } : m)
  targets.forEach(m => patchMember(m.id, patch).catch(console.error))
}

export function isCurrentUserMember(groupId) {
  const user = getCurrentUser()
  return user ? isUserGroupMember(user.id, groupId) : false
}
