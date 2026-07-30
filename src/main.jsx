import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'

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
