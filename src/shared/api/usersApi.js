import { db } from '../../app/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export async function patchUserCreditScore(userId, delta) {
  const ref  = doc(db, 'users', userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const current  = snap.data().creditScore ?? 80
  const newScore = Math.max(0, Math.min(100, Math.round(current + delta)))
  await updateDoc(ref, { creditScore: newScore })
  return newScore
}
