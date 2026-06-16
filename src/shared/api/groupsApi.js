import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeGroup } from '../utils/modelNormalizers'
import { demoAwareCollection } from './demoCollection'

const COLLECTION = demoAwareCollection('groups')

export async function readAllGroups() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => normalizeGroup({ id: d.id, ...d.data() }))
}

export async function insertGroup(record) {
  await setDoc(doc(db, COLLECTION, record.id), record)
  return normalizeGroup(record)
}

export async function patchGroup(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
