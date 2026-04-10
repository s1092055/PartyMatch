import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../shared/components/feedback/LoadingSpinner.jsx";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { getAuthErrorMessage } from "../../../shared/modules/auth/services/authService.js";
import { resolveAuthRedirect } from "../../../shared/modules/auth/utils/resolveAuthRedirect.js";
import { useToast } from "../../../shared/hooks/useToast.js";
import { LabelInput, SubmitButton } from "../AuthFormFields.jsx";
import { AuthPageShell } from "../components/AuthPageShell.jsx";

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signUp } = useAuth();
  const { addToast } = useToast();
  const toastShownRef = useRef(false);
  const [username, setUsername] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);

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

  if (loading) return <LoadingSpinner label="正在載入註冊頁面..." />;
  if (user && !isCompletingRegistration) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !username.trim() ||
      !lastName.trim() ||
      !firstName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("請完整填寫所有必填欄位。");
      return;
    }

    if (password.length < 6) {
      setError("密碼至少需要 6 個字元。");
      return;
    }

    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致。");
      return;
    }

    setError("");
    setStatusMessage("");
    setIsSubmitting(true);
    setIsCompletingRegistration(true);

    try {
      await signUp({
        username: username.trim(),
        fullName: `${lastName.trim()}${firstName.trim()}`,
        phone: phone.trim(),
        email: email.trim(),
        password,
      });

      setStatusMessage("註冊成功，已自動登入，正在前往首頁...");

      await new Promise((resolve) => window.setTimeout(resolve, 500));
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
      setIsCompletingRegistration(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell formTitle="建立帳號">
      {statusMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <LabelInput
          label="使用者名稱"
          id="register-username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="輸入你的使用者名稱（顯示於 PartyMatch）"
          autoComplete="username"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <LabelInput
            label="姓"
            id="register-last-name"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="王"
            autoComplete="family-name"
            required
          />
          <LabelInput
            label="名"
            id="register-first-name"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="小明"
            autoComplete="given-name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <LabelInput
            label="手機號碼"
            id="register-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0912345678"
            autoComplete="tel"
            inputMode="tel"
            required
          />
          <LabelInput
            label="Email"
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </div>
        <LabelInput
          label="密碼"
          id="register-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="至少 6 個字元"
          autoComplete="new-password"
          required
        />
        <LabelInput
          label="確認密碼"
          id="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="再次輸入密碼"
          autoComplete="new-password"
          required
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="pt-2">
          <SubmitButton disabled={isSubmitting}>
            {isSubmitting ? "建立中…" : "建立帳號"}
          </SubmitButton>
        </div>
      </form>

      <div className="mt-8 border-t border-black/8 pt-6 text-sm text-black/52">
        已經有帳號？{" "}
        <Link
          to="/login"
          state={location.state}
          className="font-semibold text-black transition hover:text-black/64"
        >
          前往登入
        </Link>
      </div>
    </AuthPageShell>
  );
}
