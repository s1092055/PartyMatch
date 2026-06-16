import { db } from '../../app/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

function normalizeLegacyScore(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 80
  // Old 0–5 scale → multiply by 20 to get 0–100
  return n > 0 && n <= 5 ? Math.round(n * 20) : n
}

export async function patchUserCreditScore(userId, delta) {
  const ref  = doc(db, 'users', userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const current  = normalizeLegacyScore(snap.data().creditScore ?? 80)
  const newScore = Math.max(0, Math.min(100, Math.round(current + delta)))
  await updateDoc(ref, { creditScore: newScore })
  return newScore
}

export async function upsertUserProfile(userId, profile) {
  await setDoc(doc(db, 'users', userId), profile, { merge: true })
}

// 取單一使用者的公開顯示資料（姓名/頭像），用於對話/成員名單缺少快取資料時的最後備援查詢
export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    name:          data.name ?? null,
    avatarInitial: data.name?.[0] ?? null,
    avatarColor:   data.avatarColor ?? null,
  }
}
