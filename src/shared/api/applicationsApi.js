
import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { normalizeApplication } from '../utils/modelNormalizers'
import { demoAwareCollection } from './demoCollection'

const COLLECTION = demoAwareCollection('applications')

export async function readAllApplications() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => normalizeApplication({ id: d.id, ...d.data() }))
}

export async function insertApplication(record) {
  await setDoc(doc(db, COLLECTION, record.id), record)
  return normalizeApplication(record)
}

export async function patchApplication(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch)
}
