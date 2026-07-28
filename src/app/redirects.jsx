import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

// 舊版 /my-groups?view=host|member 合併頁的相容路由，依 view 參數導向對應的獨立頁面
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
    navigate('/explore', { replace: true })
    // Delay dispatch until after navigation re-render so GroupDetailModal's
    // event listener is guaranteed to be mounted before the event fires.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId } }))
    }, 0)
  }, [navigate, groupId])
  return null
}
