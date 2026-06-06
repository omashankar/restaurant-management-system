"use client";

import { Eye, EyeOff, Loader2, Lock, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { passwordBasicError, passwordMatchError } from "@/lib/formValidation";
import {
  authBtnPrimaryCls,
  authInputWithIconPwCls,
  authLinkCls,
  authLogoBadgeCls,
  authSpinnerCls,
  authSuccessBoxCls,
} from "@/config/authTheme";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset link is invalid or expired.");
      return;
    }

    const pwdErr = passwordBasicError(password) || passwordMatchError(password, confirmPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Reset failed.");
        return;
      }
      setSuccess("Password reset successful. You can login now.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0 w-full max-w-md">
      <div className="mb-6 text-center sm:mb-8">
        <span className={authLogoBadgeCls}>
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 break-words text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
          Set new password
        </h1>
        <p className="mt-1 break-words text-sm text-zinc-500">
          Enter your new password below.
        </p>
      </div>

      <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              New Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInputWithIconPwCls}
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Confirm Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showConfirmPw ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={authInputWithIconPwCls}
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className={authSuccessBoxCls}>
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={authBtnPrimaryCls}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Back to{" "}
          <Link href="/login" className={authLinkCls}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] w-full min-w-0 max-w-md items-center justify-center px-4">
          <Loader2 className={authSpinnerCls} aria-hidden />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
