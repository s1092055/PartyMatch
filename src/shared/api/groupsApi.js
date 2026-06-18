import { db } from '../../app/firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeGroup } from '../utils/modelNormalizers'
import { demoAwareCollection } from './demoCollection'
import { stripUndefined } from './firestoreUtils'

const COLLECTION = demoAwareCollection('groups')

export async function readAllGroups() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => normalizeGroup({ id: d.id, ...d.data() }))
}

export function subscribeToGroups(onUpdate) {
  return onSnapshot(
    collection(db, COLLECTION),
    snapshot => onUpdate(snapshot.docs.map(d => normalizeGroup({ id: d.id, ...d.data() }))),
    err => console.error('[groupsApi] subscribe error:', err),
  )
}

export async function insertGroup(record) {
  await setDoc(doc(db, COLLECTION, record.id), stripUndefined(record))
  return normalizeGroup(record)
}

export async function patchGroup(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
