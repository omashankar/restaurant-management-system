"use client";

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputCls = "mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20";

export default function SignupPage() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, restaurantName }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Signup failed.");
        return;
      }

      if (data.requiresVerification) {
        setSuccessMsg(data.message ?? "Account created. Please verify your email.");
        router.push(`/login?email=${encodeURIComponent(email)}&verify=1`);
        return;
      }

      router.push("/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Signup form ── */
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">Create account</h1>
        <p className="mt-1 text-sm text-zinc-500">Restaurant Management System</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="restaurantName" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Restaurant Name <span className="text-red-400">*</span>
            </label>
            <input
              id="restaurantName"
              required
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g. The Grand Kitchen"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your Name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Enter Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className={inputCls} />
          </div>
          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}
          {successMsg && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{successMsg}</p>
          )}
          <button type="submit" disabled={loading}
            className="cursor-pointer w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
