import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { LogIn, Lock } from 'lucide-react'
import Button from './Button'

export default function LoginPromptModal({ onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleLogin() {
    onClose()
    navigate('/login')
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center p-6">
        <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up">
          <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle">
            <Lock size={22} className="text-brand" />
          </div>
          <h2 className="mb-1 text-center text-base font-extrabold text-ink">需要登入才能繼續</h2>
          <p className="mb-6 text-center text-sm text-ink-3">請先登入帳號以使用此功能。</p>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleLogin}>
              <LogIn size={15} />
              前往登入
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
