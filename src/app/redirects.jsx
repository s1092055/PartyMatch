import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

export function MyGroupsLegacyRedirect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useEffect(() => {
    navigate(searchParams.get('view') === 'host' ? '/manage-groups' : '/my-subscriptions', { replace: true })
  }, [navigate, searchParams])
  return null
}

export function GroupRedirect() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  useEffect(() => {
    navigate(`/explore?group=${encodeURIComponent(groupId)}`, { replace: true })
  }, [navigate, groupId])
  return null
}

export function QuickMatchRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pm:open-quick-match'))
    }, 0)
  }, [navigate])
  return null
}

export function AccountRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pm:open-profile'))
    }, 0)
  }, [navigate])
  return null
}
