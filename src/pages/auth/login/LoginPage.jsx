import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../shared/components/feedback/LoadingSpinner.jsx";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { getAuthErrorMessage } from "../../../shared/modules/auth/services/authService.js";
import { resolveAuthRedirect } from "../../../shared/modules/auth/utils/resolveAuthRedirect.js";
import { useToast } from "../../../shared/hooks/useToast.js";
import { LabelInput, SubmitButton } from "../AuthFormFields.jsx";
import { AuthPageShell } from "../components/AuthPageShell.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signIn } = useAuth();
  const { addToast } = useToast();
  const toastShownRef = useRef(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = resolveAuthRedirect(location.state?.from);
  const authRequiredMessage = location.state?.authRequiredMessage ?? "";

  useEffect(() => {
    if (authRequiredMessage && !toastShownRef.current) {
      toastShownRef.current = true;
      addToast(authRequiredMessage, "info");
      const { authRequiredMessage: _, ...restState } = location.state ?? {};
      navigate(location.pathname + location.search, { replace: true, state: restState });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSpinner label="正在載入登入狀態..." />;
  if (user) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      setError("請輸入帳號、Email 或手機號碼與密碼。");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signIn(identifier.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell formTitle="歡迎回來">
      {/* Google mock button */}
      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-black/12 bg-white text-sm font-medium text-black/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition duration-150 hover:bg-black/[0.03] hover:border-black/18"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        使用 Google 繼續
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/8" />
        <span className="text-xs text-black/36">或</span>
        <div className="h-px flex-1 bg-black/8" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <LabelInput
          label="使用者名稱 / Email / 手機號碼"
          id="login-identifier"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="輸入你的帳號識別資料"
          autoComplete="username"
        />
        <LabelInput
          label="密碼"
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="輸入你的密碼"
          autoComplete="current-password"
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="pt-2">
          <SubmitButton disabled={isSubmitting}>
            {isSubmitting ? "登入中…" : "登入"}
          </SubmitButton>
        </div>
      </form>

      <div className="mt-8 border-t border-black/8 pt-6 text-sm text-black/52">
        還沒有帳號？{" "}
        <Link
          to="/register"
          state={location.state}
          className="font-semibold text-black transition hover:text-black/64"
        >
          前往註冊
        </Link>
      </div>
    </AuthPageShell>
  );
}
