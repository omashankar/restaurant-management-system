"use client";

import { useToast } from "@/hooks/useToast";
import {
  Activity, Building2, ChevronLeft, ChevronRight,
  CreditCard, Flame, RefreshCw, ShieldOff, ShieldCheck, TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const GATEWAY_COLORS = {
  razorpay: "bg-blue-500/15 text-blue-400",
  cashfree: "bg-green-500/15 text-green-400",
  stripe:   "bg-violet-500/15 text-violet-400",
  paypal:   "bg-sky-500/15 text-sky-400",
  paytm:    "bg-cyan-500/15 text-cyan-400",
  phonepe:  "bg-purple-500/15 text-purple-400",
  payu:     "bg-orange-500/15 text-orange-400",
  ccavenue: "bg-rose-500/15 text-rose-400",
  custom:   "bg-zinc-700 text-zinc-300",
};

const TABS = ["overview", "transactions"];

export default function RestaurantPaymentsPage() {
  const [activeTab, setActiveTab]     = useState("overview");
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [actionLoading, setActionLoading] = useState("");
  const { showToast, ToastUI }        = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/super-admin/restaurant-payments?page=${page}`);
      const data = await res.json();
      if (data.success) { setRestaurants(data.restaurants); setPagination(data.pagination); }
    } catch { showToast("Failed to load.", "error"); }
    finally { setLoading(false); }
  }, [page, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function doAction(id, action, extra = {}) {
    setActionLoading(id + action);
    try {
      const res  = await fetch(`/api/super-admin/restaurant-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.success) { showToast(data.message ?? "Done."); fetchData(); }
      else showToast(data.error ?? "Failed.", "error");
    } catch { showToast("Network error.", "error"); }
    finally { setActionLoading(""); }
  }

  const totalRevenue    = restaurants.reduce((s, r) => s + (r.totalRevenue ?? 0), 0);
  const totalTx         = restaurants.reduce((s, r) => s + (r.txCount ?? 0), 0);
  const frozenCount     = restaurants.filter((r) => r.frozen).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <CreditCard className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Restaurant Payments</h1>
            <p className="mt-1 text-sm text-zinc-500">Monitor gateways, payouts, and transactions across all restaurants.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === t ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}>
              {t}
            </button>
          ))}
          <button type="button" onClick={fetchData}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-400">₹{totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-600">{totalTx} transactions</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Restaurants</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-100">{pagination.total}</p>
          <p className="mt-1 text-xs text-zinc-600">Active tenants</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Frozen Accounts</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-red-400">{frozenCount}</p>
          <p className="mt-1 text-xs text-zinc-600">Suspended</p>
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
            <Building2 className="size-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No restaurants found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Active Gateways</th>
                    <th className="hidden px-4 py-3 md:table-cell">Revenue</th>
                    <th className="hidden px-4 py-3 md:table-cell">Txns</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {restaurants.map((r) => (
                    <tr key={r.id} className={`transition-colors hover:bg-zinc-800/20 ${r.frozen ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.frozen && <ShieldOff className="size-3.5 text-red-400 shrink-0" />}
                          <div>
                            <p className="font-medium text-zinc-100">{r.name}</p>
                            <p className="text-xs text-zinc-500">{r.ownerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.gatewaysEnabled.length === 0 ? (
                            <span className="text-xs text-zinc-600">None</span>
                          ) : r.gatewaysEnabled.map((gw) => (
                            <span key={gw} className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${GATEWAY_COLORS[gw] ?? "bg-zinc-800 text-zinc-400"}`}>
                              {gw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums text-zinc-100 md:table-cell">
                        ₹{(r.totalRevenue ?? 0).toLocaleString()}
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">{r.txCount ?? 0}</td>
                      <td className="px-4 py-3">
                        {r.frozen ? (
                          <button type="button" disabled={Boolean(actionLoading)}
                            onClick={() => doAction(r.id, "unfreeze")}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors">
                            <ShieldCheck className="size-3" />
                            {actionLoading === r.id + "unfreeze" ? "…" : "Unfreeze"}
                          </button>
                        ) : (
                          <button type="button" disabled={Boolean(actionLoading)}
                            onClick={() => doAction(r.id, "freeze")}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-colors">
                            <Flame className="size-3" />
                            {actionLoading === r.id + "freeze" ? "…" : "Freeze"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-600">{pagination.total} total · page {pagination.page} of {pagination.pages}</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                    className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-30">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                    className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-30">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Gateway analytics tab */}
      {activeTab === "transactions" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">Gateway Analytics</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(GATEWAY_COLORS).map(([gw, cls]) => {
              const count = restaurants.filter((r) => r.gatewaysEnabled.includes(gw)).length;
              if (count === 0) return null;
              return (
                <div key={gw} className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{gw}</span>
                    <span className="text-xs text-zinc-500">{count} restaurant{count > 1 ? "s" : ""}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
                    <div className="h-1.5 rounded-full bg-emerald-500/60" style={{ width: `${Math.min(100, (count / pagination.total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-zinc-600">Gateway adoption across {pagination.total} active restaurants.</p>
        </div>
      )}

      {/* Payouts tab */}
      {activeTab === "payouts" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-100">Pending Payout Requests</h2>
          {restaurants.filter((r) => r.pendingPayouts > 0).length === 0 ? (
            <p className="text-sm text-zinc-500">No pending payout requests.</p>
          ) : (
            <div className="space-y-2">
              {restaurants.filter((r) => r.pendingPayouts > 0).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.ownerEmail}</p>
                  </div>
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-zinc-950">
                    {r.pendingPayouts}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {ToastUI}
    </div>
  );
}
