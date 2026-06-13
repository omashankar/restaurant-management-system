"use client";

import { raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import { useSuperAdminLocale } from "@/context/SuperAdminLocaleContext";
import { useUser } from "@/context/AuthContext";
import {
  Activity, BarChart3, Building2, CheckCircle2,
  ChevronRight, Clock, Inbox, Plus, RefreshCw,
  Settings, Shield, UserCheck, Users, XCircle,
} from "lucide-react";
import { formatSaMoney } from "@/lib/formatSaMoney";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function StatCard({ label, value, sub, icon: Icon, color, bg, border }) {
  return (
    <div className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className={`mt-2 text-xl font-bold tabular-nums break-words sm:text-2xl lg:text-3xl ${color}`}>{value}</p>
          {sub && <p className="mt-1 break-words text-xs admin-surface-faint">{sub}</p>}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${bg}`}>
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
  const { formatTime, formatDateTime } = useSuperAdminLocale();
  const [stats, setStats]             = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loadError, setLoadError]     = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch("/api/super-admin/stats");
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setLastRefresh(data?.stats?.generatedAt ? new Date(data.stats.generatedAt) : new Date());
      } else {
        setLoadError(data?.error ?? "Failed to load dashboard stats.");
      }
    } catch {
      setLoadError("Could not load dashboard stats.");
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 flex shrink-0 items-center justify-center ${saIconBadgeCls} sm:size-11`}>
            <Shield className="size-5 sm:size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-bold tracking-tight sm:text-2xl">
              {greeting}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-0.5 break-words text-sm admin-surface-muted">
              Super Admin · Full system access
              {lastRefresh && (
                <span className="block sm:ml-2 sm:inline text-zinc-700">
                  · Updated {formatTime(lastRefresh)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className={raPageRefreshBtnCls}
        >
          <RefreshCw className={`size-4 ${loading ? saSpinnerCls : ""}`} /> Refresh
        </button>
        </div>
      </div>

      {/* Stat cards */}
      {loadError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}
      {loading && !stats ? (
        <SuperAdminPageSkeleton
          cards={5}
          cardClassName="h-28"
          cardCols="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          rows={0}
        />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Restaurants" value={stats?.totalRestaurants ?? 0} sub="Registered tenants"              icon={Building2} color="text-sa-primary" bg="bg-sa-primary-5" border="border-sa-primary-20" />
          <StatCard label="Restaurant Admins" value={stats?.totalAdmins ?? 0}      sub={`${stats?.activeAdmins ?? 0} active`} icon={Users}     color="text-amber-400"   bg="bg-amber-500/5"   border="border-amber-500/20"   />
          <StatCard label="Subscription Revenue" value={formatSaMoney(stats?.totalRevenue ?? 0)} sub="Platform SaaS · all time" icon={Activity} color="text-indigo-400" bg="bg-indigo-500/5" border="border-indigo-500/20" />
          <StatCard
            label="New Contact Messages"
            value={stats?.newContactMessages ?? 0}
            sub="Landing + customer site"
            icon={Inbox}
            color="text-sky-400"
            bg="bg-sky-500/5"
            border="border-sky-500/20"
          />
          <StatCard
            label="System Status"
            value={stats?.systemStatus === "online" ? "Online" : "Degraded"}
            sub={stats?.systemStatus === "online" ? "All services running" : "Some checks failed"}
            icon={UserCheck}
            color={stats?.systemStatus === "online" ? "text-sa-accent" : "text-amber-400"}
            bg={stats?.systemStatus === "online" ? "bg-sa-accent-5" : "bg-amber-500/5"}
            border={stats?.systemStatus === "online" ? "border-sa-accent-20" : "border-amber-500/20"}
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Recent Admins */}
        <div className="min-w-0 lg:col-span-2 admin-surface-card">
          <div className="flex min-w-0 flex-col gap-2 admin-surface-divider-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold admin-shell-text">Recent Restaurant Admins</h2>
              <p className="mt-0.5 text-xs admin-surface-muted">Latest registered admin accounts</p>
            </div>
            <Link
              href="/super-admin/restaurants"
              className="cursor-pointer flex shrink-0 items-center gap-1 text-xs font-medium text-sa-primary hover:text-sa-primary-muted"
            >
              View all <ChevronRight className="size-3.5" />
            </Link>
          </div>
          {loading && recentUsers.length === 0 ? (
            <div className="p-5">
              <SuperAdminPageSkeleton rows={5} rowClassName="h-10" />
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Users className="size-10 text-zinc-700" />
              <p className="text-sm admin-surface-faint">No restaurant admins yet.</p>
            </div>
          ) : (
            <div>
              {recentUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className={`flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-[var(--admin-hover)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5${idx > 0 ? " admin-surface-divider-t" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full admin-rank-badge text-xs font-bold admin-surface-body ring-1 ring-zinc-700">
                      {u.name?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium admin-shell-text">{u.name}</p>
                      <p className="truncate text-xs admin-surface-muted">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                    <RoleBadge role={u.role} />
                    {u.status === "active"
                      ? <CheckCircle2 className="size-4 text-sa-accent" />
                      : <XCircle className="size-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + System Info */}
        <div className="min-w-0 space-y-4">
          <div className="admin-surface-card p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold admin-shell-text">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/super-admin/restaurants",  label: "Add Restaurant", desc: "Register new tenant",    icon: Plus,     color: "text-sa-primary", bg: "bg-sa-primary-10" },
                { href: "/super-admin/payments",     label: "Subscription Payments", desc: "Plan payments from restaurants", icon: BarChart3,color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
                { href: "/super-admin/billing",      label: "Billing",        desc: "Subscription overview",  icon: Settings, color: "text-sky-400",     bg: "bg-sky-500/10"     },
                { href: "/super-admin/settings",     label: "Settings",       desc: "Configure system",       icon: Settings, color: "text-zinc-400",    bg: "bg-zinc-500/10"    },
              ].map(({ href, label, desc, icon: Icon, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="cursor-pointer flex min-w-0 items-center gap-3 rounded-xl border admin-shell-border p-3 transition-colors hover:border-sa-primary-40 hover:admin-shell-hover"
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`size-4 ${color}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium admin-shell-text">{label}</p>
                    <p className="line-clamp-2 text-xs admin-surface-faint">{desc}</p>
                  </div>
                  <ChevronRight className="ml-auto size-4 shrink-0 text-zinc-700" />
                </Link>
              ))}
            </div>
          </div>

          <div className="admin-surface-card p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold admin-shell-text">System Info</h2>
            <div className="space-y-3 text-xs">
              {[
                { label: "Version",      value: "1.0.0"          },
                { label: "Logged in as", value: user?.email ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0 text-zinc-500">{label}</span>
                  <span className="min-w-0 break-all text-right font-medium admin-surface-body">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-500">DB Status</span>
                <span className={`flex items-center gap-1.5 font-medium ${stats?.dbConnected ? "text-sa-accent" : "text-amber-400"}`}>
                  <span className={`size-1.5 rounded-full ${stats?.dbConnected ? "bg-sa-accent" : "bg-amber-500"}`} />
                  {stats?.dbConnected ? "Connected" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      {recentUsers.length > 0 && (
        <div className="min-w-0 admin-surface-card p-4 sm:p-5">
          <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2">
            <Clock className="size-4 shrink-0 text-zinc-500" />
            <h2 className="text-sm font-semibold admin-shell-text">Recent Activity</h2>
            <span className="rounded-full bg-[var(--admin-hover-strong)] px-2 py-0.5 text-[10px] font-semibold text-zinc-500 sm:ml-auto">
              admins only
            </span>
          </div>
          <ol className="space-y-4">
            {recentUsers.slice(0, 5).map((u, i) => (
              <li key={u.id} className="flex min-w-0 gap-3 sm:gap-4">
                <div className="relative flex shrink-0 flex-col items-center">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full admin-rank-badge text-xs font-bold text-zinc-400 ring-1 ring-zinc-700">
                    {u.name?.[0]?.toUpperCase()}
                  </span>
                  {i < 4 && <span className="mt-1 w-px flex-1 bg-[var(--admin-border-subtle)]" />}
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm admin-shell-text">
                    <span className="font-semibold">{u.name}</span>
                    <span className="admin-surface-faint">registered as</span>
                    <RoleBadge role={u.role} />
                  </p>
                  <p className="mt-0.5 text-xs admin-surface-faint">
                    {u.createdAt ? formatDateTime(u.createdAt) : "—"}
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
