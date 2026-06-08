import { db } from '../../app/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function readAllPaymentRecords() {
  const snapshot = await getDocs(collection(db, 'paymentRecords'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}
