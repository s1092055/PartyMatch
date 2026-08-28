import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuthStore } from '../common/stores/useAdminAuthStore'

export const ADMIN_HOME_PATH = '/admin';
export const ADMIN_LOGIN_PATH = '/admin/login';

export default function AdminRoute() {
  const loggedIn = useAdminAuthStore(s => s.loggedIn)

  if (!loggedIn) return <Navigate to={ADMIN_LOGIN_PATH} replace />

  return <Outlet />
}
