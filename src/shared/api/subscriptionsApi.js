import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeSubscription } from '../utils/modelNormalizers'

export async function readAllSubscriptions() {
  const snapshot = await getDocs(collection(db, 'subscriptions'))
  return snapshot.docs.map(d => normalizeSubscription({ id: d.id, ...d.data() }))
}

export async function insertSubscription(record) {
  await setDoc(doc(db, 'subscriptions', record.id), record)
  return normalizeSubscription(record)
}

export async function patchSubscription(id, patch) {
  await updateDoc(doc(db, 'subscriptions', id), patch)
}
