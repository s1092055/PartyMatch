import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../stores/authStore'

export default function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!isAuthenticated()) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />
  }

  return children ?? <Outlet />
}
