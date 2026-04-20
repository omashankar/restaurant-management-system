"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useUser } from "@/context/AuthContext";
import {
  Activity, BarChart3, Building2, CheckCircle2,
  ChevronRight, Clock, Plus, RefreshCw,
  Settings, Shield, UserCheck, Users, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function StatCard({ label, value, sub, icon: Icon, color, bg, border }) {
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-600">{sub}</p>}
        </div>
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`size-5 ${color}`} />
        </span>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = {
    admin:   "bg-amber-500/15 text-amber-300 ring-amber-500/25",
    manager: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25",
    waiter:  "bg-sky-500/15 text-sky-300 ring-sky-500/25",
    chef:    "bg-orange-500/15 text-orange-300 ring-orange-500/25",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${cfg[role] ?? "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"}`}>
      {role}
    </span>
  );
}

function SuperAdminDashboard() {
  const { user } = useUser();
  const [stats, setStats]             = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/super-admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setLastRefresh(new Date());
      }
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25">
            <Shield className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              {greeting}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Super Admin · Full system access
              {lastRefresh && (
                <span className="ml-2 text-zinc-700">
                  · Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
        </div>
        <button type="button" onClick={fetchStats} disabled={loading}
          className="cursor-pointer flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-50">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      {loading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Restaurants" value={stats?.totalRestaurants ?? 0} sub="Registered tenants"              icon={Building2} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/20" />
          <StatCard label="Restaurant Admins" value={stats?.totalAdmins ?? 0}      sub={`${stats?.activeAdmins ?? 0} active`} icon={Users}     color="text-amber-400"   bg="bg-amber-500/5"   border="border-amber-500/20"   />
          <StatCard label="Active Admins"     value={stats?.activeAdmins ?? 0}     sub={`${stats?.inactiveAdmins ?? 0} inactive`} icon={UserCheck} color="text-indigo-400"  bg="bg-indigo-500/5"  border="border-indigo-500/20"  />
          <StatCard label="System Status"     value="Online"                       sub="All services running"             icon={Activity}  color="text-rose-400"    bg="bg-rose-500/5"    border="border-rose-500/20"    />
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Admins */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Recent Restaurant Admins</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Latest registered admin accounts</p>
            </div>
            <Link href="/super-admin/users"
              className="cursor-pointer flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
              View all <ChevronRight className="size-3.5" />
            </Link>
          </div>
          {loading && recentUsers.length === 0 ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-800/60" />
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Users className="size-10 text-zinc-700" />
              <p className="text-sm text-zinc-600">No restaurant admins yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 ring-1 ring-zinc-700">
                      {u.name?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{u.name}</p>
                      <p className="truncate text-xs text-zinc-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <RoleBadge role={u.role} />
                    {u.status === "active"
                      ? <CheckCircle2 className="size-4 text-emerald-500" />
                      : <XCircle className="size-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + System Info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/super-admin/restaurants", label: "Add Restaurant", desc: "Register new tenant",  icon: Plus,     color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { href: "/super-admin/users",       label: "View Users",     desc: "Manage all accounts", icon: Users,    color: "text-sky-400",     bg: "bg-sky-500/10"     },
                { href: "/super-admin/analytics",   label: "Analytics",      desc: "System-wide reports", icon: BarChart3,color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
                { href: "/super-admin/settings",    label: "Settings",       desc: "Configure system",    icon: Settings, color: "text-zinc-400",    bg: "bg-zinc-500/10"    },
              ].map(({ href, label, desc, icon: Icon, color, bg }) => (
                <Link key={href} href={href}
                  className="cursor-pointer flex items-center gap-3 rounded-xl border border-zinc-800 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-800/40">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`size-4 ${color}`} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100">{label}</p>
                    <p className="text-xs text-zinc-600">{desc}</p>
                  </div>
                  <ChevronRight className="ml-auto size-4 shrink-0 text-zinc-700" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">System Info</h2>
            <div className="space-y-3 text-xs">
              {[
                { label: "Version",      value: "1.0.0"          },
                { label: "Logged in as", value: user?.email ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-medium text-zinc-300 truncate max-w-[140px] text-right">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-500">DB Status</span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      {recentUsers.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="size-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-100">Recent Activity</h2>
            <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">admins only</span>
          </div>
          <ol className="space-y-4">
            {recentUsers.slice(0, 5).map((u, i) => (
              <li key={u.id} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400 ring-1 ring-zinc-700">
                    {u.name?.[0]?.toUpperCase()}
                  </span>
                  {i < 4 && <span className="mt-1 w-px flex-1 bg-zinc-800" />}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-sm text-zinc-200">
                    <span className="font-semibold">{u.name}</span> registered as <RoleBadge role={u.role} />
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                      : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <ProtectedRoute roles={["super_admin"]}>
      <SuperAdminDashboard />
    </ProtectedRoute>
  );
}
