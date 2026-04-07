"use client";

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, hydrated, login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  const onSubmit = (e) => {
    e.preventDefault();
    const dest = login(email);
    router.push(dest);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50">
          Restaurant Management System
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to your workspace
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="you@restaurant.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.99]"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link
            href="/signup"
            className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
