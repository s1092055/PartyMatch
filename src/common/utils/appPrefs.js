import { readStorage, writeStorage } from './storage'

export const PREFS_KEY = 'pm_app_prefs'
export const DEFAULT_PREFS = {
  autoOpenSearch: false,
  marketingEmail: false,
  shareActivity:  false,
}

export function loadPrefs() {
  return { ...DEFAULT_PREFS, ...readStorage(PREFS_KEY, {}) }
}

export function savePrefs(next) {
  writeStorage(PREFS_KEY, next)
}
