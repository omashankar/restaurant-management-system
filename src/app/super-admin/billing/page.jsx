"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import {
  AlertTriangle, Ban, Building2, Calendar,
  CheckCircle2, CreditCard, DollarSign,
  Plus, Receipt, RefreshCw, RotateCcw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PLAN_BADGE = {
  free:       "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  starter:    "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  pro:        "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",
  enterprise: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
};

const STATUS_BADGE = {
  active:    "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  trial:     "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  expired:   "bg-red-500/15 text-red-400 ring-red-500/25",
  cancelled: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
};

const STATUS_ICON = {
  active:    CheckCircle2,
  trial:     Calendar,
  expired:   AlertTriangle,
  cancelled: Ban,
};

const PLAN_BAR = {
  free: "bg-zinc-500", starter: "bg-sky-500",
  pro: "bg-indigo-500", enterprise: "bg-amber-500",
};

const inputCls = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 transition-colors";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [subs, setSubs]               = useState([]);
  const [plans, setPlans]             = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [billing, setBilling]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [assignOpen, setAssignOpen]   = useState(false);
  const [assignForm, setAssignForm]   = useState({ restaurantId: "", planSlug: "", startDate: "", endDate: "", trialDays: "0" });
  const [assignError, setAssignError] = useState("");
  const [assigning, setAssigning]     = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);

  const [renewTarget, setRenewTarget] = useState(null);
  const [renewDays, setRenewDays]     = useState("30");
  const [renewing, setRenewing]       = useState(false);

  const { showToast, ToastUI } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const [subsRes, billingRes, plansRes, restRes] = await Promise.all([
        fetch("/api/super-admin/subscriptions?" + params),
        fetch("/api/super-admin/billing"),
        fetch("/api/super-admin/plans"),
        fetch("/api/super-admin/restaurants"),
      ]);
      const [subsData, billingData, plansData, restData] = await Promise.all([
        subsRes.json(), billingRes.json(), plansRes.json(), restRes.json(),
      ]);
      if (subsData.success)    setSubs(subsData.subscriptions);
      if (billingData.success) setBilling(billingData);
      if (plansData.success)   setPlans(plansData.plans);
      if (restData.success)    setRestaurants(restData.restaurants);
    } catch { showToast("Failed to load.", "error"); }
    finally { setLoading(false); }
  }, [statusFilter, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAssign = async () => {
    if (!assignForm.restaurantId) { setAssignError("Select a restaurant."); return; }
    if (!assignForm.planSlug)     { setAssignError("Select a plan."); return; }
    setAssigning(true); setAssignError("");
    try {
      const res = await fetch("/api/super-admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: assignForm.restaurantId,
          planSlug:     assignForm.planSlug,
          startDate:    assignForm.startDate || undefined,
          endDate:      assignForm.endDate   || undefined,
          trialDays:    Number(assignForm.trialDays) || 0,
        }),
      });
      const data = await res.json();
      if (!data.success) { setAssignError(data.error ?? "Failed."); return; }
      showToast("Plan assigned successfully.");
      setAssignOpen(false);
      setAssignForm({ restaurantId: "", planSlug: "", startDate: "", endDate: "", trialDays: "0" });
      fetchAll();
    } catch { setAssignError("Network error."); }
    finally { setAssigning(false); }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res  = await fetch("/api/super-admin/subscriptions/" + cancelTarget.id, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed.", "error"); return; }
      setSubs((prev) => prev.map((s) => s.id === cancelTarget.id ? { ...s, status: "cancelled" } : s));
      showToast("Subscription cancelled.");
      setCancelTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setCancelling(false); }
  };

  const handleRenew = async () => {
    if (!renewTarget) return;
    setRenewing(true);
    try {
      const days    = Number(renewDays) || 30;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      const res  = await fetch("/api/super-admin/subscriptions/" + renewTarget.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", endDate: endDate.toISOString() }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed.", "error"); return; }
      showToast("Renewed for " + days + " days.");
      setRenewTarget(null);
      fetchAll();
    } catch { showToast("Network error.", "error"); }
    finally { setRenewing(false); }
  };

  const stats = useMemo(() => ({
    total:     subs.length,
    active:    subs.filter((s) => s.status === "active").length,
    trial:     subs.filter((s) => s.status === "trial").length,
    expired:   subs.filter((s) => s.status === "expired").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
  }), [subs]);

  const maxRevenue = billing?.revenueByMonth?.length
    ? Math.max(...billing.revenueByMonth.map((r) => r.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Receipt className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Billing</h1>
            <p className="mt-1 text-sm text-zinc-500">Subscription management, expiry tracking, and revenue overview.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscriptions")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "subscriptions"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            Subscriptions
          </button>
          <button type="button" onClick={fetchAll}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={"size-4 " + (loading ? "animate-spin" : "")} />
          </button>
          <button type="button"
            onClick={() => { setAssignForm({ restaurantId: "", planSlug: "", startDate: "", endDate: "", trialDays: "0" }); setAssignError(""); setAssignOpen(true); }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
            <Plus className="size-4" /> Assign Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
          <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Revenue",        value: "$" + (billing?.overview?.totalRevenue ?? 0).toLocaleString(), icon: DollarSign,    color: "text-emerald-400", bg: "bg-emerald-500/5",  border: "border-emerald-500/20" },
              { label: "Active Subscriptions", value: stats.active,   icon: CheckCircle2, color: "text-sky-400",     bg: "bg-sky-500/5",      border: "border-sky-500/20"     },
              { label: "On Trial",             value: stats.trial,    icon: Calendar,     color: "text-indigo-400",  bg: "bg-indigo-500/5",   border: "border-indigo-500/20"  },
              { label: "Expired",              value: stats.expired,  icon: AlertTriangle,color: "text-red-400",     bg: "bg-red-500/5",      border: "border-red-500/20"     },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={"rounded-2xl border p-5 " + bg + " " + border}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
                    <p className={"mt-2 text-3xl font-bold tabular-nums " + color}>{value}</p>
                  </div>
                  <span className={"flex size-10 shrink-0 items-center justify-center rounded-xl " + bg}>
                    <Icon className={"size-5 " + color} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="size-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Revenue — Last 6 Months</h2>
              </div>
              {!billing?.revenueByMonth?.length ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm text-zinc-600">No revenue data yet.</p>
                </div>
              ) : (
                <div className="flex items-end gap-1.5 h-40">
                  {billing.revenueByMonth.map((m) => (
                    <div key={m.label} className="group flex flex-1 flex-col items-center gap-1">
                      <div className="relative flex flex-1 w-full flex-col justify-end">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-200 shadow-lg z-10">
                          {"$" + m.revenue.toLocaleString()}
                        </div>
                        <div className="w-full rounded-t-md bg-emerald-500/30 hover:bg-emerald-500/50 transition-colors cursor-default"
                          style={{ height: Math.max(4, (m.revenue / maxRevenue) * 100) + "%" }} />
                      </div>
                      <p className="text-[10px] text-zinc-600 text-center leading-tight shrink-0">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-4 text-sm font-semibold text-zinc-100">Plan Distribution</h2>
              {!billing?.planBreakdown?.length ? (
                <p className="text-sm text-zinc-600">No data.</p>
              ) : (
                <div className="space-y-3">
                  {billing.planBreakdown.map((p) => {
                    const total = billing.overview?.totalRestaurants || 1;
                    const pct   = Math.round((p.count / total) * 100);
                    return (
                      <div key={p.plan}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[p.plan] ?? PLAN_BADGE.free)}>
                            {p.plan}
                          </span>
                          <span className="text-xs text-zinc-500">{p.count} · {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800">
                          <div className={"h-1.5 rounded-full " + (PLAN_BAR[p.plan] ?? "bg-zinc-500")} style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          </>
          )}

          {activeTab === "subscriptions" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Subscriptions</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Track plan assignments, expiry, and status per restaurant.</p>
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/40">
                <option value="all">All statuses</option>
                {["active","trial","expired","cancelled"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {subs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <CreditCard className="size-10 text-zinc-700" />
                <p className="text-sm text-zinc-500">No subscriptions found.</p>
                <button type="button" onClick={() => setAssignOpen(true)}
                  className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
                  Assign First Plan
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Restaurant</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="hidden px-4 py-3 md:table-cell">Start</th>
                      <th className="hidden px-4 py-3 md:table-cell">Expires</th>
                      <th className="hidden px-4 py-3 lg:table-cell">Days Left</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {subs.map((s) => {
                      const StatusIcon = STATUS_ICON[s.status] ?? CheckCircle2;
                      const isExpiring = s.daysLeft != null && s.daysLeft <= 7 && s.status === "active";
                      return (
                        <tr key={s.id} className={"transition-colors hover:bg-zinc-800/20 " + (s.status === "cancelled" ? "opacity-50" : "")}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300">
                                {s.restaurantName?.[0]?.toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-zinc-100">{s.restaurantName}</p>
                                <p className="truncate text-xs text-zinc-500">{s.restaurantEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={"inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[s.planSlug] ?? PLAN_BADGE.free)}>
                              {s.planName}
                            </span>
                            {s.price > 0 && (
                              <p className="mt-0.5 text-[10px] text-zinc-600">{"$"}{s.price}/{s.billingCycle}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (STATUS_BADGE[s.status] ?? STATUS_BADGE.cancelled)}>
                              <StatusIcon className="size-3" />
                              {s.status}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-zinc-600 md:table-cell">
                            {s.startDate ? new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            {s.endDate ? (
                              <span className={"text-xs " + (isExpiring ? "font-semibold text-amber-400" : "text-zinc-600")}>
                                {new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            ) : <span className="text-xs text-zinc-700">—</span>}
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            {s.daysLeft != null ? (
                              <span className={"text-xs font-semibold tabular-nums " + (s.daysLeft === 0 ? "text-red-400" : s.daysLeft <= 7 ? "text-amber-400" : "text-zinc-400")}>
                                {s.daysLeft === 0 ? "Today" : s.daysLeft + "d"}
                              </span>
                            ) : <span className="text-xs text-zinc-700">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => { setRenewTarget(s); setRenewDays("30"); }}
                                title="Renew / extend"
                                className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors">
                                <RotateCcw className="size-4" />
                              </button>
                              {s.status !== "cancelled" && (
                                <button type="button" onClick={() => setCancelTarget(s)}
                                  title="Cancel subscription"
                                  className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                                  <Ban className="size-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-600">
              {subs.length} subscription{subs.length !== 1 ? "s" : ""}
            </div>
          </div>
          )}
        </>
      )}

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Plan to Restaurant"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAssignOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleAssign} disabled={assigning}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">
              {assigning ? "Assigning…" : "Assign Plan"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {assignError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{assignError}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Restaurant *</label>
            <select value={assignForm.restaurantId} onChange={(e) => setAssignForm((f) => ({ ...f, restaurantId: e.target.value }))}
              className={"cursor-pointer " + inputCls}>
              <option value="">— Select restaurant —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.adminEmail ?? r.ownerEmail ?? ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Plan *</label>
            <select value={assignForm.planSlug} onChange={(e) => setAssignForm((f) => ({ ...f, planSlug: e.target.value }))}
              className={"cursor-pointer " + inputCls}>
              <option value="">— Select plan —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} — {p.price === 0 ? "Free" : "$" + p.price + "/" + p.billingCycle}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
              <input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
              <input type="date" value={assignForm.endDate} onChange={(e) => setAssignForm((f) => ({ ...f, endDate: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Trial Days</label>
              <input type="number" min="0" max="90" value={assignForm.trialDays}
                onChange={(e) => setAssignForm((f) => ({ ...f, trialDays: e.target.value }))}
                placeholder="0" className={inputCls} />
            </div>
          </div>
          <p className="text-[11px] text-zinc-600">Leave Start/End blank to use today + 1 billing cycle automatically.</p>
        </div>
      </Modal>

      <Modal open={!!renewTarget} onClose={() => setRenewTarget(null)} title="Renew Subscription"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRenewTarget(null)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleRenew} disabled={renewing}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">
              {renewing ? "Renewing…" : "Renew"}
            </button>
          </div>
        }>
        {renewTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-400">
              <span className="font-medium text-zinc-100">{renewTarget.restaurantName}</span>
              {" · "}
              <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[renewTarget.planSlug] ?? PLAN_BADGE.free)}>
                {renewTarget.planName}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Extend by (days)</label>
              <input type="number" min="1" max="365" value={renewDays}
                onChange={(e) => setRenewDays(e.target.value)}
                className={inputCls} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel subscription?"
        message={cancelTarget ? "The subscription for \"" + cancelTarget.restaurantName + "\" will be cancelled." : ""}
        confirmLabel={cancelling ? "Cancelling…" : "Cancel Subscription"}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />

      {ToastUI}
    </div>
  );
}
