// Data access layer — Subscriptions
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'subscriptions' collection.
//
//   readAllSubscriptions() →  getDocs(collection(db, 'subscriptions'))
//   insertSubscription()   →  setDoc(doc(db, 'subscriptions', record.id), record)
//   patchSubscription()    →  updateDoc(doc(db, 'subscriptions', id), patch)
//
// The SUBSCRIPTIONS array in subscriptions.mock.js becomes the Firestore initial seed data.

import { SUBSCRIPTIONS } from '../data/subscriptions.mock'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { readStorageArray, readStorageObject, saveOverride, upsertStoredRecord, writeStorage } from '../utils/storage'
import { todayISO } from '../utils/date'

const CREATED_KEY   = 'pm_subscriptions'
const OVERRIDES_KEY = 'pm_subscription_overrides'

function loadNew()     { return readStorageArray(CREATED_KEY) }
function saveNew(subs) { writeStorage(CREATED_KEY, subs) }

export function readAllSubscriptions() {
  const overrides = readStorageObject(OVERRIDES_KEY)
  return [...SUBSCRIPTIONS, ...loadNew()].map(s =>
    normalizeSubscription(overrides[s.id] ? { ...s, ...overrides[s.id] } : s)
  )
}

export function insertSubscription(record) {
  const normalized = normalizeSubscription(record)
  const subs = loadNew()
  subs.push(normalized)
  saveNew(subs)
  return normalized
}

export function patchSubscription(id, patch) {
  const stamped  = { ...patch, updatedAt: todayISO() }
  const stored   = upsertStoredRecord(CREATED_KEY, id, stamped)
  if (stored) return normalizeSubscription(stored)
  const override = saveOverride(OVERRIDES_KEY, id, stamped)
  const mock     = SUBSCRIPTIONS.find(s => s.id === id)
  return mock ? normalizeSubscription({ ...mock, ...override }) : null
}
