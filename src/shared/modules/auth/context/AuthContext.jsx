import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  getCurrentSessionUser,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthState,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncSessionUser = useCallback(() => {
    setUser(getCurrentSessionUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.addEventListener("focus", syncSessionUser);
    window.addEventListener("pageshow", syncSessionUser);

    return () => {
      window.removeEventListener("focus", syncSessionUser);
      window.removeEventListener("pageshow", syncSessionUser);
    };
  }, [syncSessionUser]);

  const signIn = useCallback(async (identifier, password) => {
    const result = await signInWithEmail(identifier, password);
    setUser(result.user);
    setLoading(false);
    return result;
  }, []);

  const signUp = useCallback(async (payload) => {
    const result = await signUpWithEmail(payload);
    setUser(result.user);
    setLoading(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [loading, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
