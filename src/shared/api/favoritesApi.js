import { db } from '../../app/firebase'
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import { demoAwareCollection } from './demoCollection'

const COLLECTION = demoAwareCollection('favorites')

export async function readAllFavorites() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function insertFavorite(record) {
  await setDoc(doc(db, COLLECTION, record.id), record)
  return record
}

export async function deleteFavoriteById(id) {
  await deleteDoc(doc(db, COLLECTION, id))
}
