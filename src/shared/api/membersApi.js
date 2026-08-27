// Data access layer — Members
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'members' collection.
//
//   readAllMembers()     →  getDocs(collection(db, 'members'))
//   insertMember()       →  setDoc(doc(db, 'members', record.id), record)
//   patchMember()        →  updateDoc(doc(db, 'members', id), patch)
//   deleteMemberRecord() →  deleteDoc(doc(db, 'members', id))
//
// The HOST_MEMBERS array in applications.mock.js becomes the Firestore initial seed data.

import { HOST_MEMBERS } from '../data/applications.mock'
import { readStorageArray, readStorageObject, writeStorage } from '../utils/storage'
import { todayISO } from '../utils/date'

const CREATED_KEY   = 'pm_members'
const REMOVED_KEY   = 'pm_removed_members'
const OVERRIDES_KEY = 'pm_member_overrides'

function loadCreated()        { return readStorageArray(CREATED_KEY) }
function saveCreated(members) { writeStorage(CREATED_KEY, members) }
function loadRemoved()        { return new Set(readStorageArray(REMOVED_KEY)) }
function loadOverrides()      { return readStorageObject(OVERRIDES_KEY) }
function saveOverrides(obj)   { writeStorage(OVERRIDES_KEY, obj) }

export function readAllMembers() {
  const removed   = loadRemoved()
  const overrides = loadOverrides()
  return [...HOST_MEMBERS, ...loadCreated()]
    .filter(m => !removed.has(m.id))
    .map(m => overrides[m.id] ? { ...m, ...overrides[m.id] } : m)
}

export function insertMember(record) {
  const created = loadCreated()
  created.push(record)
  saveCreated(created)
  return record
}

export function patchMember(id, patch) {
  const stamped = { ...patch, updatedAt: todayISO() }
  const created = loadCreated()
  const idx     = created.findIndex(m => m.id === id)
  if (idx !== -1) {
    created[idx] = { ...created[idx], ...stamped }
    saveCreated(created)
    return created[idx]
  }
  const overrides = loadOverrides()
  overrides[id]   = { ...(overrides[id] ?? {}), ...stamped }
  saveOverrides(overrides)
  const mock = HOST_MEMBERS.find(m => m.id === id)
  return mock ? { ...mock, ...overrides[id] } : null
}

export function deleteMemberRecord(id) {
  const created = loadCreated()
  const idx     = created.findIndex(m => m.id === id)
  if (idx !== -1) {
    created.splice(idx, 1)
    saveCreated(created)
    return
  }
  writeStorage(REMOVED_KEY, [...loadRemoved(), id])
}
