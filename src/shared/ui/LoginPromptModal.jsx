import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import ConfirmDialog from './primitives/ConfirmDialog'

export default function LoginPromptModal({ onClose }) {
  const navigate = useNavigate()

  function handleLogin() {
    onClose()
    navigate('/login')
  }

  return (
    <ConfirmDialog
      icon={<Lock size={16} strokeWidth={1.5} className="text-brand" />}
      title="需要登入才能繼續"
      message="請先登入帳號以使用此功能。"
      confirmLabel="前往登入"
      onConfirm={handleLogin}
      onCancel={onClose}
    />
  )
}
