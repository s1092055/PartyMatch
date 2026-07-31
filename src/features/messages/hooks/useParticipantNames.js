import { useEffect, useState } from 'react'
import { getUserProfile } from '../../../common/api/usersApi'

// 名稱解析的最後備援：當 participantMeta 缺漏且使用者不在 memberStore 時，
// 呼叫 GET /users/:id 補全。模組層快取在對話間共用，避免重複查詢。
export const userProfileCache = new Map()
const inFlightProfileFetches = new Set()

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
  // 用來在 userProfileCache（模組層、非 React state）有新結果時強制重新 render
  const [, setProfileResolveTick] = useState(0)

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
    // 用「對方讀到的時間點」(lastReadAt) 逐則比對，而不是看 unreadCounts 是否為 0——
    // unreadCounts 是整個對話的未讀計數，送出新訊息會讓它變回非 0，
    // 若拿它來判斷單則訊息的已讀狀態，會讓先前已讀過的舊訊息也被誤判成未讀。
    return otherIds
      .filter(pid => {
        const readAt = toMillis(selected?.lastReadAt?.[pid])
        return readAt > 0 && readAt >= msgTime
      })
      .map(pid => getParticipantName(pid))
  }

  // 名稱解析鏈（member 記錄／participantMeta／團主名）都查不到時，呼叫 REST API 補全。
  const unresolvedIds = (selected?.participants ?? [])
    .filter(pid => !userProfileCache.has(pid) && !knownName(pid))
  const unresolvedKey = unresolvedIds.join(',')

  useEffect(() => {
    if (!unresolvedKey) return
    unresolvedIds.forEach(pid => {
      if (inFlightProfileFetches.has(pid)) return
      inFlightProfileFetches.add(pid)
      getUserProfile(pid)
        .then(profile => {
          userProfileCache.set(pid, profile)
        })
        .catch(err => { console.error('[ChatWindow] getUserProfile failed:', err); userProfileCache.set(pid, null) })
        .finally(() => {
          inFlightProfileFetches.delete(pid)
          setProfileResolveTick(t => t + 1)
        })
    })
    // unresolvedKey 已經是 unresolvedIds 的內容快照，刻意不放整個陣列/函式進 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unresolvedKey, selectedId])

  return { getParticipantName, getMessageSenderName, getReadReceiptNames }
}
