/**
 * Seed Firestore with the service catalog.
 *
 * Usage:
 *   node scripts/seedServices.mjs
 *
 * Safe to re-run — uses setDoc with merge:true so existing price edits
 * in Firestore are preserved unless the field is explicitly in this file.
 * To force-overwrite all prices, pass --force:
 *   node scripts/seedServices.mjs --force
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env ──────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
readFileSync(resolve(__dir, '../.env'), 'utf8')
  .split('\n')
  .forEach(line => {
    const eq = line.indexOf('=')
    if (eq === -1 || line.trimStart().startsWith('#')) return
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = val
  })

// ── Firebase ───────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc } from 'firebase/firestore'

const firebaseApp = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(firebaseApp)

// ── Service catalog ────────────────────────────────────────────────
import { SERVICES } from '../src/shared/data/services.mock.js'

const force = process.argv.includes('--force')

const batch = writeBatch(db)
SERVICES.forEach((service, index) => {
  const { id, ...data } = service
  // sortOrder preserves the display order from services.mock.js
  batch.set(doc(db, 'services', id), { ...data, sortOrder: index }, force ? undefined : { merge: true })
})

console.log(`📦  Writing ${SERVICES.length} services to Firestore${force ? ' (force overwrite)' : ' (merge)'}…`)
await batch.commit()
console.log('✅  Done.')
