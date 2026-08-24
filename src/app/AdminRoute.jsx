import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../common/stores/useAuthStore'

export const ADMIN_HOME_PATH = '/admin';

export default function AdminRoute() {
  const loggedIn = useAuthStore(s => s.loggedIn)
  const isAdmin  = useAuthStore(s => s.user?.isAdmin ?? false)

  if (!loggedIn || !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
