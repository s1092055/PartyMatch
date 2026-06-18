import { db } from '../../app/firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { demoAwareCollection } from './demoCollection'
import { stripUndefined } from './firestoreUtils'

const COLLECTION = demoAwareCollection('subscriptions')

export async function readAllSubscriptions() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => normalizeSubscription({ id: d.id, ...d.data() }))
}

export function subscribeToSubscriptions(onUpdate) {
  return onSnapshot(
    collection(db, COLLECTION),
    snapshot => onUpdate(snapshot.docs.map(d => normalizeSubscription({ id: d.id, ...d.data() }))),
    err => console.error('[subscriptionsApi] subscribe error:', err),
  )
}

export async function insertSubscription(record) {
  await setDoc(doc(db, COLLECTION, record.id), stripUndefined(record))
  return normalizeSubscription(record)
}

export async function patchSubscription(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
