import { auth, db } from '../../app/firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { todayISO } from '../utils/date'

// Module-level cache — populated by initAuth() on app startup
let _currentUser = null

async function buildUserProfile(firebaseUser) {
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
  const stored = snap.exists() ? snap.data() : {}
  return {
    id:          firebaseUser.uid,
    email:       firebaseUser.email,
    name:        stored.name ?? firebaseUser.displayName ?? '使用者',
    avatarUrl:   stored.avatarUrl  ?? null,
    avatarColor: stored.avatarColor ?? null,
    joinedAt:    stored.joinedAt   ?? todayISO(),
    role:        stored.role       ?? 'user',
    creditScore: stored.creditScore ?? 5.0,
    isVerified:  stored.isVerified  ?? false,
  }
}

// Called once in App.jsx before the router renders.
// Resolves after Firebase confirms the auth state (logged in or not).
export function initAuth() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      unsubscribe()
      if (firebaseUser) {
        _currentUser = await buildUserProfile(firebaseUser)
      } else {
        _currentUser = null
      }
      resolve()
    })
  })
}

// ── Sync reads (safe to call anywhere after initAuth resolves) ─────

export function isAuthenticated() { return !!_currentUser }
export function getCurrentUser()  { return _currentUser }

// ── Async writes ───────────────────────────────────────────────────

export async function loginUser({ email, password }) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    _currentUser = await buildUserProfile(result.user)
    return { ok: true, user: _currentUser }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

export async function registerUser({ name, email, password }) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })

    const profile = {
      name,
      email:       result.user.email,
      avatarUrl:   null,
      avatarColor: null,
      joinedAt:    todayISO(),
      role:        'user',
      creditScore: 5.0,
      isVerified:  false,
    }
    await setDoc(doc(db, 'users', result.user.uid), profile)

    _currentUser = { id: result.user.uid, ...profile }
    return { ok: true, user: _currentUser }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

export async function logoutUser() {
  await signOut(auth)
  _currentUser = null
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase())
    return { ok: true }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

// ── Error mapping ──────────────────────────────────────────────────

function mapAuthError(code) {
  const map = {
    'auth/user-not-found':        '找不到此電子郵件的帳號',
    'auth/wrong-password':        '密碼不正確',
    'auth/invalid-credential':    '帳號或密碼不正確',
    'auth/email-already-in-use':  '此電子郵件已被註冊，請改用登入',
    'auth/weak-password':         '密碼強度不足，請至少使用 6 個字元',
    'auth/invalid-email':         '請輸入有效的電子郵件格式',
    'auth/too-many-requests':     '登入嘗試次數過多，請稍後再試',
    'auth/network-request-failed':'網路連線失敗，請確認網路後再試',
  }
  return map[code] ?? '發生錯誤，請稍後再試'
}
