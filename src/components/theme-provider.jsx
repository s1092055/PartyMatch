import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { THEME_STORAGE_KEY, getStoredTheme, getSystemTheme } from '../lib/theme'

const ThemeContext = createContext(null)

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme() ?? getSystemTheme())
  const [hasOverride, setHasOverride] = useState(() => getStoredTheme() !== null)

  useEffect(() => { applyTheme(theme) }, [theme])

  // 使用者尚未手動覆蓋過（沒有存在 localStorage 的明確選擇）時，跟隨作業系統設定即時變化
  useEffect(() => {
    if (hasOverride) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = e => setThemeState(e.matches ? 'dark' : 'light')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [hasOverride])

  const setTheme = useCallback(next => {
    setThemeState(next)
    setHasOverride(true)
    localStorage.setItem(THEME_STORAGE_KEY, next)
  }, [])

  // 沒有 memo 的話每次 render 都會建一個新物件，任何 consumer（例如掛在會隨捲動
  // 重新渲染的 MobileDock 上）都會被迫跟著重渲染，即使 theme 本身沒變
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + hook 慣例共用同一檔案
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
