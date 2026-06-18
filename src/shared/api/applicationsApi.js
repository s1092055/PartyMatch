import { db } from '../../app/firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeApplication } from '../utils/modelNormalizers'
import { demoAwareCollection } from './demoCollection'
import { stripUndefined } from './firestoreUtils'

const COLLECTION = demoAwareCollection('applications')

export async function readAllApplications() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => normalizeApplication({ id: d.id, ...d.data() }))
}

export function subscribeToApplications(onUpdate) {
  return onSnapshot(
    collection(db, COLLECTION),
    snapshot => onUpdate(snapshot.docs.map(d => normalizeApplication({ id: d.id, ...d.data() }))),
    err => console.error('[applicationsApi] subscribe error:', err),
  )
}

export async function insertApplication(record) {
  await setDoc(doc(db, COLLECTION, record.id), stripUndefined(record))
  return normalizeApplication(record)
}

export async function patchApplication(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
