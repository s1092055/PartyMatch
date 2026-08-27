import { todayISO } from '../utils/date'
import { createId, readStorageArray, readStorageObject, removeStorage, writeStorage } from '../utils/storage'

const AUTH_USER_KEY = 'pm_auth_user'
const REGISTERED_USERS_KEY = 'pm_registered_users'

// MVP mock auth only. Production should replace this whole store with
// Firebase Auth or a backend-managed auth/session flow; passwords are not
// encrypted here because localStorage is only used for the demo prototype.

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function sanitizeUser(record) {
  if (!record) return null
  const user = { ...record }
  delete user.password
  return user
}

function getRegisteredRecords() {
  return readStorageArray(REGISTERED_USERS_KEY)
}

function saveRegisteredRecords(users) {
  writeStorage(REGISTERED_USERS_KEY, users)
}

function saveCurrentUser(user) {
  writeStorage(AUTH_USER_KEY, user)
}

export function getCurrentUser() {
  const user = readStorageObject(AUTH_USER_KEY)
  return user.id ? user : null
}

export function getRegisteredUsers() {
  return getRegisteredRecords().map(sanitizeUser)
}

export function isAuthenticated() {
  return !!getCurrentUser()
}

export function registerUser({ name, email, password }) {
  const cleanName = String(name ?? '').trim()
  const cleanEmail = normalizeEmail(email)
  const cleanPassword = String(password ?? '')

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return { ok: false, error: '請填寫顯示名稱、電子郵件與密碼' }
  }

  const users = getRegisteredRecords()
  const duplicate = users.some(user => normalizeEmail(user.email) === cleanEmail)
  if (duplicate) {
    return { ok: false, error: '此電子郵件已註冊，請改用登入' }
  }

  const user = {
    id: createId('user'),
    name: cleanName,
    email: cleanEmail,
    avatarUrl: null,
    joinedAt: todayISO(),
    role: 'user',
  }

  users.push({ ...user, password: cleanPassword })
  saveRegisteredRecords(users)
  saveCurrentUser(user)

  return { ok: true, user }
}

export function loginUser({ email, password }) {
  const cleanEmail = normalizeEmail(email)
  const cleanPassword = String(password ?? '')

  if (!cleanEmail || !cleanPassword) {
    return { ok: false, error: '請輸入電子郵件與密碼' }
  }

  const record = getRegisteredRecords().find(user =>
    normalizeEmail(user.email) === cleanEmail && user.password === cleanPassword
  )

  if (!record) {
    return { ok: false, error: '找不到符合的帳號或密碼不正確' }
  }

  const user = sanitizeUser(record)
  saveCurrentUser(user)
  return { ok: true, user }
}

export function logoutUser() {
  removeStorage(AUTH_USER_KEY)
}

// Pre-seeds a fixed dev test account so developers can log in without registering.
// Credentials: test@partymatch.dev / test1234
// The account uses id 'user_001' to match all existing mock data (subscriptions, groups, etc.)
export function seedTestAccount() {
  const TEST_EMAIL = 'test@partymatch.dev'
  const existing = getRegisteredRecords()
  if (existing.some(u => normalizeEmail(u.email) === TEST_EMAIL)) return

  const testUser = {
    id:       'user_001',
    name:     '測試帳號',
    email:    TEST_EMAIL,
    password: 'test1234',
    avatarUrl: null,
    joinedAt: '2024-11-18',
    role:     'user',
  }
  saveRegisteredRecords([...existing, testUser])
}
