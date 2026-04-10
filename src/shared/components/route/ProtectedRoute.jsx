import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { getCurrentSessionUser } from "../../../shared/modules/auth/services/authService.js";
import { LoadingSpinner } from "../feedback/LoadingSpinner.jsx";

export function ProtectedRoute({ children, authRequiredMessage = "請先登入後再使用此功能。" }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const sessionUser = getCurrentSessionUser();

  if (loading) {
    return <LoadingSpinner label="正在確認登入狀態..." />;
  }

  if (!user || !sessionUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
          authRequiredMessage,
        }}
      />
    );
  }

  return children ?? <Outlet />;
}
