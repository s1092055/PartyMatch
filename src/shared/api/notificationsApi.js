// Data access layer — Notifications
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'notifications' collection.
//
//   readAllNotifications()  →  getDocs(query(collection(db, 'notifications'), where('userId', '==', userId)))
//   saveAllNotifications()  →  batch setDoc for seeding
//   insertNotification()    →  addDoc(collection(db, 'notifications'), record)
//   patchNotification()     →  updateDoc(doc(db, 'notifications', id), patch)
//   markAllRead()           →  batch updateDoc where userId matches

import { readStorage, writeStorage } from '../utils/storage'

const KEY = 'pm_notifications'

function load() {
  const value = readStorage(KEY, [])
  return Array.isArray(value) ? value : []
}

function save(notifications) {
  writeStorage(KEY, notifications)
}

export function readAllNotifications() {
  return load()
}

export function saveAllNotifications(notifications) {
  save(notifications)
}

export function insertNotification(record) {
  const all = load()
  all.unshift(record)
  save(all)
  return record
}

export function patchNotification(id, patch) {
  const all = load()
  const idx = all.findIndex(n => n.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...patch }
    save(all)
  }
}

export function markAllRead(userId) {
  save(load().map(n => n.userId === userId ? { ...n, isRead: true } : n))
}
