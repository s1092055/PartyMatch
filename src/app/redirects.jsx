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

// 舊版 /quick-match 獨立全螢幕頁面的相容路由，快速搜尋改成全站共用的 QuickMatchModal，
// 導回首頁後觸發同一個 pm:open-quick-match event 開啟
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
