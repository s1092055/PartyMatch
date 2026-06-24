/**
 * Clear ALL production data from Firestore (non-demo collections).
 * Auth accounts are NOT affected — only Firestore documents.
 *
 * Usage:
 *   node scripts/clearProd.mjs
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

import { execSync } from 'child_process'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseApp = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})
const db   = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)

const FLAT_COLLECTIONS = [
  'groups', 'members', 'applications',
  'subscriptions', 'paymentRecords', 'notifications', 'favorites',
]

const CHUNK = 400

async function deleteInBatches(docs, colPath) {
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db)
    docs.slice(i, i + CHUNK).forEach(d => batch.delete(doc(db, colPath, d.id)))
    await batch.commit()
  }
}

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name))
  if (snap.empty) { console.log(`  – ${name.padEnd(20)} 0 筆`); return }
  await deleteInBatches(snap.docs, name)
  console.log(`  ✓ ${name.padEnd(20)} 刪除 ${snap.docs.length} 筆`)
}

async function clearConversations() {
  // 使用 Firebase CLI 刪除，繞過 Firestore 安全規則（client SDK 只能讀到自己參與的對話）
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID
  try {
    execSync(
      `firebase firestore:delete conversations --project=${projectId} --recursive --force`,
      { stdio: 'pipe' }
    )
    console.log(`  ✓ ${'conversations'.padEnd(20)} 已清空（含所有子集合）`)
  } catch {
    console.warn(`  ⚠ conversations 清除失敗，請手動至 Firebase Console 刪除`)
  }
}

async function main() {
  const email    = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log(`  ✓ 已登入 ${email}`)
    } catch (e) {
      console.warn(`  ⚠ 登入失敗（${e.message}），以未登入模式繼續`)
    }
  }

  console.log(`\n⚠️  清除 ${process.env.VITE_FIREBASE_PROJECT_ID} 的所有正式資料\n`)
  for (const col of FLAT_COLLECTIONS) await clearCollection(col)
  await clearConversations()
  console.log('\n✓ 完成，Auth 帳號未受影響。')
  process.exit(0)
}

main().catch(err => {
  console.error('\n✗ 清除失敗:', err.message ?? err)
  process.exit(1)
})
