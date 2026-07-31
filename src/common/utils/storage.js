export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function createId(prefix) {
  // 純 Date.now() 在同一毫秒內連續呼叫會撞號（例如同步批次建立多筆樂觀資料），加上亂數尾碼避免碰撞
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
