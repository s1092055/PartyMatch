import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../shared/components/feedback/LoadingSpinner.jsx";
import { Card } from "../../../shared/components/ui/Card.jsx";
import { Input } from "../../../shared/components/ui/Input.jsx";
import { Button } from "../../../shared/components/ui/Button.jsx";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { getAuthErrorMessage } from "../../../shared/modules/auth/services/authService.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectState = location.state?.from;
  const redirectTo = `${redirectState?.pathname ?? "/manage-group"}${redirectState?.search ?? ""}${redirectState?.hash ?? ""}`;
  const authRequiredMessage = location.state?.authRequiredMessage ?? "";

  if (loading) {
    return <LoadingSpinner label="正在載入註冊頁面..." />;
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password || !confirmPassword) {
      setError("請完整填寫 Email、密碼與確認密碼。");
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
    setIsSubmitting(true);

    try {
      await signUp(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold tracking-tight">註冊</h1>
      <p className="mt-2 text-sm text-black/60">
        建立 PartyMatch 帳號後，就能建立群組與管理你的共享方案。
      </p>

      {authRequiredMessage ? (
        <div className="mt-4 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
          {authRequiredMessage}
        </div>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-black/70">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-black/70">密碼</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 6 個字元"
            autoComplete="new-password"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-black/70">確認密碼</span>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="再次輸入密碼"
            autoComplete="new-password"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? "建立中..." : "建立帳號"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-black/60">
        已經有帳號？
        {" "}
        <Link
          to="/login"
          state={location.state}
          className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
        >
          前往登入
        </Link>
      </p>
    </Card>
  );
}
