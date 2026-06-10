import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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

export function GroupRedirect() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  useEffect(() => {
    navigate('/explore', { replace: true })
    // Delay dispatch until after navigation re-render so GroupDetailModal's
    // event listener is guaranteed to be mounted before the event fires.
    const id = groupId
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: id } }))
    }, 0)
  }, [navigate, groupId])
  return null
}
