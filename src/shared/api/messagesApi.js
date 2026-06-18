import { db } from '../../app/firebase'
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter,
  onSnapshot, addDoc, serverTimestamp, updateDoc, setDoc, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore'

// 訊息分頁大小：即時監聽只訂閱「最新一頁」，往上捲動時再用一次性查詢載入更早的訊息，
// 避免長對話一次把整個 subcollection 拉下來。
export const MESSAGES_PAGE_SIZE = 30

const CONVERSATION_UPDATE_DELAY = 500
const pendingConversationUpdates = new Map()

function scheduleConversationUpdate(conversationId, { text, participants = [], senderId }) {
  const pending = pendingConversationUpdates.get(conversationId) ?? {
    latestText: '',
    unreadCounts: {},
    timer: null,
  }

  pending.latestText = text
  for (const uid of participants) {
    if (uid !== senderId) pending.unreadCounts[uid] = (pending.unreadCounts[uid] ?? 0) + 1
  }

  if (pending.timer) clearTimeout(pending.timer)
  pending.timer = setTimeout(() => flushConversationUpdate(conversationId), CONVERSATION_UPDATE_DELAY)
  pendingConversationUpdates.set(conversationId, pending)
}

async function flushConversationUpdate(conversationId) {
  const pending = pendingConversationUpdates.get(conversationId)
  if (!pending) return
  pendingConversationUpdates.delete(conversationId)

  const unreadIncrements = {}
  for (const [uid, count] of Object.entries(pending.unreadCounts)) {
    unreadIncrements[`unreadCounts.${uid}`] = increment(count)
  }

  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: pending.latestText,
      lastMessageAt: serverTimestamp(),
      ...unreadIncrements,
    })
  } catch (err) {
    console.error('[messagesApi] update conversation summary failed:', err)
  }
}

export function subscribeToConversations(userId, onUpdate) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
  )
  return onSnapshot(
    q,
    snapshot => onUpdate(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('[messagesApi] subscribeToConversations error:', err),
  )
}

// 即時監聽最新一頁訊息（最近 MESSAGES_PAGE_SIZE 筆），由新到舊查詢後反轉成時間升序回傳，
// 確保剛開啟對話時只拉最近這一段，而不是整個對話的歷史訊息。
export function subscribeToMessages(conversationId, onUpdate, onError) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(MESSAGES_PAGE_SIZE),
  )
  return onSnapshot(
    q,
    snapshot => onUpdate(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).reverse()),
    err => { console.error('[messagesApi] subscribeToMessages error:', err); onError?.() },
  )
}

// 載入「比目前最早一筆更早」的一頁訊息（一次性查詢，非即時監聽），用於使用者往上捲動時補載歷史訊息。
// oldestLoadedCreatedAt 是目前畫面上最舊一筆訊息的 createdAt（Firestore Timestamp）。
export async function fetchOlderMessages(conversationId, oldestLoadedCreatedAt, pageSize = MESSAGES_PAGE_SIZE) {
  if (!oldestLoadedCreatedAt) return { messages: [], hasMore: false }
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'desc'),
    startAfter(oldestLoadedCreatedAt),
    limit(pageSize),
  )
  const snapshot = await getDocs(q)
  return {
    messages: snapshot.docs.map(d => ({ id: d.id, ...d.data() })).reverse(),
    hasMore: snapshot.docs.length === pageSize,
  }
}

export async function sendMessage(conversationId, senderId, { senderName, avatarInitial, avatarColor, text, participants = [] }) {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    senderName,
    avatarInitial,
    avatarColor,
    text,
    type: 'message',
    createdAt: serverTimestamp(),
  })
  scheduleConversationUpdate(conversationId, { text, participants, senderId })
}

export async function markConversationRead(conversationId, userId) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCounts.${userId}`]: 0,
    // lastReadAt：記錄「讀到哪個時間點」，已讀回條要逐則訊息比對時間，
    // 不能只看 unreadCounts 是否為 0——那是整個對話的未讀數，送出新訊息會讓它變回非 0，
    // 連帶把先前已經被讀過的舊訊息也判定成「未讀」。
    [`lastReadAt.${userId}`]: serverTimestamp(),
  })
}

// 建立或取得與特定使用者的私聊對話
export async function getOrCreateDmConversation(userId, userMeta, hostId, hostMeta) {
  const convId = `dm_${[userId, hostId].sort().join('_')}`
  const ref = doc(db, 'conversations', convId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      type: 'dm',
      serviceId: null,
      participants: [userId, hostId],
      participantMeta: {
        [userId]: userMeta,
        [hostId]: hostMeta,
      },
      unreadCounts: { [userId]: 0, [hostId]: 0 },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
  }
  return convId
}

// 建立群組對話（群組建立時呼叫一次）
// 用 arrayUnion／setDoc+merge，確保即使重複呼叫也不會覆蓋已加入的其他成員或最新訊息
export async function createGroupConversation({ groupId, groupName, serviceId, hostId, hostName, hostAvatarInitial, hostAvatarColor }) {
  const convId = `group_${groupId}`
  const snap = await getDoc(doc(db, 'conversations', convId))
  await setDoc(doc(db, 'conversations', convId), {
    type: 'group',
    groupId,
    name: groupName,
    serviceId: serviceId ?? null,
    avatarInitial: null,
    avatarColor: null,
    participants: arrayUnion(hostId),
    participantMeta: {
      [hostId]: { name: hostName, avatarInitial: hostAvatarInitial, avatarColor: hostAvatarColor },
    },
    [`unreadCounts.${hostId}`]: 0,
    ...(snap.exists() ? {} : { lastMessage: '', lastMessageAt: serverTimestamp(), createdAt: serverTimestamp() }),
  }, { merge: true })
  return convId
}

// 新成員加入群組對話（申請通過時呼叫）
// 用 setDoc + merge 確保對話文件不存在時也不會出錯
export async function addParticipantToConversation(conversationId, userId, { name, avatarInitial, avatarColor }) {
  await setDoc(doc(db, 'conversations', conversationId), {
    participants: arrayUnion(userId),
    [`participantMeta.${userId}`]: { name, avatarInitial, avatarColor },
    [`unreadCounts.${userId}`]: 0,
  }, { merge: true })
}

export async function leaveConversation(conversationId, userId) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    participants: arrayRemove(userId),
  })
}

// 傳送系統訊息（成員加入、狀態變更等）
export async function sendSystemMessage(conversationId, text) {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    type: 'system',
    text,
    createdAt: serverTimestamp(),
  })
}

// 傳送行動訊息（需要互動或僅特定成員可見）
export async function sendActionMessage(conversationId, { text, actionType, payload = {}, visibleTo = null }) {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    type: 'action',
    actionType,
    text,
    payload,
    ...(visibleTo ? { visibleTo } : {}),
    createdAt: serverTimestamp(),
  })
}
