"use client";

import { defaultRedirectForRole, ROLES, roleLabel, useApp } from "@/context/AppProviders";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ROLE_INFO = [
  { role: "admin", label: "Admin", desc: "Full access to all modules, settings, and staff.", icon: "👑" },
  { role: "manager", label: "Manager", desc: "Operations control — orders, inventory, and reporting.", icon: "👤" },
  { role: "waiter", label: "Waiter", desc: "POS, tables, and order management.", icon: "🍽️" },
  { role: "chef", label: "Chef", desc: "Kitchen display and order queue.", icon: "👨‍🍳" },
];

const inputCls = "mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20";

export default function SignupPage() {
  const { user, hydrated, login } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  console.log("user details ", name, email, password, role, restaurantName)

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, restaurantName }),
      });
      console.log("data")
      const data = await res.json();
      console.log("data", data)
      if (!data.success) {
        setError(data.error ?? "Signup failed.");
        setLoading(false);
        return;
      }
      // Directly login after signup
      const dest = login(data.user.email, data.user.role, data.user.name);
      router.push(dest);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  /* ── Signup form ── */
  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">Create account</h1>
        <p className="mt-1 text-sm text-zinc-500">Restaurant Management System</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Name</label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.com" className={inputCls} />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className={inputCls} />
            </div>
            <div>
              <label htmlFor="role" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Role</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}
                className={`cursor-pointer ${inputCls}`}>
                {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
            {role === "admin" && (
              <div>
                <label htmlFor="restaurantName" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Restaurant Name <span className="text-red-400">*</span>
                </label>
                <input id="restaurantName" required value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. The Grand Kitchen" className={inputCls} />
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}
            <button type="submit" disabled={loading}
              className="cursor-pointer w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300">Login</Link>
          </p>
        </div>

        {/* Role info */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Role Access</h2>
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">4 Roles</span>
          </div>
          <p className="mb-4 text-xs text-zinc-500">Select a role above to set your access level.</p>
          <div className="space-y-2">
            {ROLE_INFO.map((r) => (
              <button key={r.role} type="button" onClick={() => setRole(r.role)}
                className={`cursor-pointer w-full rounded-xl border p-3 text-left transition-all duration-200 ${role === r.role
                  ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/25"
                  : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/60"
                  }`}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-800 text-lg ring-1 ring-zinc-700">{r.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${role === r.role ? "text-emerald-300" : "text-zinc-100"}`}>{r.label}</p>
                    <p className="text-xs text-zinc-500">{r.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
