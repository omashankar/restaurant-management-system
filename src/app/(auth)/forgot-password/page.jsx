"use client";

import { Mail, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
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
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
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
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
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
              className="cursor-pointer inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError("");
              setDevResetLink("");
              try {
                const res = await fetch("/api/auth/forgot-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
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
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@restaurant.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300"
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
