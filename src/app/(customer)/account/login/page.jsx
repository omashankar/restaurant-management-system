"use client";

import { useCustomer } from "@/context/CustomerContext";
import { ArrowLeft, Loader2, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

export default function CustomerLoginPage() {
  const router = useRouter();
  const { refreshAuth } = useCustomer();
  const [flow, setFlow] = useState("choose");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");

  const requestOtp = async () => {
    const normalized = phone.replace(/\s|-/g, "");
    if (!PHONE_REGEX.test(normalized)) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setLoading(true);
    setError("");
    setDevOtpHint("");
    try {
      const res = await fetch("/api/customer/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Could not send OTP.");
        return;
      }
      if (data.devOtp) {
        setDevOtpHint(`Dev OTP: ${data.devOtp}`);
      }
      const q = new URLSearchParams({ phone: normalized });
      router.push(`/account/verify-otp?${q.toString()}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const emailLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth/login-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Login failed.");
        return;
      }
      await refreshAuth();
      router.push("/account/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const emailSignup = async () => {
    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth/signup-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone.replace(/\s|-/g, "") || undefined,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Could not create account.");
        return;
      }
      await refreshAuth();
      router.push("/account/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Login or Sign Up</h1>
        <p className="mt-1 text-sm text-zinc-600">Use your phone or email — one account for orders and bookings.</p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
        ) : null}
        {devOtpHint ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{devOtpHint}</p>
        ) : null}

        {flow === "choose" ? (
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                setFlow("phone");
                setError("");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 shadow-sm transition hover:bg-emerald-400 active:scale-[0.99]"
            >
              <Phone className="size-4 shrink-0" aria-hidden />
              Continue with Phone
            </button>
            <button
              type="button"
              onClick={() => {
                setFlow("email-login");
                setError("");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 active:scale-[0.99]"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              Continue with Email
            </button>
            <div className="pt-4 text-center">
              <Link href="/order/menu" className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
                Continue as guest
              </Link>
            </div>
          </div>
        ) : null}

        {flow === "phone" ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setFlow("choose");
                setError("");
              }}
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </button>
            <label className="block text-xs font-medium text-zinc-600">Mobile number</label>
            <input
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none ring-emerald-500/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="+1 555 000 0000"
            />
            <p className="mt-2 text-xs text-zinc-500">We’ll text you a one-time code. New accounts are created automatically after verification.</p>
            <button
              type="button"
              disabled={loading}
              onClick={requestOtp}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Phone className="size-4" aria-hidden />}
              Send OTP
            </button>
          </div>
        ) : null}

        {flow === "email-login" ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setFlow("choose");
                setError("");
              }}
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </button>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={emailLogin}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Log in
            </button>
            <p className="mt-4 text-center text-sm text-zinc-600">
              New here?{" "}
              <button
                type="button"
                className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
                onClick={() => {
                  setFlow("email-signup");
                  setError("");
                }}
              >
                Create an account
              </button>
            </p>
          </div>
        ) : null}

        {flow === "email-signup" ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setFlow("email-login");
                setError("");
              }}
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to log in
            </button>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Phone (optional)</label>
                <input
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Links your dine-in & delivery orders"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={emailSignup}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Create account
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
