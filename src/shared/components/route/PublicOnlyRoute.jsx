import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '../../stores/authStore'

export default function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  return children ?? <Outlet />
}
