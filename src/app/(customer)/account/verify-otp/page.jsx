"use client";

import { useCustomer } from "@/context/CustomerContext";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const OTP_TTL_SEC = 120;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { refreshAuth } = useCustomer();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(OTP_TTL_SEC);
  const [devHint, setDevHint] = useState("");
  const [nextPath, setNextPath] = useState("/account/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPhone(params.get("phone") ?? "");
    const next = params.get("next");
    if (next && next.startsWith("/")) setNextPath(next);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resendOtp = useCallback(async () => {
    if (!phone || cooldown > 0) return;
    setResendLoading(true);
    setError("");
    setDevHint("");
    try {
      const res = await fetch("/api/customer/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Could not resend code.");
        return;
      }
      if (data.devOtp) setDevHint(`Dev OTP: ${data.devOtp}`);
      setCooldown(OTP_TTL_SEC);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setResendLoading(false);
    }
  }, [phone, cooldown]);

  const verify = async () => {
    if (otp.trim().length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "That code didn’t work.");
        return;
      }
      await refreshAuth();
      router.push(nextPath);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mm = Math.floor(cooldown / 60);
  const ss = String(cooldown % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-3 inline-flex rounded-xl bg-emerald-500/10 p-2 text-emerald-700">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Enter verification code</h1>
        <p className="mt-1 text-sm text-zinc-600">
          We sent a code to <span className="font-semibold text-zinc-900">{phone || "your phone"}</span>. Codes expire in 2 minutes.
        </p>

        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p> : null}
        {devHint ? <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{devHint}</p> : null}

        <div className="mt-5">
          <label className="block text-xs font-medium text-zinc-600">6-digit code</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>

        <button
          type="button"
          onClick={verify}
          disabled={loading || !phone}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Verify & continue
        </button>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            onClick={resendOtp}
            disabled={resendLoading || cooldown > 0 || !phone}
            className="font-medium text-emerald-700 disabled:text-zinc-400 hover:underline disabled:no-underline"
          >
            {resendLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Sending…
              </span>
            ) : cooldown > 0 ? (
              `Resend code in ${mm}:${ss}`
            ) : (
              "Resend code"
            )}
          </button>
          <Link href="/account/login" className="text-zinc-600 hover:text-zinc-900 hover:underline">
            Use a different number
          </Link>
        </div>
      </div>
    </div>
  );
}
