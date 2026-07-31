import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from './alert-dialog'

export default function LoginPromptModal({ onClose }) {
  const navigate = useNavigate()

  function handleLogin() {
    onClose()
    navigate('/login')
  }

  return (
    <AlertDialog open onOpenChange={v => { if (!v) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <Lock size={16} strokeWidth={1.5} className="shrink-0 text-brand" />
          <AlertDialogTitle>需要登入才能繼續</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>請先登入帳號以使用此功能。</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>前往登入</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
