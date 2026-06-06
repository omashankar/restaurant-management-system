"use client";

import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import SearchField from "@/components/ui/SearchField";
import PaginationBar from "@/components/ui/PaginationBar";
import { useToast } from "@/hooks/useToast";
import {
  Activity, AlertTriangle, Building2,
  ClipboardList,
  CreditCard, RefreshCw, Search, Settings,
  Shield, User, X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────────────────────
   CATEGORY CONFIG
───────────────────────────────────────── */
const CATEGORIES = [
  { id: "all",        label: "All",          Icon: ClipboardList, color: "text-zinc-400"   },
  { id: "restaurant", label: "Restaurants",  Icon: Building2,     color: "text-sa-accent"},
  { id: "user",       label: "Users",        Icon: User,          color: "text-amber-400"  },
  { id: "payment",    label: "Payments",     Icon: CreditCard,    color: "text-indigo-400" },
  { id: "billing",    label: "Billing",      Icon: Activity,      color: "text-sky-400"    },
  { id: "settings",   label: "Settings",     Icon: Settings,      color: "text-violet-400" },
  { id: "auth",       label: "Auth",         Icon: Shield,        color: "text-sa-primary"   },
  { id: "system",     label: "System",       Icon: AlertTriangle, color: "text-zinc-400"   },
];

const CATEGORY_STYLES = {
  restaurant: { bg: "bg-sa-accent-10", text: "text-sa-accent", ring: "ring-sa-accent-25", dot: "bg-sa-accent" },
  user:       { bg: "bg-amber-500/10",   text: "text-amber-400",   ring: "ring-amber-500/25",   dot: "bg-amber-500"   },
  payment:    { bg: "bg-indigo-500/10",  text: "text-indigo-400",  ring: "ring-indigo-500/25",  dot: "bg-indigo-500"  },
  billing:    { bg: "bg-sky-500/10",     text: "text-sky-400",     ring: "ring-sky-500/25",     dot: "bg-sky-500"     },
  settings:   { bg: "bg-violet-500/10",  text: "text-violet-400",  ring: "ring-violet-500/25",  dot: "bg-violet-500"  },
  auth:       { bg: "bg-sa-primary-10",    text: "text-sa-primary",    ring: "ring-sa-primary-25",    dot: "bg-sa-primary"    },
  system:     { bg: "bg-zinc-500/10",    text: "text-zinc-400",    ring: "ring-zinc-500/25",    dot: "bg-zinc-500"    },
};

function categoryStyle(cat) {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.system;
}

/* ─────────────────────────────────────────
   ACTION → human-readable label
───────────────────────────────────────── */
function actionLabel(action) {
  const map = {
    "restaurant.created":   "Restaurant created",
    "restaurant.updated":   "Restaurant updated",
    "restaurant.deleted":   "Restaurant deleted",
    "restaurant.activated": "Restaurant activated",
    "restaurant.deactivated":"Restaurant deactivated",
    "user.created":         "User created",
    "user.updated":         "User updated",
    "user.deleted":         "User deleted",
    "user.blocked":         "User blocked",
    "user.unblocked":       "User unblocked",
    "payment.recorded":     "Payment recorded",
    "payment.refunded":     "Payment refunded",
    "billing.plan_assigned":"Plan assigned",
    "billing.plan_cancelled":"Subscription cancelled",
    "billing.plan_renewed": "Subscription renewed",
    "billing.plan_created": "Plan created",
    "billing.plan_updated": "Plan updated",
    "billing.plan_deleted": "Plan deleted",
    "settings.updated":     "Settings updated",
    "auth.login":           "Admin logged in",
    "auth.logout":          "Admin logged out",
    "auth.failed":          "Login failed",
    "system.backup":        "Backup triggered",
    "system.cache_cleared": "Cache cleared",
  };
  return map[action] ?? action;
}

/* ─────────────────────────────────────────
   RELATIVE TIME
───────────────────────────────────────── */
function relativeTime(date) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function LogsPage() {
  const [logs, setLogs]               = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, pages: 1, total: 0 });
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [category, setCategory]       = useState("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const { showToast, ToastUI }        = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (category !== "all") params.set("category", category);
      if (search)             params.set("search", search);

      const res  = await fetch(`/api/super-admin/logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
        setCategoryCounts(data.categoryCounts ?? {});
      } else {
        const message = data.error ?? "Failed to load logs.";
        setLoadError(message);
        showToast(message, "error");
      }
    } catch {
      const message = "Network error.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, category, search, showToast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* Reset to page 1 when filters change */
  useEffect(() => { setPage(1); }, [category, search]);

  const totalCount = Object.values(categoryCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${saIconBadgeCls}`}>
            <ClipboardList className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-2xl font-semibold tracking-tight">Audit Logs</h1>
            <p className="admin-page-desc mt-1 text-sm">
              System activity and admin action history.
              <span className="mt-1 block tabular-nums text-zinc-600 sm:ml-2 sm:mt-0 sm:inline">
                {pagination.total.toLocaleString()} entries
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw className={`size-4 ${loading ? saSpinnerCls : ""}`} />
          Refresh
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      {/* ── Category filter tabs ── */}
      <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
        {CATEGORIES.map(({ id, label, Icon, color }) => {
          const count  = id === "all" ? totalCount : (categoryCounts[id] ?? 0);
          const active = id === category;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={`shrink-0 cursor-pointer flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "border-zinc-600 admin-surface-segment-btn-active admin-shell-text"
                  : "admin-shell-border admin-surface-card text-zinc-500 hover:admin-surface-body"
              }`}
            >
              <Icon className={`size-3.5 ${active ? color : ""}`} />
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                  active ? "admin-surface-segment-btn-active admin-surface-body" : "admin-surface-segment-btn"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search ── */}
      <SearchField
        className="min-w-0 w-full max-w-none sm:max-w-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search action, actor, target…"
        clearable
        inputClassName="focus-sa-primary"
      />

      {/* ── Log list ── */}
      {loading ? (
        <SuperAdminPageSkeleton rows={10} rowClassName="h-14" />
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-20 text-center">
          <ClipboardList className="size-10 text-zinc-700" />
          <p className="text-sm admin-surface-muted">
            {search || category !== "all" ? "No logs match your filters." : "No audit logs yet."}
          </p>
          <p className="text-xs admin-surface-faint">
            Logs are recorded automatically as admins perform actions.
          </p>
        </div>
      ) : (
        <div className="min-w-0 overflow-hidden admin-surface-card">
          {/* Table header */}
          <div className="admin-table-list-header hidden px-4 py-2.5 text-xs font-semibold uppercase tracking-wider admin-surface-muted md:grid md:grid-cols-[1fr_140px_140px_100px]">
            <span>Action</span>
            <span>Actor</span>
            <span>Target</span>
            <span className="text-right">Time</span>
          </div>

          <div className="admin-table-body">
            {logs.map((log) => {
              const cs = categoryStyle(log.category);
              return (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 border-b admin-shell-border px-4 py-3 transition-colors last:border-b-0 hover:admin-shell-hover md:grid md:grid-cols-[1fr_140px_140px_100px] md:items-center md:gap-3 md:border-b-0"
                >
                  {/* Action */}
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ${cs.bg} ${cs.ring}`}>
                      <span className={`size-2 rounded-full ${cs.dot}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium admin-shell-text md:truncate">
                        {actionLabel(log.action)}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize ring-1 ${cs.bg} ${cs.text} ${cs.ring}`}>
                          {log.category}
                        </span>
                        {log.ip && log.ip !== "unknown" && (
                          <span className="break-all text-[10px] text-zinc-700">{log.ip}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actor */}
                  <div className="flex min-w-0 items-center gap-2 md:justify-start">
                    <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 md:hidden">Actor</span>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full admin-rank-badge text-[10px] font-bold text-zinc-400">
                      {log.actorName?.[0]?.toUpperCase() ?? "S"}
                    </span>
                    <span className="min-w-0 truncate text-xs text-zinc-400">{log.actorName}</span>
                  </div>

                  {/* Target */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 md:hidden">Target</span>
                    <div className="min-w-0 flex-1">
                      {log.targetName ? (
                        <span className="block truncate text-xs admin-surface-muted">{log.targetName}</span>
                      ) : (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex min-w-0 items-center gap-2 md:block md:text-right">
                    <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 md:hidden">Time</span>
                    <span
                      className="text-xs admin-surface-faint"
                      title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                    >
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="min-w-0 px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={pagination.pages}
              total={pagination.total}
              pageSize={25}
              onPageChange={setPage}
              hideWhenSinglePage
            />
          </div>
        </div>
      )}

      {ToastUI}
    </div>
  );
}
