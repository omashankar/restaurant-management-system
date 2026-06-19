"use client";

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import {
  authBadgeCls,
  authBtnPrimaryCls,
  authInputCls,
  authInputInlineCls,
  authInputGroupCls,
  authLinkCls,
  authLogoBadgeCls,
  authSuccessBoxCls,
} from "@/config/authTheme";
import BhojDeskLogo from "@/components/brand/BhojDeskLogo";
import PasswordInput from "@/components/ui/PasswordInput";
import { getLoginFieldErrors } from "@/lib/formValidation";
import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const fieldErrorCls = "mt-1 text-xs text-red-400";

const EMPTY_FIELD_ERRORS = { email: "", password: "", otp: "" };

const DEMO_USERS = [
  { role: "Super Admin", roleKey: "super_admin", email: "superadmin@rms.com", password: "SuperAdmin@2026", icon: "🛡️", accent: "ring-rose-500/30 hover:ring-rose-500/60" },
  { role: "Admin", roleKey: "admin", email: "admin@restaurant.com", password: "password123", icon: "👑", accent: "ring-amber-500/30 hover:ring-amber-500/60" },
  { role: "Manager", roleKey: "manager", email: "manager@restaurant.com", password: "password123", icon: "👤", accent: "ring-violet-500/30 hover:ring-violet-500/60" },
  { role: "Waiter", roleKey: "waiter", email: "waiter@restaurant.com", password: "password123", icon: "🍽️", accent: "ring-sky-500/30 hover:ring-sky-500/60" },
  { role: "Chef", roleKey: "chef", email: "chef@restaurant.com", password: "password123", icon: "👨‍🍳", accent: "ring-emerald-500/30 hover:ring-emerald-500/60" },
];

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className={fieldErrorCls} role="alert">
      {message}
    </p>
  );
}

function safePostLoginPath(params, role) {
  const from = params.get("from");
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return defaultRedirectForRole(role);
}

function LoginContent() {
  const { user, hydrated, login } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [unverified, setUnverified] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [verificationInfo, setVerificationInfo] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(safePostLoginPath(params, user.role));
  }, [hydrated, user, router, params]);

  useEffect(() => {
    const defaultEmail = params.get("email");
    const verifyFlag = params.get("verify");
    if (defaultEmail) setEmail(defaultEmail);
    if (verifyFlag === "1") {
      setVerificationInfo("Account created. Please verify your email from inbox, then login.");
    }
  }, [params]);

  const clearFieldError = (key) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverified(false);

    const errors = getLoginFieldErrors({ email, password, needs2FA, otpCode });
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    try {
      if (needs2FA && challengeToken) {
        const res = await fetch("/api/auth/2fa/verify-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeToken, code: otpCode.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          login(data.user);
          router.push(safePostLoginPath(params, data.user?.role));
          return;
        }
        setError(data.error ?? "Invalid code.");
        return;
      }

      const trimmedEmail = email.trim();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password, rememberMe }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.user);
        router.push(safePostLoginPath(params, data.user?.role));
        return;
      }

      if (data.requires2FA && data.challengeToken) {
        setNeeds2FA(true);
        setChallengeToken(data.challengeToken);
        setFieldErrors(EMPTY_FIELD_ERRORS);
        setError("");
        return;
      }

      if (data.code === "SETUP_2FA_REQUIRED") {
        setError(data.error);
        return;
      }

      if (data.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
        return;
      }

      if (data.code === "ACCOUNT_INACTIVE") {
        setError(data.error);
        return;
      }

      const demo = DEMO_USERS.find((u) => u.email === trimmedEmail && u.password === password);
      if (demo) {
        login(demo.email, demo.roleKey);
        router.push(safePostLoginPath(params, demo.roleKey));
        return;
      }

      setError(data.error ?? "Login failed.");
    } catch {
      const trimmedEmail = email.trim();
      const demo = DEMO_USERS.find((u) => u.email === trimmedEmail && u.password === password);
      if (demo) {
        login(demo.email, demo.roleKey);
        router.push(safePostLoginPath(params, demo.roleKey));
        return;
      }
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setError("");
  };

  const resendVerification = async () => {
    setResendMsg("");
    const emailErr = getLoginFieldErrors({ email, password: "x", needs2FA: false, otpCode: "" }).email;
    if (emailErr) {
      setFieldErrors((prev) => ({ ...prev, email: emailErr }));
      setResendMsg("❌ Enter a valid email first.");
      return;
    }
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setResendMsg(
        data.success ? "✅ " + data.message : "❌ " + (data.error ?? "Failed to resend."),
      );
    } catch {
      setResendMsg("❌ Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const copyDemo = (u) => {
    navigator.clipboard.writeText(`${u.email} / ${u.password}`).catch(() => {});
    setCopied(u.role);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-w-0 w-full max-w-4xl">
      <div className="mb-6 text-center sm:mb-8">
        <BhojDeskLogo
          variant="horizontalDark"
          height={56}
          className="mx-auto w-full max-w-[300px] object-center"
          priority
        />
        <p className="mt-4 text-sm text-zinc-500">Sign in to your workspace</p>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                className={authInputCls}
                placeholder="you@restaurant.com"
                aria-invalid={fieldErrors.email ? true : undefined}
                readOnly={needs2FA}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            {needs2FA ? (
              <div>
                <label htmlFor="otp" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Authenticator code <span className="text-red-400">*</span>
                </label>
                <input
                  id="otp"
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    clearFieldError("otp");
                  }}
                  className={authInputCls}
                  placeholder="000000"
                  aria-invalid={fieldErrors.otp ? true : undefined}
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Open your authenticator app and enter the 6-digit code.
                </p>
                <FieldError message={fieldErrors.otp} />
                <button
                  type="button"
                  onClick={() => {
                    setNeeds2FA(false);
                    setChallengeToken("");
                    setOtpCode("");
                    setFieldErrors(EMPTY_FIELD_ERRORS);
                  }}
                  className="mt-2 cursor-pointer text-xs text-zinc-500 hover:text-zinc-300"
                >
                  ← Back to password login
                </button>
              </div>
            ) : (
              <PasswordInput
                id="password"
                label="Password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  clearFieldError("password");
                }}
                placeholder="••••••••"
                inputClassName={`${authInputInlineCls} px-4 py-3 pr-11`}
                error={fieldErrors.password || undefined}
              />
            )}

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            {verificationInfo && (
              <p className={authSuccessBoxCls}>
                {verificationInfo}
              </p>
            )}
            {unverified && (
              <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-semibold text-amber-300">Email not verified</p>
                <p className="text-xs text-amber-400/80">
                  Please check your inbox and click the verification link before logging in.
                </p>
                {resendMsg && (
                  <p
                    className={`text-xs font-medium ${resendMsg.startsWith("✅") ? "auth-link" : "text-red-400"}`}
                  >
                    {resendMsg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendLoading}
                  className={`${authLinkCls} text-xs font-semibold underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {resendLoading ? "Sending…" : "Resend verification email →"}
                </button>
              </div>
            )}

            {!needs2FA && (
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <label htmlFor="rememberMe" className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-platform-primary size-4 cursor-pointer rounded border-zinc-600 bg-zinc-800"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="auth-link text-xs font-medium underline-offset-2 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={authBtnPrimaryCls}
            >
              {loading ? "Signing in…" : needs2FA ? "Verify & Sign In" : "Sign In"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-500">
            No account?{" "}
            <Link href="/signup" className={authLinkCls}>
              Create account
            </Link>
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Demo Credentials</h2>
            <span className={authBadgeCls}>
              Demo Mode
            </span>
          </div>
          <p className="mb-4 text-xs text-zinc-500">Click any card to auto-fill, or copy credentials.</p>
          <div className="space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => fillDemo(u)}
                className={`w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-left ring-1 transition-all duration-200 hover:bg-zinc-800/60 ${u.accent}`}
              >
                <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-lg ring-1 ring-zinc-700">
                      {u.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">{u.role}</p>
                      <p className="break-all text-xs text-zinc-500">{u.email}</p>
                      <p className="break-all text-xs text-zinc-600">Password: {u.password}</p>
                    </div>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      copyDemo(u);
                    }}
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                  >
                    {copied === u.role ? (
                      <span className="auth-link text-[10px] font-bold">✓</span>
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
