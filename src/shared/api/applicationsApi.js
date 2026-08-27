// Data access layer — Applications
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'applications' collection.
//
//   readAllApplications() →  getDocs(collection(db, 'applications'))
//   insertApplication()   →  setDoc(doc(db, 'applications', record.id), record)
//   patchApplication()    →  updateDoc(doc(db, 'applications', id), patch)
//
// The APPLICATIONS array in applications.mock.js becomes the Firestore initial seed data.

import { APPLICATIONS } from '../data/applications.mock'
import { normalizeApplication } from '../utils/modelNormalizers'
import { readStorageArray, readStorageObject, saveOverride, upsertStoredRecord, writeStorage } from '../utils/storage'
import { todayISO } from '../utils/date'

const CREATED_KEY   = 'pm_applications'
const OVERRIDES_KEY = 'pm_application_overrides'

function loadNew()     { return readStorageArray(CREATED_KEY) }
function saveNew(apps) { writeStorage(CREATED_KEY, apps) }

export function readAllApplications() {
  const overrides = readStorageObject(OVERRIDES_KEY)
  return [...APPLICATIONS, ...loadNew()].map(a =>
    normalizeApplication(overrides[a.id] ? { ...a, ...overrides[a.id] } : a)
  )
}

export function insertApplication(record) {
  const apps = loadNew()
  apps.push(record)
  saveNew(apps)
  return record
}

export function patchApplication(id, patch) {
  const stamped = { ...patch, updatedAt: todayISO() }
  const stored  = upsertStoredRecord(CREATED_KEY, id, stamped)
  if (stored) return normalizeApplication(stored)
  const mock = APPLICATIONS.find(a => a.id === id)
  if (!mock) return null
  const override = saveOverride(OVERRIDES_KEY, id, stamped)
  return normalizeApplication({ ...mock, ...override })
}
