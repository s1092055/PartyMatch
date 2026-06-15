import { auth, db } from '../../app/firebase'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { patchUserCreditScore, upsertUserProfile } from '../api/usersApi'
import { todayISO } from '../utils/date'

let _currentUser = null

function normalizeCreditScore(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 80
  return n > 0 && n <= 5 ? Math.round(n * 20) : n
}

async function buildUserProfile(firebaseUser) {
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
  const stored = snap.exists() ? snap.data() : {}
  const name = stored.name?.trim() || firebaseUser.displayName?.trim() || '使用者'
  return {
    id:          firebaseUser.uid,
    email:       stored.email ?? firebaseUser.email,
    name,
    displayName: name,
    avatarUrl:   stored.avatarUrl  ?? null,
    avatarColor: stored.avatarColor ?? null,
    joinedAt:    stored.joinedAt   ?? todayISO(),
    role:        stored.role       ?? 'user',
    creditScore: normalizeCreditScore(stored.creditScore ?? 80),
    isVerified:  stored.isVerified  ?? false,
    phone:       stored.phone ?? '',
    bio:         stored.bio ?? '',
    lineId:      stored.lineId ?? '',
  }
}

async function ensureUserProfile(firebaseUser) {
  const profile = {
    name:        firebaseUser.displayName?.trim() || '使用者',
    email:       firebaseUser.email,
    avatarUrl:   firebaseUser.photoURL ?? null,
    avatarColor: null,
    joinedAt:    todayISO(),
    role:        'user',
    creditScore: 80,
    isVerified:  false,
    phone:       '',
    bio:         '',
    lineId:      '',
  }
  await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true })
}

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

export function isAuthenticated() { return !!_currentUser }
export function getCurrentUser()  { return _currentUser }

export function getActiveUserProfile() {
  if (!_currentUser) return null
  const displayName = _currentUser.displayName?.trim() || _currentUser.name?.trim() || '使用者'
  return {
    ..._currentUser,
    displayName,
    avatarInitial: displayName[0] ?? 'U',
    avatarColor:   _currentUser.avatarColor ?? '#3B82F6',
  }
}

export async function loginUser({ email, password }) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    _currentUser = await buildUserProfile(result.user)
    return { ok: true, user: _currentUser }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    await ensureUserProfile(result.user)
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
      creditScore: 80,
      isVerified:  false,
      phone:       '',
      bio:         '',
      lineId:      '',
    }
    await setDoc(doc(db, 'users', result.user.uid), profile)

    _currentUser = { id: result.user.uid, ...profile, displayName: name }
    return { ok: true, user: _currentUser }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

export async function logoutUser() {
  try { await signOut(auth) } catch { /* ignore network errors */ }
  _currentUser = null
}

export async function adjustCreditScore(userId, delta) {
  const newScore = await patchUserCreditScore(userId, delta)
  if (newScore !== null && _currentUser?.id === userId) {
    _currentUser = { ..._currentUser, creditScore: newScore }
  }
  return newScore
}

export async function updateCurrentUserProfile(patch) {
  if (!_currentUser) return { ok: false, error: '請先登入' }

  const nextName = (patch.displayName ?? patch.name)?.trim() || null
  const normalizedPatch = {
    ...patch,
    ...(nextName ? { name: nextName, displayName: nextName } : {}),
  }

  try {
    if (nextName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: nextName })
    }
    const storedPatch = { ...normalizedPatch }
    delete storedPatch.id
    delete storedPatch.displayName
    if (!storedPatch.name?.trim()) delete storedPatch.name
    await upsertUserProfile(_currentUser.id, storedPatch)
    _currentUser = { ..._currentUser, ...normalizedPatch }
    return { ok: true, user: _currentUser }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase())
    return { ok: true }
  } catch (err) {
    return { ok: false, error: mapAuthError(err.code) }
  }
}

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
    'auth/popup-closed-by-user':   '登入視窗已關閉，請再試一次',
    'auth/popup-blocked':          '瀏覽器封鎖了登入視窗，請允許彈出視窗後再試',
  }
  return map[code] ?? '發生錯誤，請稍後再試'
}
