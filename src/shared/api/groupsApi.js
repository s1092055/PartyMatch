// Data access layer — Groups
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'groups' collection.
//
//   readAllGroups()  →  getDocs(collection(db, 'groups'))
//   insertGroup()    →  setDoc(doc(db, 'groups', record.id), record)
//   patchGroup()     →  updateDoc(doc(db, 'groups', id), patch)
//
// The GROUPS array in groups.mock.js becomes the Firestore initial seed data.

import { GROUPS } from '../data/groups.mock'
import { normalizeGroup } from '../utils/modelNormalizers'
import { readStorageArray, readStorageObject, saveOverride, upsertStoredRecord, writeStorage } from '../utils/storage'
import { todayISO } from '../utils/date'

const CREATED_KEY   = 'pm_created_groups'
const OVERRIDES_KEY = 'pm_group_overrides'

function loadCreated()       { return readStorageArray(CREATED_KEY) }
function saveCreated(groups) { writeStorage(CREATED_KEY, groups) }

export function readAllGroups() {
  const overrides = readStorageObject(OVERRIDES_KEY)
  return [...GROUPS, ...loadCreated()].map(g =>
    normalizeGroup(overrides[g.id] ? { ...g, ...overrides[g.id] } : g)
  )
}

export function insertGroup(record) {
  const created = loadCreated()
  created.push(record)
  saveCreated(created)
  return normalizeGroup(record)
}

export function patchGroup(id, patch) {
  const stamped = { ...patch, updatedAt: todayISO() }
  const stored  = upsertStoredRecord(CREATED_KEY, id, stamped)
  if (stored) return normalizeGroup(stored)
  const mock = GROUPS.find(g => g.id === id)
  if (!mock) return null
  const override = saveOverride(OVERRIDES_KEY, id, stamped)
  return normalizeGroup({ ...mock, ...override })
}
