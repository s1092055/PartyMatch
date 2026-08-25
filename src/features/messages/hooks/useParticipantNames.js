import { useEffect, useState } from 'react'
import { getUserProfile } from '../../../common/api/usersApi'

export const userProfileCache = new Map();
const inFlightProfileFetches = new Set()

const PROFILE_CACHE_LIMIT = 500

function cacheProfile(pid, profile) {
  userProfileCache.set(pid, profile)
  while (userProfileCache.size > PROFILE_CACHE_LIMIT) {
    userProfileCache.delete(userProfileCache.keys().next().value)
  }
}

const GENERIC_NAMES = new Set(['使用者', '成員', '新成員', '申請者', '匿名', '未知使用者'])

function usableName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  return trimmed && !GENERIC_NAMES.has(trimmed) ? trimmed : null
}

function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts.toDate === 'function') return ts.toDate().getTime()
  return new Date(ts).getTime()
}

export function useParticipantNames({ selected, selectedId, memberMap, hostId, group, userId, otherIds }) {
  const [, setProfileResolveTick] = useState(0);

  function isHostParticipant(pid, name) {
    return pid === hostId || (!!group?.hostName && name === group.hostName)
  }

  function withHostLabel(pid, name) {
    if (!isHostParticipant(pid, name)) return name
    return name.includes('（團主）') ? name : `${name}（團主）`
  }

  function knownName(pid, fallbackName) {
    const meta = selected?.participantMeta?.[pid]
    const member = memberMap[pid]
    return (
      usableName(member?.userName) ??
      usableName(meta?.name) ??
      (pid === hostId ? usableName(group?.hostName) : null) ??
      usableName(fallbackName)
    )
  }

  function getParticipantName(pid, fallbackName = null) {
    const name = knownName(pid, fallbackName) ?? usableName(userProfileCache.get(pid)?.name) ?? '成員'
    return withHostLabel(pid, name)
  }

  function getMessageSenderName(msg) {
    return getParticipantName(msg.senderId, msg.senderName)
  }

  function getReadReceiptNames(msg) {
    if (msg.senderId !== userId) return []
    const msgTime = toMillis(msg.createdAt)
    return otherIds
      .filter(pid => {
        const readAt = toMillis(selected?.lastReadAt?.[pid])
        return readAt > 0 && readAt >= msgTime
      })
      .map(pid => getParticipantName(pid));
  }

  const unresolvedIds = (selected?.participants ?? [])
    .filter(pid => !userProfileCache.has(pid) && !knownName(pid));
  const unresolvedKey = unresolvedIds.join(',')

  useEffect(() => {
    if (!unresolvedKey) return
    unresolvedIds.forEach(pid => {
      if (inFlightProfileFetches.has(pid)) return
      inFlightProfileFetches.add(pid)
      getUserProfile(pid)
        .then(profile => {
          cacheProfile(pid, profile)
        })
        .catch(err => { console.error('[ChatWindow] getUserProfile failed:', err); cacheProfile(pid, null) })
        .finally(() => {
          inFlightProfileFetches.delete(pid)
          setProfileResolveTick(t => t + 1)
        })
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unresolvedKey, selectedId])

  return { getParticipantName, getMessageSenderName, getReadReceiptNames }
}
