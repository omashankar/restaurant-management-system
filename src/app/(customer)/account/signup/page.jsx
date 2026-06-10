"use client";

import CustomerMobileInput from "@/components/customer/CustomerMobileInput";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { extractIndianMobileDigits, isValidIndianMobile } from "@/lib/phoneUtils";
import { customerClasses, customerPage } from "@/lib/customerTheme";
import { motion } from "framer-motion";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerSignupPage() {
  const router = useRouter();
  const { link } = useRestaurantSlug();
  const { refreshAuth } = useCustomer();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const digits = extractIndianMobileDigits(phone);
    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const phonePayload = digits && isValidIndianMobile(digits) ? `+91${digits}` : "";

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth/signup-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          ...(phonePayload ? { phone: phonePayload } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Signup failed.");
        return;
      }
      await refreshAuth();
      router.push(link("/account/dashboard"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="ct-elevation-overlay w-full max-w-md overflow-hidden rounded-3xl border border-customer-border bg-[var(--customer-card)]"
      >
        <div className="h-1.5 gradient-primary" />
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <RestaurantLogo size="lg" mode="light" imageOnly className="mb-4" />
            <h1 className="font-poppins text-xl font-bold text-customer-text">Create Account</h1>
            <p className="mt-1 text-sm text-customer-muted">Sign up with email and password</p>
          </div>

          {error && (
            <div className={`mb-4 ${customerClasses.alertError}`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {[
              { id: "signup-name", label: "Full name", type: "text", value: name, onChange: setName },
              { id: "signup-email", label: "Email", type: "email", value: email, onChange: setEmail },
              { id: "signup-password", label: "Password", type: "password", value: password, onChange: setPassword },
            ].map(({ id, label, type, value, onChange }) => (
              <div key={id}>
                <label htmlFor={id} className={customerPage.label}>
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className={customerClasses.field}
                />
              </div>
            ))}
            <CustomerMobileInput
              id="signup-mobile"
              label="Mobile (optional)"
              value={phone}
              onChange={setPhone}
              labelClassName="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-customer-muted"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={loading}
              onClick={submit}
              className={`${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-60`}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {loading ? "Creating account..." : "Sign up"}
            </motion.button>
          </div>

          <p className="mt-6 text-center text-sm text-customer-muted">
            Already have an account?{" "}
            <Link href={link("/account/login")} className="font-semibold text-customer-primary hover:underline">
              Login with OTP
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
