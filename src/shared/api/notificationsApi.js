import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { demoAwareCollection } from './demoCollection'

const COLLECTION = demoAwareCollection('notifications')

export async function readAllNotifications() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertNotification(record) {
  await setDoc(doc(db, COLLECTION, record.id), record)
  return record
}

export async function patchNotification(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
