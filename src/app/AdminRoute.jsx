import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../common/stores/useAuthStore'

// 管理員後台不走一般 ProtectedRoute 的「請先登入」彈窗，未登入或非管理員一律直接導回首頁，
// 不透露這個路由的存在給一般使用者
export default function AdminRoute() {
  const loggedIn = useAuthStore(s => s.loggedIn)
  const isAdmin  = useAuthStore(s => s.user?.isAdmin ?? false)

  if (!loggedIn || !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
