"use client";

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { Copy, Eye, EyeOff, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DEMO_USERS = [
  { role: "Admin", email: "admin@restaurant.com", password: "password123", icon: "👑", accent: "ring-amber-500/30 hover:ring-amber-500/60" },
  { role: "Manager", email: "manager@restaurant.com", password: "password123", icon: "👤", accent: "ring-violet-500/30 hover:ring-violet-500/60" },
  { role: "Waiter", email: "waiter@restaurant.com", password: "password123", icon: "🍽️", accent: "ring-sky-500/30 hover:ring-sky-500/60" },
  { role: "Chef", email: "chef@restaurant.com", password: "password123", icon: "👨‍🍳", accent: "ring-emerald-500/30 hover:ring-emerald-500/60" },
];

export default function LoginPage() {
  const { user, hydrated, login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();

      if (data.success) {
        const dest = login(data.user.email, data.user.role, data.user.name);
        router.push(dest);
        return;
      }

      // Email not verified — show special UI
      if (data.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
        return;
      }

      // Demo fallback (only for non-verified errors)
      const demo = DEMO_USERS.find((u) => u.email === email && u.password === password);
      if (demo) { router.push(login(demo.email, demo.role.toLowerCase())); return; }

      setError(data.error ?? "Login failed.");
    } catch {
      const demo = DEMO_USERS.find((u) => u.email === email && u.password === password);
      if (demo) { router.push(login(demo.email, demo.role.toLowerCase())); return; }
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u) => { setEmail(u.email); setPassword(u.password); };

  const resendVerification = async () => {
    setResendMsg("");
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMsg(data.success
        ? "✅ " + data.message
        : "❌ " + (data.error ?? "Failed to resend.")
      );
    } catch {
      setResendMsg("❌ Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };
  const copyDemo = (u) => {
    navigator.clipboard.writeText(`${u.email} / ${u.password}`).catch(() => { });
    setCopied(u.role);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
          Restaurant Management System
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your workspace</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Login form ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="you@restaurant.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pr-11 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}
            {unverified && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-amber-300">
                  📧 Email not verified
                </p>
                <p className="text-xs text-amber-400/80">
                  Please check your inbox and click the verification link before logging in.
                </p>
                {resendMsg && (
                  <p className={`text-xs font-medium ${resendMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
                    {resendMsg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendLoading}
                  className="cursor-pointer text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? "Sending…" : "Resend verification email →"}
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="cursor-pointer size-4 rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
              />
              <label htmlFor="rememberMe" className="cursor-pointer text-xs text-zinc-400">
                Remember me for 30 days
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-500">
            No account?{" "}
            <Link href="/signup" className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300">
              Create account
            </Link>
          </p>
        </div>

        {/* ── Demo credentials ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Demo Credentials</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Demo Mode
            </span>
          </div>
          <p className="mb-4 text-xs text-zinc-500">
            Click any card to auto-fill, or copy credentials.
          </p>
          <div className="space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => fillDemo(u)}
                className={`cursor-pointer w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-left ring-1 transition-all duration-200 hover:bg-zinc-800/60 ${u.accent}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-800 text-lg ring-1 ring-zinc-700">
                      {u.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{u.role}</p>
                      <p className="text-xs text-zinc-500">{u.email}</p>
                      <p className="text-xs text-zinc-600">Password: {u.password}</p>
                    </div>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); copyDemo(u); }}
                    className="cursor-pointer shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                  >
                    {copied === u.role
                      ? <span className="text-[10px] font-bold text-emerald-400">✓</span>
                      : <Copy className="size-3.5" />}
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
