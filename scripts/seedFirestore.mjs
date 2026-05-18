/**
 * Seed Firestore with mock data from src/shared/data/
 *
 * Usage:
 *   node scripts/seedFirestore.mjs
 *
 * Reads credentials from .env in the project root.
 * Safe to run multiple times — uses setDoc (upsert), not addDoc.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env ──────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env')

try {
  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eq = trimmed.indexOf('=')
      if (eq === -1) return
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = val
    })
  console.log('✓ .env loaded')
} catch {
  console.error('✗ Could not read .env — make sure it exists in the project root')
  process.exit(1)
}

// ── Validate env ───────────────────────────────────────────────────
const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]
const missing = REQUIRED.filter(k => !process.env[k])
if (missing.length) {
  console.error(`✗ Missing env vars:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

// ── Firebase ───────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, collection } from 'firebase/firestore'

const app = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

// ── Mock data ──────────────────────────────────────────────────────
import { GROUPS }                    from '../src/shared/data/groups.mock.js'
import { APPLICATIONS, HOST_MEMBERS } from '../src/shared/data/applications.mock.js'
import { SUBSCRIPTIONS, PAYMENT_RECORDS } from '../src/shared/data/subscriptions.mock.js'

// ── Seed helper ────────────────────────────────────────────────────
// writeBatch limit is 500 ops; chunk to be safe
async function seedCollection(name, records) {
  const CHUNK = 400
  let total = 0
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK)
    const batch = writeBatch(db)
    chunk.forEach(record => {
      batch.set(doc(collection(db, name), record.id), { ...record, _demo: true })
    })
    await batch.commit()
    total += chunk.length
  }
  console.log(`  ✓ ${name.padEnd(14)} ${total} records`)
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding → ${process.env.VITE_FIREBASE_PROJECT_ID}\n`)

  await seedCollection('groups',        GROUPS)
  await seedCollection('applications',  APPLICATIONS)
  await seedCollection('subscriptions', SUBSCRIPTIONS)
  await seedCollection('members',       HOST_MEMBERS)
  await seedCollection('paymentRecords', PAYMENT_RECORDS)

  console.log('\nAll done. Open Firebase Console to verify.')
  process.exit(0)
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message ?? err)
  process.exit(1)
})
