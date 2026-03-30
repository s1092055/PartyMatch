import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";

function buildRedirectState(location, message) {
  return {
    from: {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    },
    authRequiredMessage: message,
  };
}

export function useRequireAuthAction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return useCallback(
    (message, action) => {
      if (!user) {
        navigate("/login", {
          state: buildRedirectState(location, message),
        });
        return false;
      }

      action?.();
      return true;
    },
    [location, navigate, user],
  );
}
