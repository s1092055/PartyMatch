import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function SubscriptionsRedirect() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/my-groups?view=member', { replace: true }) }, [navigate])
  return null
}

export function ManageRedirect() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/my-groups?view=host', { replace: true }) }, [navigate])
  return null
}

export function GroupRedirect() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  useEffect(() => {
    navigate('/explore', { replace: true })
    // Delay dispatch until after navigation re-render so GroupDetailModal's
    // event listener is guaranteed to be mounted before the event fires.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId } }))
    }, 0)
  }, [navigate, groupId])
  return null
}
