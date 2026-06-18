import { db } from '../../app/firebase'
import { collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { demoAwareCollection } from './demoCollection'
import { stripUndefined } from './firestoreUtils'

const COLLECTION = demoAwareCollection('notifications')

export async function readAllNotifications() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function subscribeToUserNotifications(userId, onUpdate) {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId))
  return onSnapshot(
    q,
    snapshot => onUpdate(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('[notificationsApi] subscribe error:', err),
  )
}

export async function insertNotification(record) {
  await setDoc(doc(db, COLLECTION, record.id), stripUndefined(record))
  return record
}

export async function patchNotification(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
