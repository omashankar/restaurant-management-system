"use client";

import { Mail, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { emailError } from "@/lib/formValidation";
import {
  authBtnPrimaryCls,
  authInputWithIconCls,
  authLinkCls,
  authLogoBadgeCls,
  authSuccessBoxCls,
} from "@/config/authTheme";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetLink, setDevResetLink] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <span className={authLogoBadgeCls}>
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
          Reset password
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your email and we will send reset instructions.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className={`${authSuccessBoxCls} text-sm`}>
              If this email exists, reset instructions have been sent.
            </p>
            {devResetLink ? (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 break-all">
                Dev reset link:{" "}
                <a
                  href={devResetLink}
                  className="underline underline-offset-2 hover:text-amber-200"
                >
                  {devResetLink}
                </a>
              </p>
            ) : null}
            <Link
              href="/login"
              className={`${authLinkCls} inline-block text-sm`}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const trimmed = email.trim();
              const err = emailError(trimmed);
              if (err) {
                setError(err);
                return;
              }
              setLoading(true);
              setDevResetLink("");
              try {
                const res = await fetch("/api/auth/forgot-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: trimmed }),
                });
                const data = await res.json();
                if (!res.ok || !data?.success) {
                  setError(data?.error ?? "Failed to send reset email.");
                  return;
                }
                if (data?.devResetLink) setDevResetLink(data.devResetLink);
                setSubmitted(true);
              } catch {
                setError("Network error. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInputWithIconCls}
                  placeholder="you@restaurant.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={authBtnPrimaryCls}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            ) : null}
            <p className="text-center text-sm text-zinc-500">
              Remember your password?{" "}
              <Link
                href="/login"
                className={authLinkCls}
              >
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
