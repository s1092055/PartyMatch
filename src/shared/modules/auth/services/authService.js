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

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeUsername(username) {
  return normalizeText(username);
}

function normalizeUsernameKey(username) {
  return normalizeUsername(username).toLowerCase();
}

function normalizePhone(phone) {
  return normalizeText(phone).replace(/[^\d]/g, "");
}

function resolveDisplayName(userRecord) {
  return (
    normalizeText(userRecord?.username) ||
    normalizeText(userRecord?.fullName) ||
    normalizeText(userRecord?.displayName) ||
    getDefaultDisplayName(userRecord?.email)
  );
}

function normalizeStoredUser(userRecord) {
  if (!userRecord || typeof userRecord !== "object") return null;

  const resolvedUserId =
    typeof userRecord.id === "string" && userRecord.id
      ? userRecord.id
      : userRecord.uid;

  if (!resolvedUserId) return null;

  const email = normalizeEmail(userRecord.email);
  const username = normalizeUsername(userRecord.username);
  const fullName = normalizeText(userRecord.fullName);
  const nickname = normalizeText(userRecord.nickname);
  const phone = normalizePhone(userRecord.phone);

  return {
    ...userRecord,
    id: resolvedUserId,
    uid: resolvedUserId,
    email,
    username,
    usernameKey: normalizeUsernameKey(username),
    fullName,
    nickname,
    phone,
    displayName: resolveDisplayName({
      ...userRecord,
      email,
      username,
      fullName,
      nickname,
    }),
    createdAt:
      typeof userRecord.createdAt === "string" && userRecord.createdAt
        ? userRecord.createdAt
        : new Date().toISOString(),
  };
}

function sanitizeUser(userRecord) {
  const normalizedUser = normalizeStoredUser(userRecord);

  if (!normalizedUser) return null;

  return {
    id: normalizedUser.id,
    uid: normalizedUser.uid,
    username: normalizedUser.username,
    fullName: normalizedUser.fullName,
    nickname: normalizedUser.nickname,
    phone: normalizedUser.phone,
    email: normalizedUser.email,
    displayName: normalizedUser.displayName,
  };
}

function readUsers() {
  const users = readJson(DEMO_USERS_STORAGE_KEY, []);
  if (!Array.isArray(users)) return [];
  return users.map((user) => normalizeStoredUser(user)).filter(Boolean);
}

function writeUsers(users) {
  writeJson(DEMO_USERS_STORAGE_KEY, users);
}

export function getRegisteredUsers() {
  return readUsers().map((user) => sanitizeUser(user)).filter(Boolean);
}

function readSessionUser() {
  const session = readJson(DEMO_SESSION_STORAGE_KEY, null);
  const sessionUserId =
    typeof session?.id === "string" && session.id
      ? session.id
      : session?.uid;

  if (!sessionUserId) return null;

  return sanitizeUser({
    ...session,
    id: sessionUserId,
    uid: sessionUserId,
  });
}

export function getCurrentSessionUser() {
  return readSessionUser();
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

function validateUsername(username) {
  return username.length >= 3 && username.length <= 24 && !/\s/.test(username);
}

function validatePhone(phone) {
  return /^\d{8,15}$/.test(phone);
}

export function subscribeToAuthState(callback) {
  ensureStorageListener();
  callback(readSessionUser());
  authListeners.add(callback);

  return () => {
    authListeners.delete(callback);
  };
}

export async function signUpWithEmail(payload, fallbackPassword) {
  const registration =
    payload && typeof payload === "object"
      ? payload
      : { email: payload, password: fallbackPassword };
  const username = normalizeUsername(registration.username);
  const usernameKey = normalizeUsernameKey(registration.username);
  const fullName = normalizeText(registration.fullName);
  const normalizedPhone = normalizePhone(registration.phone);
  const normalizedEmail = normalizeEmail(registration.email);
  const password = String(registration.password ?? fallbackPassword ?? "");

  if (!username || !fullName || !normalizedPhone || !normalizedEmail || !password) {
    throw makeAuthError(
      "auth/missing-profile-field",
      "請完整填寫使用者名稱、真實姓名、手機號碼、Email 與密碼。",
    );
  }

  if (!validateUsername(username)) {
    throw makeAuthError(
      "auth/invalid-username",
      "使用者名稱需為 3 到 24 個字元，且不能包含空白。",
    );
  }

  if (!validatePhone(normalizedPhone)) {
    throw makeAuthError("auth/invalid-phone-number", "請輸入有效的手機號碼。");
  }

  if (!validateEmail(normalizedEmail)) {
    throw makeAuthError("auth/invalid-email", "請輸入有效的 Email。");
  }

  if (password.length < 6) {
    throw makeAuthError("auth/weak-password", "密碼至少需要 6 個字元。");
  }

  const users = readUsers();
  const emailAlreadyExists = users.some((user) => user.email === normalizedEmail);
  const phoneAlreadyExists = users.some((user) => user.phone === normalizedPhone);
  const usernameAlreadyExists = users.some(
    (user) => user.usernameKey === usernameKey,
  );

  if (emailAlreadyExists) {
    throw makeAuthError("auth/email-already-in-use", "這個 Email 已經註冊過了。");
  }

  if (phoneAlreadyExists) {
    throw makeAuthError(
      "auth/phone-already-in-use",
      "這個手機號碼已經綁定過 PartyMatch 帳號。",
    );
  }

  if (usernameAlreadyExists) {
    throw makeAuthError(
      "auth/username-already-in-use",
      "這個使用者名稱已經被註冊，請換一個試試。",
    );
  }

  const nextUserId = generateUid();

  const nextUser = {
    id: nextUserId,
    uid: nextUserId,
    username,
    usernameKey,
    fullName,
    phone: normalizedPhone,
    email: normalizedEmail,
    password,
    displayName: resolveDisplayName({
      username,
      fullName,
      email: normalizedEmail,
    }),
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, nextUser]);
  writeSessionUser(nextUser);
  notifyAuthListeners();

  return { user: sanitizeUser(nextUser) };
}

export async function signInWithEmail(identifier, password) {
  const normalizedIdentifier = normalizeText(identifier);

  if (!normalizedIdentifier) {
    throw makeAuthError(
      "auth/invalid-identifier",
      "請輸入 Email、手機號碼或使用者名稱。",
    );
  }

  const normalizedEmail = normalizeEmail(normalizedIdentifier);
  const normalizedPhone = normalizePhone(normalizedIdentifier);
  const normalizedUsernameKey = normalizeUsernameKey(normalizedIdentifier);

  const user = readUsers().find((item) => {
    if (validateEmail(normalizedEmail) && item.email === normalizedEmail) {
      return true;
    }

    if (normalizedPhone && item.phone === normalizedPhone) {
      return true;
    }

    return item.usernameKey === normalizedUsernameKey;
  });

  if (!user) {
    throw makeAuthError("auth/user-not-found", "帳號尚未註冊，請先建立帳號。");
  }

  if (user.password !== password) {
    throw makeAuthError("auth/wrong-password", "密碼不正確，請重新輸入。");
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
    case "auth/phone-already-in-use":
      return "這個手機號碼已經綁定過 PartyMatch 帳號。";
    case "auth/username-already-in-use":
      return "這個使用者名稱已經被註冊，請換一個試試。";
    case "auth/invalid-email":
      return "請輸入有效的 Email。";
    case "auth/invalid-phone-number":
      return "請輸入有效的手機號碼。";
    case "auth/invalid-username":
      return "使用者名稱需為 3 到 24 個字元，且不能包含空白。";
    case "auth/invalid-identifier":
      return "請輸入 Email、手機號碼或使用者名稱。";
    case "auth/user-not-found":
      return "帳號尚未註冊，請先建立帳號。";
    case "auth/wrong-password":
      return "密碼不正確，請重新輸入。";
    case "auth/weak-password":
      return "密碼強度不足，至少需要 6 個字元。";
    case "auth/missing-profile-field":
      return "請完整填寫註冊需要的帳號資料。";
    default:
      return error?.message || "操作失敗，請稍後再試。";
  }
}
