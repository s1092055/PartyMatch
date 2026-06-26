import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore'

export async function readAllServices() {
  const snapshot = await getDocs(collection(db, 'services'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function upsertService(service) {
  const { id, ...data } = service
  await setDoc(doc(db, 'services', id), data, { merge: true })
}

export async function upsertServicesBatch(services) {
  const batch = writeBatch(db)
  for (const service of services) {
    const { id, ...data } = service
    batch.set(doc(db, 'services', id), data, { merge: true })
  }
  await batch.commit()
}
