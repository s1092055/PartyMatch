import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { demoAwareCollection } from './demoCollection'
import { stripUndefined } from './firestoreUtils'

const COLLECTION = demoAwareCollection('paymentRecords')

export async function readAllPaymentRecords() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertPaymentRecord(record) {
  await setDoc(doc(db, COLLECTION, record.id), stripUndefined(record))
  return record
}
