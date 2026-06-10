"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion } from "framer-motion";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import CustomerMobileInput from "@/components/customer/CustomerMobileInput";
import { extractIndianMobileDigits, isValidIndianMobile, normalizePhoneForOtp } from "@/lib/phoneUtils";
import { customerClasses } from "@/lib/customerTheme";
import { BadgeCheck, Loader2, Lock, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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
    const digits = extractIndianMobileDigits(phone);
    if (!isValidIndianMobile(digits)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    const normalized = normalizePhoneForOtp(digits);
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
    <div className="flex min-h-[100dvh] w-full min-w-0 items-center justify-center overflow-x-hidden px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="min-w-0 w-full max-w-md"
      >
        {/* Card */}
        <div className="ct-elevation-overlay overflow-hidden rounded-3xl border border-customer-border bg-[var(--customer-card)]">
          <div className="h-1.5 w-full gradient-primary" />

          <div className="p-5 sm:p-8">
            {/* Logo */}
            <div className="mb-6 flex flex-col items-center text-center">
              <motion.div whileHover={{ scale: 1.05 }} className="mb-4">
                <RestaurantLogo size="lg" mode="light" imageOnly className="mx-auto" />
              </motion.div>
              <h1 className="font-poppins break-words text-xl font-bold text-customer-text sm:text-2xl">Welcome Back</h1>
              <p className="mt-1 text-sm text-customer-muted">Login with your mobile number to continue</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 ${customerClasses.alertError}`}
              >
                {error}
              </motion.div>
            )}
            {devOtpHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mb-4 ${customerClasses.alertWarning}`}
              >
                {devOtpHint}
              </motion.div>
            )}

            {/* Phone input */}
            <div className="space-y-4">
              <div onKeyDown={(e) => e.key === "Enter" && requestOtp()}>
                <CustomerMobileInput
                  id="login-mobile"
                  label="Mobile number"
                  required
                  value={phone}
                  onChange={setPhone}
                  labelClassName="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-customer-muted"
                />
                <p className="mt-1.5 text-xs text-customer-muted">
                  We&apos;ll send a one-time code. New accounts are created automatically.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={loading}
                onClick={requestOtp}
                className={`${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-60`}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {loading ? "Sending OTP..." : "Send OTP"}
              </motion.button>

              <div className="space-y-2 text-center">
                <Link
                  href={link("/account/signup")}
                  className="block text-sm font-medium text-customer-primary hover:underline"
                >
                  Create account with email
                </Link>
                <Link
                  href={link("/order/menu")}
                  className="block text-sm font-medium text-customer-muted underline-offset-2 transition-colors hover:text-customer-primary hover:underline"
                >
                  Browse menu without account →
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-customer-border" />
              <span className="text-xs text-customer-muted">Secure & Fast</span>
              <div className="h-px flex-1 bg-customer-border" />
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-customer-muted sm:gap-6">
              <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> Encrypted</span>
              <span className="flex items-center gap-1.5"><Zap className="size-3.5" /> Instant</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="size-3.5" /> Verified</span>
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
        <Loader2 className="size-8 animate-spin text-customer-primary" />
      </div>
    }>
      <CustomerLoginContent />
    </Suspense>
  );
}
