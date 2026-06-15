import { db } from '../../app/firebase'
import {
  collection, doc, getDoc, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp, updateDoc, setDoc, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore'

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

export function subscribeToMessages(conversationId, onUpdate) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(
    q,
    snapshot => onUpdate(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('[messagesApi] subscribeToMessages error:', err),
  )
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
  const unreadIncrements = {}
  for (const uid of participants) {
    if (uid !== senderId) unreadIncrements[`unreadCounts.${uid}`] = increment(1)
  }
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    ...unreadIncrements,
  })
}

export async function markConversationRead(conversationId, userId) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCounts.${userId}`]: 0,
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

// 建立群組對話（群組建立/成員加入時呼叫）
export async function createGroupConversation({ groupId, groupName, serviceId, hostId, hostName, hostAvatarInitial, hostAvatarColor }) {
  const convId = `group_${groupId}`
  await setDoc(doc(db, 'conversations', convId), {
    type: 'group',
    groupId,
    name: groupName,
    serviceId: serviceId ?? null,
    avatarInitial: null,
    avatarColor: null,
    participants: [hostId],
    participantMeta: {
      [hostId]: { name: hostName, avatarInitial: hostAvatarInitial, avatarColor: hostAvatarColor },
    },
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadCounts: { [hostId]: 0 },
    createdAt: serverTimestamp(),
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
