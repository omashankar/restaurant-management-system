"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizePhoneForOtp } from "@/lib/phoneUtils";
import { useCallback, useEffect, useState } from "react";

const OTP_TTL_SEC = 120;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { refreshAuth } = useCustomer();
  const { link } = useRestaurantSlug();
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
    const raw = params.get("phone") ?? "";
    setPhone(normalizePhoneForOtp(raw) || raw);
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
      if (!res.ok || !data?.success) { setError(data?.error ?? "Could not resend code."); return; }
      if (data.devOtp) setDevHint(`Dev OTP: ${data.devOtp}`);
      setCooldown(OTP_TTL_SEC);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setResendLoading(false);
    }
  }, [phone, cooldown]);

  const verify = async () => {
    if (otp.trim().length < 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) { setError(data?.error ?? "That code didn't work."); return; }
      await refreshAuth();
      router.push(link(nextPath));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mm = Math.floor(cooldown / 60);
  const ss = String(cooldown % 60).padStart(2, "0");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="overflow-hidden rounded-3xl border border-customer-border bg-white shadow-2xl shadow-[var(--customer-primary-shadow)]/8">
          <div className="h-1.5 w-full gradient-primary" />
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-3">
                <RestaurantLogo size="lg" mode="light" imageOnly className="mx-auto" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#22C55E]/15"
              >
                <ShieldCheck className="size-6 text-[#22C55E]" />
              </motion.div>
              <h1 className="font-poppins text-2xl font-bold text-customer-text">Verify OTP</h1>
              <p className="mt-1 text-sm text-customer-muted">
                Code sent to <span className="font-semibold text-customer-text">{phone || "your phone"}</span>
              </p>
              <p className="text-xs text-customer-muted">Expires in 2 minutes</p>
            </div>

            {/* Errors */}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </motion.div>
            )}
            {devHint && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mb-4 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 px-4 py-3 text-xs text-[#92400E]">
                {devHint}
              </motion.div>
            )}

            {/* OTP Input */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-customer-muted">
                  6-Digit Code
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  className="min-h-[56px] w-full rounded-xl border border-customer-border bg-white text-center font-poppins text-2xl font-bold tracking-[0.5em] text-customer-text outline-none transition-all placeholder:text-customer-muted focus:border-customer-primary/50 focus:ring-2 focus:ring-[var(--customer-primary)]/10"
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={verify}
                disabled={loading || !phone}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl gradient-primary text-sm font-bold text-white shadow-lg shadow-[var(--customer-primary-shadow)]/25 disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {loading ? "Verifying..." : "Verify & Continue"}
              </motion.button>

              {/* Resend + Back */}
              <div className="flex flex-col items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendLoading || cooldown > 0 || !phone}
                  className="font-semibold text-customer-primary disabled:text-customer-muted hover:underline disabled:no-underline"
                >
                  {resendLoading ? (
                    <span className="flex items-center gap-1"><Loader2 className="size-3.5 animate-spin" /> Sending…</span>
                  ) : cooldown > 0 ? (
                    `Resend code in ${mm}:${ss}`
                  ) : (
                    "Resend code"
                  )}
                </button>
                <Link href={link("/account/login")}
                  className="flex items-center gap-1 text-customer-muted transition-colors hover:text-customer-text">
                  <ArrowLeft className="size-3.5" /> Use a different number
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
