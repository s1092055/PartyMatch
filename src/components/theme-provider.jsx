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

  // 深/淺色互轉的翻轉規則只在這裡寫一次，DesktopSidebar／TabletSidebarDrawer／SettingsTab
  // 都呼叫這支，不用各自重複 theme === 'dark' ? 'light' : 'dark'
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  // provider 本身沒有會變動的 props，只在 theme/hasOverride 改變時才重新 render，
  // 所以這裡的 useMemo 攔不到「provider 沒變但硬是重建 value」的情況；保留它單純是
  // 讓 value 物件的 identity 只在真的有變化時才換新，維持一般 context 慣例
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

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
