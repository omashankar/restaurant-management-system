"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion } from "framer-motion";
import { Loader2, Phone, ShieldCheck, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

function CustomerLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { link } = useRestaurantSlug();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const nextPath = params.get("next")?.startsWith("/") ? params.get("next") : "/account/dashboard";

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
      if (data.devOtp) setDevOtpHint(`Dev OTP: ${data.devOtp}`);
      const q = new URLSearchParams({ phone: normalized, next: nextPath });
      router.push(link(`/account/verify-otp?${q.toString()}`));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-[#FFE4D6] bg-white shadow-2xl shadow-[#FF6B35]/8">
          <div className="h-1.5 w-full gradient-primary" />

          <div className="p-8">
            {/* Logo */}
            <div className="mb-6 flex flex-col items-center text-center">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="mb-4 flex size-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-[#FF6B35]/25"
              >
                <UtensilsCrossed className="size-8 text-white" />
              </motion.div>
              <h1 className="font-poppins text-2xl font-bold text-[#111827]">Welcome Back</h1>
              <p className="mt-1 text-sm text-[#6B7280]">Login with your mobile number to continue</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
              >
                {error}
              </motion.div>
            )}
            {devOtpHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 px-4 py-3 text-xs text-[#92400E]"
              >
                {devOtpHint}
              </motion.div>
            )}

            {/* Phone input */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                    className="min-h-[52px] w-full rounded-xl border border-[#FFE4D6] bg-white py-3 pl-11 pr-4 text-base text-[#111827] outline-none transition-all placeholder:text-[#6B7280] focus:border-[#FF6B35]/50 focus:ring-2 focus:ring-[#FF6B35]/10"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#6B7280]">
                  We&apos;ll send a one-time code. New accounts are created automatically.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={loading}
                onClick={requestOtp}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl gradient-primary text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 transition-all hover:shadow-xl disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {loading ? "Sending OTP..." : "Send OTP"}
              </motion.button>

              <div className="text-center">
                <Link
                  href={link("/order/menu")}
                  className="text-sm font-medium text-[#6B7280] underline-offset-2 transition-colors hover:text-[#FF6B35] hover:underline"
                >
                  Continue as guest →
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#FFE4D6]" />
              <span className="text-xs text-[#6B7280]">Secure & Fast</span>
              <div className="h-px flex-1 bg-[#FFE4D6]" />
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">🔒 Encrypted</span>
              <span className="flex items-center gap-1">⚡ Instant</span>
              <span className="flex items-center gap-1">✅ Verified</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#FF6B35]" />
      </div>
    }>
      <CustomerLoginContent />
    </Suspense>
  );
}
