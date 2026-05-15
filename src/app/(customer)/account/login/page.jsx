"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { Loader2, Phone } from "lucide-react";
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
      if (data.devOtp) {
        setDevOtpHint(`Dev OTP: ${data.devOtp}`);
      }
      const q = new URLSearchParams({ phone: normalized, next: nextPath });
      router.push(`/account/verify-otp?${q.toString()}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Login with Mobile OTP</h1>
        <p className="mt-1 text-sm text-zinc-600">Enter your phone number to continue checkout and track orders.</p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
        ) : null}
        {devOtpHint ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{devOtpHint}</p>
        ) : null}

          <div className="mt-6">
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
            <div className="pt-4 text-center">
              <Link href={link("/order/menu")} className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
                Continue as guest
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-emerald-600" aria-hidden />
        </div>
      }
    >
      <CustomerLoginContent />
    </Suspense>
  );
}
