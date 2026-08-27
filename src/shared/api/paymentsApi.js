// Data access layer — Payment Records
//
// Firebase migration: replace the localStorage operations below with
// Firestore queries against the 'paymentRecords' collection.
//
//   readAllPaymentRecords() →  getDocs(collection(db, 'paymentRecords'))
//   insertPaymentRecord()   →  addDoc(collection(db, 'paymentRecords'), record)
//
// The PAYMENT_RECORDS array in subscriptions.mock.js becomes the Firestore initial seed data.

import { PAYMENT_RECORDS } from '../data/subscriptions.mock'
import { readStorageArray, writeStorage } from '../utils/storage'

const KEY = 'pm_payment_records'

function loadNew()        { return readStorageArray(KEY) }
function saveNew(records) { writeStorage(KEY, records) }

export function readAllPaymentRecords() {
  return [...PAYMENT_RECORDS, ...loadNew()]
}

export function insertPaymentRecord(record) {
  const records = loadNew()
  records.push(record)
  saveNew(records)
  return record
}
