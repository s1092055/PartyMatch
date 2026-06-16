/**
 * Remove all demo data from Firestore by wiping the separate `demo_*` collections.
 *
 * Usage:
 *   node scripts/clearDemo.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore'

const firebaseApp = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(firebaseApp)

const COLLECTIONS = [
  'demo_groups', 'demo_members', 'demo_applications',
  'demo_subscriptions', 'demo_notifications', 'demo_favorites', 'demo_paymentRecords',
]

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name))
  if (snap.empty) { console.log(`  – ${name.padEnd(20)} 0 筆`); return }

  const CHUNK = 400
  const docs = snap.docs
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db)
    docs.slice(i, i + CHUNK).forEach(d => batch.delete(doc(db, name, d.id)))
    await batch.commit()
  }
  console.log(`  ✓ ${name.padEnd(20)} 刪除 ${docs.length} 筆`)
}

async function main() {
  console.log(`\nClearing demo data from ${process.env.VITE_FIREBASE_PROJECT_ID}\n`)
  for (const col of COLLECTIONS) await clearCollection(col)
  console.log('\nDone.')
  process.exit(0)
}

main().catch(err => {
  console.error('\n✗ Clear failed:', err.message ?? err)
  process.exit(1)
})
