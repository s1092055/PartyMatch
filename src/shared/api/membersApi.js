import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

export async function readAllMembers() {
  const snapshot = await getDocs(collection(db, 'members'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertMember(record) {
  await setDoc(doc(db, 'members', record.id), record)
  return record
}

export async function patchMember(id, patch) {
  await updateDoc(doc(db, 'members', id), patch)
}

export async function deleteMemberRecord(id) {
  await deleteDoc(doc(db, 'members', id))
}
