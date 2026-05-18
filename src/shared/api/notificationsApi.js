import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'

export async function readAllNotifications() {
  const snapshot = await getDocs(collection(db, 'notifications'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertNotification(record) {
  await setDoc(doc(db, 'notifications', record.id), record)
  return record
}

export async function patchNotification(id, patch) {
  await updateDoc(doc(db, 'notifications', id), patch)
}
