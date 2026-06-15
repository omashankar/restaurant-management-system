"use client";

import CustomerAuthLayout from "@/components/customer/CustomerAuthLayout";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { customerClasses, customerPage } from "@/lib/customerTheme";
import { normalizePhoneForOtp } from "@/lib/phoneUtils";
import {
  clearCustomerDevOtp,
  readCustomerDevOtp,
  storeCustomerDevOtp,
} from "@/lib/customerDevOtp";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [smsPending, setSmsPending] = useState(false);
  const [nextPath, setNextPath] = useState("/account/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("phone") ?? "";
    const normalized = normalizePhoneForOtp(raw) || raw;
    setPhone(normalized);
    const next = params.get("next");
    if (next && next.startsWith("/")) setNextPath(next);
    if (params.get("sms") === "0") setSmsPending(true);

    const devOtp = readCustomerDevOtp(normalized);
    if (devOtp) {
      setDevHint(`Development OTP: ${devOtp} (SMS provider not configured)`);
    }
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
      if (data.devOtp) {
        storeCustomerDevOtp(phone, data.devOtp);
        setDevHint(`Development OTP: ${data.devOtp} (SMS provider not configured)`);
      }
      setSmsPending(data.smsSent === false);
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
        setError(data?.error ?? "That code didn't work.");
        return;
      }
      await refreshAuth();
      clearCustomerDevOtp();
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
    <CustomerAuthLayout>
      <div className="ct-auth-card__body">
        <div className="ct-auth-panel">
          <div className="ct-auth-heading ct-auth-heading--center">
            <div className="ct-auth-verify-icon">
              <ShieldCheck className="size-6" aria-hidden />
            </div>
            <h1 className="ct-auth-heading__title">Verify your code</h1>
            <p className="ct-auth-heading__sub">
              Enter the 6-digit OTP sent to{" "}
              <span className="font-semibold text-customer-text">{phone || "your phone"}</span>
            </p>
            <p className="mt-1 text-xs text-customer-muted">Code expires in 2 minutes</p>
          </div>

        <form
          className="ct-auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={customerClasses.alertError}
              role="alert"
            >
              {error}
            </motion.div>
          )}
          {devHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={customerClasses.alertWarning}
            >
              {devHint}
            </motion.div>
          )}
          {!devHint && smsPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={customerClasses.alertWarning}
              role="status"
            >
              SMS was not sent. Ask your restaurant admin to enable SMS in Super Admin → Settings → SMS
              (Fast2SMS or Twilio).
            </motion.div>
          )}

          <div className="ct-auth-field">
            <label className={customerPage.label} htmlFor="verify-otp">
              One-time password
            </label>
            <input
              id="verify-otp"
              type="tel"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="ct-auth-otp-input"
              placeholder="••••••"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !phone}
            className={`ct-auth-submit ${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-60`}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {loading ? "Verifying..." : "Verify & continue"}
          </motion.button>

          <div className="flex flex-col items-center gap-1 text-sm">
            <button
              type="button"
              onClick={resendOtp}
              disabled={resendLoading || cooldown > 0 || !phone}
              className="min-h-[44px] font-semibold text-customer-primary disabled:text-customer-muted hover:underline disabled:no-underline"
            >
              {resendLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="size-3.5 animate-spin" /> Sending…
                </span>
              ) : cooldown > 0 ? (
                `Resend code in ${mm}:${ss}`
              ) : (
                "Resend code"
              )}
            </button>
            <Link
              href={link("/account/login")}
              className="flex min-h-[44px] items-center gap-1.5 text-customer-muted transition-colors hover:text-customer-text"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to login
            </Link>
          </div>
        </form>
        </div>
      </div>
    </CustomerAuthLayout>
  );
}
