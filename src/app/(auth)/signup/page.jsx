"use client";

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import {
  authBtnPrimaryCls,
  authInputCls,
  authInputGroupCls,
  authInputInlineCls,
  authLinkCls,
  authLogoBadgeCls,
  authSuccessBoxCls,
} from "@/config/authTheme";
import PasswordInput from "@/components/ui/PasswordInput";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  DEFAULT_SIGNUP_PASSWORD_SECURITY,
  getSignupFieldErrors,
} from "@/lib/formValidation";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fieldErrorCls = "mt-1 text-xs text-red-400";

const EMPTY_FIELD_ERRORS = {
  restaurantName: "",
  slug: "",
  name: "",
  email: "",
  phone: "",
  password: "",
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className={fieldErrorCls} role="alert">{message}</p>;
}

export default function SignupPage() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [successMsg, setSuccessMsg] = useState("");

  const passwordHint = `At least ${DEFAULT_SIGNUP_PASSWORD_SECURITY.minPasswordLength} characters, with a number and special character.`;

  const handleRestaurantNameChange = (val) => {
    setRestaurantName(val);
    if (!slugManuallyEdited) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
    if (fieldErrors.restaurantName) {
      setFieldErrors((prev) => ({ ...prev, restaurantName: "" }));
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  const clearFieldError = (key) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const errors = getSignupFieldErrors({
      name,
      email,
      phone,
      password,
      restaurantName,
      slug,
    });
    setFieldErrors(errors);

    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setError(firstError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone,
          password,
          restaurantName: restaurantName.trim(),
          slug,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Signup failed.");
        return;
      }

      if (data.requiresVerification) {
        setSuccessMsg(data.message ?? "Account created. Please verify your email.");
        router.push(`/login?email=${encodeURIComponent(email.trim())}&verify=1`);
        return;
      }

      router.push("/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0 w-full max-w-md">
      <div className="mb-6 text-center sm:mb-8">
        <span className={authLogoBadgeCls}>
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 break-words text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Create account</h1>
        <p className="mt-1 text-sm text-zinc-500">Restaurant Management System</p>
      </div>

      <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="restaurantName" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Restaurant Name <span className="text-red-400">*</span>
            </label>
            <input
              id="restaurantName"
              value={restaurantName}
              onChange={(e) => handleRestaurantNameChange(e.target.value)}
              placeholder="e.g. The Grand Kitchen"
              className={authInputCls}
              aria-invalid={fieldErrors.restaurantName ? true : undefined}
            />
            <FieldError message={fieldErrors.restaurantName} />
          </div>

          <div>
            <label htmlFor="slug" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Customer Site URL <span className="text-red-400">*</span>
            </label>
            <div className={authInputGroupCls}>
              <span className="flex shrink-0 items-center border-r border-zinc-700 bg-zinc-800/80 px-2.5 py-3 text-[11px] leading-none text-zinc-500 sm:px-3 sm:text-xs">
                <span className="hidden sm:inline">yoursite.com/r/</span>
                <span className="sm:hidden">/r/</span>
              </span>
              <input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  clearFieldError("slug");
                }}
                placeholder="the-grand-kitchen"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                aria-invalid={fieldErrors.slug ? true : undefined}
              />
            </div>
            <p className="mt-1 break-words text-[11px] text-zinc-600">
              Yahi URL customers use karenge. Sirf lowercase letters, numbers aur hyphens.
            </p>
            <FieldError message={fieldErrors.slug} />
          </div>

          <div>
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              placeholder="Alex Rivera"
              className={authInputCls}
              aria-invalid={fieldErrors.name ? true : undefined}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Enter Email <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              placeholder="you@restaurant.com"
              className={authInputCls}
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          <PhoneInput
            id="phone"
            label="Phone (optional)"
            labelClassName="text-xs font-medium uppercase tracking-wider text-zinc-500"
            value={phone}
            onChange={(digits) => {
              setPhone(digits);
              clearFieldError("phone");
            }}
            error={fieldErrors.phone || undefined}
          />

          <PasswordInput
            id="password"
            label="Password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              clearFieldError("password");
            }}
            placeholder="Min 8 characters"
            inputClassName={`${authInputInlineCls} px-4 py-3 pr-11`}
            hint={passwordHint}
            error={fieldErrors.password || undefined}
          />

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
          {successMsg && (
            <p className={authSuccessBoxCls}>
              {successMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={authBtnPrimaryCls}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className={authLinkCls}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
