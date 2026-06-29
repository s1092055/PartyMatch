import { create } from 'zustand'
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
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  const existing = snap.exists() ? snap.data() : {}
  await setDoc(ref, {
    name:        firebaseUser.displayName?.trim() || '使用者',
    email:       firebaseUser.email,
    avatarUrl:   firebaseUser.photoURL ?? null,
    avatarColor: existing.avatarColor ?? null,
    joinedAt:    existing.joinedAt    ?? todayISO(),
    role:        existing.role        ?? 'user',
    creditScore: existing.creditScore ?? 80,
    isVerified:  existing.isVerified  ?? false,
    phone:       existing.phone       ?? '',
    bio:         existing.bio         ?? '',
    lineId:      existing.lineId      ?? '',
  })
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

function activeProfile(user) {
  if (!user) return null
  const displayName = user.displayName?.trim() || user.name?.trim() || '使用者'
  return {
    ...user,
    displayName,
    avatarInitial: displayName[0] ?? 'U',
    avatarColor:   user.avatarColor ?? '#3B82F6',
  }
}

export const useAuthStore = create((set, get) => ({
  user:     null,
  loggedIn: false,

  // ── 初始化（App 啟動時等待 Firebase 還原登入狀態）─────────────────────────
  init: () => new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      unsubscribe()
      if (firebaseUser) {
        const user = await buildUserProfile(firebaseUser)
        set({ user, loggedIn: true })
      } else {
        set({ user: null, loggedIn: false })
      }
      resolve()
    })
  }),

  // ── 衍生資料：含 avatarInitial/avatarColor 的 active profile ────────────────
  getProfile: () => activeProfile(get().user),

  // ── 登入 ────────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = await buildUserProfile(result.user)
      set({ user, loggedIn: true })
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: mapAuthError(err.code) }
    }
  },

  loginGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await ensureUserProfile(result.user)
      const user = await buildUserProfile(result.user)
      set({ user, loggedIn: true })
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: mapAuthError(err.code) }
    }
  },

  // ── 註冊 ────────────────────────────────────────────────────────────────────
  register: async ({ name, email, password }) => {
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
      const user = { id: result.user.uid, ...profile, displayName: name }
      set({ user, loggedIn: true })
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: mapAuthError(err.code) }
    }
  },

  // ── 登出 ────────────────────────────────────────────────────────────────────
  logout: async () => {
    try { await signOut(auth) } catch { /* ignore network errors */ }
    set({ user: null, loggedIn: false })
  },

  // ── 忘記密碼 ────────────────────────────────────────────────────────────────
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase())
      return { ok: true }
    } catch (err) {
      return { ok: false, error: mapAuthError(err.code) }
    }
  },

  // ── 更新個人資料 ────────────────────────────────────────────────────────────
  updateProfile: async (patch) => {
    const user = get().user
    if (!user) return { ok: false, error: '請先登入' }

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
      await upsertUserProfile(user.id, storedPatch)
      const next = { ...user, ...normalizedPatch }
      set({ user: next })
      return { ok: true, user: next }
    } catch (err) {
      return { ok: false, error: mapAuthError(err.code) }
    }
  },

  // ── 調整信用分數 ────────────────────────────────────────────────────────────
  adjustCreditScore: async (userId, delta) => {
    const newScore = await patchUserCreditScore(userId, delta)
    const user = get().user
    if (newScore !== null && user?.id === userId) {
      set({ user: { ...user, creditScore: newScore } })
    }
    return newScore
  },
}))
