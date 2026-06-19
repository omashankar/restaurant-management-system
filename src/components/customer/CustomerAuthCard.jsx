"use client";

import CustomerAuthLayout from "@/components/customer/CustomerAuthLayout";
import CustomerMobileInput from "@/components/customer/CustomerMobileInput";
import { isValidEmail } from "@/lib/customerFormValidation";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { extractIndianMobileDigits, isValidIndianMobile, normalizePhoneForOtp } from "@/lib/phoneUtils";
import { storeCustomerDevOtp } from "@/lib/customerDevOtp";
import { customerClasses, customerPage } from "@/lib/customerTheme";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const AUTH_TABS = [
  { id: "login", label: "Login" },
  { id: "register", label: "Register" },
];

const LOGIN_HEADINGS = {
  otp: {
    title: "Sign in with mobile",
    subtitle: "We'll text you a 6-digit code. New customers are registered automatically.",
  },
  email: {
    title: "Sign in with email",
    subtitle: "Use the email and password from your registration.",
  },
};

const LOGIN_METHODS = [
  { id: "otp", label: "Mobile OTP", icon: Phone },
  { id: "email", label: "Email", icon: Mail },
];

function AuthAlert({ type = "error", children }) {
  const cls =
    type === "warning" ? customerClasses.alertWarning : customerClasses.alertError;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cls}
      role="alert"
    >
      {children}
    </motion.div>
  );
}

function AuthHeading({ title, subtitle }) {
  return (
    <div className="ct-auth-heading">
      <h2 className="ct-auth-heading__title">{title}</h2>
      {subtitle ? <p className="ct-auth-heading__sub">{subtitle}</p> : null}
    </div>
  );
}

function AuthMethodToggle({ methods, value, onChange }) {
  return (
    <div className="ct-auth-method-toggle" role="tablist" aria-label="Login method">
      {methods.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`ct-auth-method-btn ${active ? "ct-auth-method-btn--active" : ""}`}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LoginOtpForm({ nextPath }) {
  const router = useRouter();
  const { link } = useRestaurantSlug();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async () => {
    const digits = extractIndianMobileDigits(phone);
    if (!isValidIndianMobile(digits)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    const normalized = normalizePhoneForOtp(digits);
    setLoading(true);
    setError("");
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
      if (data.devOtp) storeCustomerDevOtp(normalized, data.devOtp);
      const q = new URLSearchParams({ phone: normalized, next: nextPath });
      if (data.smsSent === false) q.set("sms", "0");
      router.push(link(`/account/verify-otp?${q.toString()}`));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="ct-auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        requestOtp();
      }}
    >
      <div className="ct-auth-fields">
        <CustomerMobileInput
          id="login-mobile"
          label="Mobile number"
          required
          value={phone}
          onChange={setPhone}
          labelClassName={customerPage.label}
        />
      </div>

      {error && <AuthAlert>{error}</AuthAlert>}

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className={`ct-auth-submit ${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-60`}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {loading ? "Sending OTP..." : "Send OTP"}
      </motion.button>
    </form>
  );
}

function LoginEmailForm({ nextPath }) {
  const router = useRouter();
  const { link } = useRestaurantSlug();
  const { refreshAuth } = useCustomer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth/login-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Invalid email or password.");
        return;
      }
      await refreshAuth();
      router.push(link(nextPath));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="ct-auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <div className="ct-auth-fields">
        <div className="ct-auth-field">
          <label htmlFor="login-email" className={customerPage.label}>
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={customerClasses.field}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="ct-auth-field">
          <label htmlFor="login-password" className={customerPage.label}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={customerClasses.field}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className={`ct-auth-submit ${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-60`}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        {loading ? "Signing in..." : "Sign in"}
      </motion.button>
    </form>
  );
}

function LoginPanel({ nextPath }) {
  const [method, setMethod] = useState("otp");
  const heading = LOGIN_HEADINGS[method];

  return (
    <div className="ct-auth-panel">
      <AuthMethodToggle methods={LOGIN_METHODS} value={method} onChange={setMethod} />

      <AuthHeading title={heading.title} subtitle={heading.subtitle} />

      <AnimatePresence mode="wait">
        <motion.div
          key={method}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {method === "otp" ? (
            <LoginOtpForm nextPath={nextPath} />
          ) : (
            <LoginEmailForm nextPath={nextPath} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function RegisterPanel() {
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
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
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
    <div className="ct-auth-panel">
      <AuthHeading
        title="Create your account"
        subtitle="Fill in your details — you can add mobile later for OTP login."
      />

      <form
        className="ct-auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {error && <AuthAlert>{error}</AuthAlert>}

        <div className="ct-auth-fields">
          <div className="ct-auth-field">
            <label htmlFor="signup-name" className={customerPage.label}>
              Full name <span className="text-customer-primary">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={customerClasses.field}
              autoComplete="name"
              placeholder="Your name"
            />
          </div>

          <div className="ct-auth-field">
            <label htmlFor="signup-email" className={customerPage.label}>
              Email address <span className="text-customer-primary">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={customerClasses.field}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="ct-auth-field">
            <label htmlFor="signup-password" className={customerPage.label}>
              Password <span className="text-customer-primary">*</span>
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={customerClasses.field}
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="ct-auth-field">
            <CustomerMobileInput
              id="signup-mobile"
              label="Mobile (optional)"
              value={phone}
              onChange={setPhone}
              labelClassName={customerPage.label}
            />
            <p className="ct-auth-hint">Add mobile to enable OTP login later.</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className={`ct-auth-submit ${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-60`}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {loading ? "Creating account..." : "Create account"}
        </motion.button>
      </form>
    </div>
  );
}

function AuthTrustRow() {
  return (
    <div className="ct-auth-trust">
      <span>
        <Lock className="size-3.5" aria-hidden /> Encrypted
      </span>
      <span>
        <Zap className="size-3.5" aria-hidden /> Instant OTP
      </span>
      <span>
        <BadgeCheck className="size-3.5" aria-hidden /> Verified
      </span>
    </div>
  );
}

function CustomerAuthCardContent() {
  const params = useSearchParams();
  const { link } = useRestaurantSlug();
  const tabParam = params.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam === "register" ? "register" : "login");
  const nextPath = params.get("next")?.startsWith("/") ? params.get("next") : "/account/dashboard";

  useEffect(() => {
    setActiveTab(tabParam === "register" ? "register" : "login");
  }, [tabParam]);

  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    if (tabId === "register") {
      url.searchParams.set("tab", "register");
    } else {
      url.searchParams.delete("tab");
    }
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  return (
    <CustomerAuthLayout>
      <div className="ct-auth-card__body">
        <div className="ct-auth-tabs" role="tablist" aria-label="Login or register">
          {AUTH_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => switchTab(tab.id)}
              className={`ct-auth-tab ${activeTab === tab.id ? "ct-auth-tab--active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "register" ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "register" ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col"
          >
            {activeTab === "login" ? (
              <LoginPanel nextPath={nextPath} />
            ) : (
              <RegisterPanel />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="ct-auth-card__footer">
          <Link
            href={link("/order/menu")}
            className="ct-auth-guest-link"
          >
            Continue as guest →
          </Link>
          <AuthTrustRow />
        </div>
      </div>
    </CustomerAuthLayout>
  );
}

export default function CustomerAuthCard() {
  return (
    <Suspense
      fallback={
        <div className="ct-auth-page flex min-h-[80vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-customer-primary" />
        </div>
      }
    >
      <CustomerAuthCardContent />
    </Suspense>
  );
}
