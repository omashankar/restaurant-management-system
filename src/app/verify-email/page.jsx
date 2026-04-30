"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState({ loading: true, success: false, message: "Verifying your email..." });

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!token) {
        setState({ loading: false, success: false, message: "Missing verification token." });
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.success) {
          setState({
            loading: false,
            success: false,
            message: data?.error ?? "Verification failed.",
          });
          return;
        }
        setState({
          loading: false,
          success: true,
          message: "Email verified successfully. You can now login.",
        });
      } catch {
        if (!cancelled) {
          setState({ loading: false, success: false, message: "Network error. Please try again." });
        }
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
        <h1 className="text-xl font-semibold text-zinc-50">Email Verification</h1>
        <p className={`mt-3 text-sm ${state.success ? "text-emerald-400" : "text-zinc-400"}`}>
          {state.loading ? "Please wait..." : state.message}
        </p>
        <div className="mt-6">
          <Link
            href={state.success ? "/login" : "/login"}
            className="cursor-pointer rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
