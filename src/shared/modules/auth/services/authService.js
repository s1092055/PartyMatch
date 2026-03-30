const DEMO_USERS_STORAGE_KEY = "partymatch_demo_users";
const DEMO_SESSION_STORAGE_KEY = "partymatch_demo_session";

const authListeners = new Set();
let storageListenerBound = false;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function makeAuthError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function sanitizeUser(userRecord) {
  if (!userRecord) return null;

  return {
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: userRecord.displayName,
  };
}

function readUsers() {
  const users = readJson(DEMO_USERS_STORAGE_KEY, []);
  return Array.isArray(users) ? users : [];
}

function writeUsers(users) {
  writeJson(DEMO_USERS_STORAGE_KEY, users);
}

function readSessionUser() {
  const session = readJson(DEMO_SESSION_STORAGE_KEY, null);
  if (!session || typeof session.uid !== "string") return null;
  return sanitizeUser(session);
}

function writeSessionUser(user) {
  if (!canUseStorage()) return;

  if (!user) {
    localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
    return;
  }

  writeJson(DEMO_SESSION_STORAGE_KEY, sanitizeUser(user));
}

function notifyAuthListeners() {
  const nextUser = readSessionUser();
  authListeners.forEach((listener) => listener(nextUser));
}

function ensureStorageListener() {
  if (!canUseStorage() || storageListenerBound) return;

  window.addEventListener("storage", (event) => {
    if (
      event.key === DEMO_USERS_STORAGE_KEY ||
      event.key === DEMO_SESSION_STORAGE_KEY
    ) {
      notifyAuthListeners();
    }
  });

  storageListenerBound = true;
}

function generateUid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `demo-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultDisplayName(email) {
  const [name = "PartyMatch 使用者"] = String(email).split("@");
  return name || "PartyMatch 使用者";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function subscribeToAuthState(callback) {
  ensureStorageListener();
  callback(readSessionUser());
  authListeners.add(callback);

  return () => {
    authListeners.delete(callback);
  };
}

export async function signUpWithEmail(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    throw makeAuthError("auth/invalid-email", "請輸入有效的 Email。");
  }

  if (password.length < 6) {
    throw makeAuthError("auth/weak-password", "密碼至少需要 6 個字元。");
  }

  const users = readUsers();
  const alreadyExists = users.some((user) => user.email === normalizedEmail);

  if (alreadyExists) {
    throw makeAuthError("auth/email-already-in-use", "這個 Email 已經註冊過了。");
  }

  const nextUser = {
    uid: generateUid(),
    email: normalizedEmail,
    password,
    displayName: getDefaultDisplayName(normalizedEmail),
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, nextUser]);
  writeSessionUser(nextUser);
  notifyAuthListeners();

  return { user: sanitizeUser(nextUser) };
}

export async function signInWithEmail(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    throw makeAuthError("auth/invalid-email", "請輸入有效的 Email。");
  }

  const user = readUsers().find((item) => item.email === normalizedEmail);

  if (!user) {
    throw makeAuthError("auth/user-not-found", "Email 或密碼不正確。");
  }

  if (user.password !== password) {
    throw makeAuthError("auth/wrong-password", "Email 或密碼不正確。");
  }

  writeSessionUser(user);
  notifyAuthListeners();

  return { user: sanitizeUser(user) };
}

export async function signOutUser() {
  writeSessionUser(null);
  notifyAuthListeners();
}

export function getAuthErrorMessage(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "這個 Email 已經註冊過了。";
    case "auth/invalid-email":
      return "請輸入有效的 Email。";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email 或密碼不正確。";
    case "auth/weak-password":
      return "密碼強度不足，至少需要 6 個字元。";
    default:
      return error?.message || "操作失敗，請稍後再試。";
  }
}
