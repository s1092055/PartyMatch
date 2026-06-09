import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function CreateGroupRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pm:open-create'))
    navigate('/manage-groups', { replace: true })
  }, [navigate])
  return null
}

export function QuickMatchRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pm:open-match'))
    navigate('/explore', { replace: true })
  }, [navigate])
  return null
}
