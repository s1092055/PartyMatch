import { db } from '../../app/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { demoAwareCollection } from './demoCollection'

const COLLECTION = demoAwareCollection('paymentRecords')

export async function readAllPaymentRecords() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}
