import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { demoAwareCollection } from './demoCollection'

const COLLECTION = demoAwareCollection('members')

export async function readAllMembers() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertMember(record) {
  await setDoc(doc(db, COLLECTION, record.id), record)
  return record
}

export async function patchMember(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}

export async function deleteMemberRecord(id) {
  await deleteDoc(doc(db, COLLECTION, id))
}
