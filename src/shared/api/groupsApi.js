import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeGroup } from '../utils/modelNormalizers'

export async function readAllGroups() {
  const snapshot = await getDocs(collection(db, 'groups'))
  return snapshot.docs.map(d => normalizeGroup({ id: d.id, ...d.data() }))
}

export async function insertGroup(record) {
  await setDoc(doc(db, 'groups', record.id), record)
  return normalizeGroup(record)
}

export async function patchGroup(id, patch) {
  await updateDoc(doc(db, 'groups', id), patch)
}
