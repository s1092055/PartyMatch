import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import { getStoredTheme, getSystemTheme } from './lib/theme'

document.documentElement.classList.toggle('dark', (getStoredTheme() ?? getSystemTheme()) === 'dark')

// 頁面成功掛載代表這次載入用的是目前有效的 chunk 檔名，清掉 RouteErrorBoundary 留下的
// 重整旗標，讓「稍後同一個分頁又遇到一次舊 chunk 失效」時還能再自動重整一次
sessionStorage.removeItem('pm_chunk_reload_attempted')

document.documentElement.classList.add('using-mouse')
window.addEventListener('mousedown', () => document.documentElement.classList.add('using-mouse'), true)
window.addEventListener('keydown', e => {
  if (e.key === 'Tab') document.documentElement.classList.remove('using-mouse')
}, true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
