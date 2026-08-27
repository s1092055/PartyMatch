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

export function readStorageArray(key) {
  const value = readStorage(key, [])
  return Array.isArray(value) ? value : []
}

export function readStorageObject(key) {
  const value = readStorage(key, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function upsertStoredRecord(key, id, patch) {
  const records = readStorageArray(key)
  const index = records.findIndex(item => item.id === id)

  if (index === -1) return null

  const next = { ...records[index], ...patch }
  records[index] = next
  writeStorage(key, records)
  return next
}

export function removeStorage(key) {
  localStorage.removeItem(key)
}

export function saveOverride(key, id, patch) {
  const overrides = readStorageObject(key)
  overrides[id] = { ...(overrides[id] ?? {}), ...patch }
  writeStorage(key, overrides)
  return overrides[id]
}

export function createId(prefix) {
  return `${prefix}_${Date.now()}`
}
