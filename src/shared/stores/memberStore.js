import { readAllMembers, subscribeToMembers, insertMember, patchMember, deleteMemberRecord } from '../api/membersApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getCurrentUser } from './authStore'

let _members = []
let _unsub = null

export async function initMembers() {
  _members = await readAllMembers()
}

export function initLiveMembers() {
  teardownLiveMembers()
  _unsub = subscribeToMembers(members => {
    _members = members
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pm:members-changed'))
  })
}

export function teardownLiveMembers() {
  if (_unsub) { _unsub(); _unsub = null }
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

export function getMemberGroupIds(userId) {
  if (!userId) return new Set()
  return new Set(_members.filter(m => m.userId === userId).map(m => m.groupId))
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
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pm:members-changed'))
  return member
}

export function updateMember(memberId, patch) {
  _members = _members.map(m => m.id === memberId ? { ...m, ...patch } : m)
  patchMember(memberId, patch).catch(console.error)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pm:members-changed'))
}

export function removeMember(memberId) {
  _members = _members.filter(m => m.id !== memberId)
  deleteMemberRecord(memberId).catch(console.error)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pm:members-changed'))
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
