import { readAllMembers, insertMember, patchMember, deleteMemberRecord } from '../api/membersApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUser } from './userStore'

export function getMembers() {
  return readAllMembers()
}

export function updateMember(memberId, patch) {
  return patchMember(memberId, patch)
}

export function removeMember(memberId) {
  deleteMemberRecord(memberId)
}

export function getMembersByGroupId(groupId) {
  return readAllMembers().filter(m => m.groupId === groupId)
}

export function getMemberByUserAndGroup(userId, groupId) {
  return readAllMembers().find(m => m.userId === userId && m.groupId === groupId) ?? null
}

export function isUserGroupMember(userId, groupId) {
  return readAllMembers().some(m => m.userId === userId && m.groupId === groupId)
}

export function createMember({ groupId, groupName, userId, userName, userAvatarInitial, userAvatarColor }) {
  return insertMember({
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
  })
}

export function isCurrentUserMember(groupId) {
  const user = getActiveUser()
  return user ? isUserGroupMember(user.id, groupId) : false
}
