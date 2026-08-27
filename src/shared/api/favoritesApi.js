// Data access layer — Favorites
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'favorites' collection.
//
//   readAllFavorites()     →  getDocs(collection(db, 'favorites'))
//   insertFavorite()       →  setDoc(doc(db, 'favorites', record.id), record)
//   deleteFavoriteRecord() →  deleteDoc(doc(db, 'favorites', existingDocId))

import { readStorageArray, writeStorage } from '../utils/storage'

const KEY = 'pm_favorites'

function load()     { return readStorageArray(KEY) }
function save(favs) { writeStorage(KEY, favs) }

export function readAllFavorites() {
  return load()
}

export function insertFavorite(record) {
  const favs = load()
  favs.push(record)
  save(favs)
  return record
}

export function deleteFavoriteRecord(userId, groupId) {
  save(load().filter(f => !(f.userId === userId && f.groupId === groupId)))
}
