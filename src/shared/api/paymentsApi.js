import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'

export async function readAllPaymentRecords() {
  const snapshot = await getDocs(collection(db, 'paymentRecords'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertPaymentRecord(record) {
  await setDoc(doc(db, 'paymentRecords', record.id), record)
  return record
}
