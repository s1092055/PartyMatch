import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../shared/stores/useAuthStore'

export default function PublicOnlyRoute({ children }) {
  if (useAuthStore(s => s.loggedIn)) {
    return <Navigate to="/" replace />
  }

  return children ?? <Outlet />
}
