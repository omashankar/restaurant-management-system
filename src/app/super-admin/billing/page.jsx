"use client";

import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saInputCls, saSpinnerCls } from "@/config/superAdminTheme";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import DataTableShell from "@/components/ui/DataTableShell";
import {
  AdminTable,
  AdminTableActionsCell,
  AdminTableBody,
  AdminTableHead,
  AdminTableHeadRow,
  AdminTableIconButton,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
  AdminTableThActions,
} from "@/components/ui/AdminTable";
import { formatSaMoney } from "@/lib/formatSaMoney";
import {
  buildAssignPlanSubmitBody,
  EMPTY_ASSIGN_PLAN_ERRORS,
  getAssignPlanFieldErrors,
} from "@/lib/formValidation";
import { intInputProps } from "@/lib/formInputTypes";
import { useToast } from "@/hooks/useToast";
import {
  AlertTriangle, Ban, Building2, Calendar,
  CheckCircle2, CreditCard, DollarSign,
  Plus, Receipt, RefreshCw, RotateCcw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import PaginationBar from "@/components/ui/PaginationBar";
import { useCallback, useEffect, useMemo, useState } from "react";

const SUBS_PAGE_SIZE = 15;

const PLAN_BADGE = {
  free:       "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  starter:    "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  pro:        "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",
  enterprise: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
};

const STATUS_BADGE = {
  active:    "sa-status-badge",
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

const inputCls = saInputCls;

const filterSelectCls =
  "cursor-pointer w-full min-w-0 rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2 text-xs admin-shell-text outline-none focus-sa-primary sm:w-auto sm:min-w-[9.5rem] sm:shrink-0";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

const emptyAssignForm = {
  restaurantId: "",
  planSlug: "",
  startDate: "",
  endDate: "",
  trialDays: "0",
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [subs, setSubs]               = useState([]);
  const [plans, setPlans]             = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [billing, setBilling]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subsPage, setSubsPage] = useState(1);
  const [subsPagination, setSubsPagination] = useState({ total: 0, pages: 1 });

  const [assignOpen, setAssignOpen]   = useState(false);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignFieldErrors, setAssignFieldErrors] = useState(EMPTY_ASSIGN_PLAN_ERRORS);
  const [assignError, setAssignError] = useState("");
  const [assigning, setAssigning]     = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);

  const [renewTarget, setRenewTarget] = useState(null);
  const [renewDays, setRenewDays]     = useState("30");
  const [renewing, setRenewing]       = useState(false);

  const { showToast, ToastUI } = useToast();

  useEffect(() => {
    setSubsPage(1);
  }, [statusFilter]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({
        page: String(subsPage),
        limit: String(SUBS_PAGE_SIZE),
      });
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
      if (!subsData.success && !billingData.success) {
        setLoadError(subsData.error ?? billingData.error ?? "Failed to load billing data.");
      }
      if (subsData.success) {
        setSubs(subsData.subscriptions);
        if (subsData.pagination) setSubsPagination(subsData.pagination);
      }
      if (billingData.success) setBilling(billingData);
      if (plansData.success)   setPlans(plansData.plans);
      if (restData.success)    setRestaurants(restData.restaurants);
    } catch {
      setLoadError("Could not load billing data.");
      showToast("Failed to load.", "error");
    }
    finally { setLoading(false); }
  }, [statusFilter, subsPage, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAssignModal = (planSlug = "") => {
    setAssignForm({ ...emptyAssignForm, planSlug });
    setAssignFieldErrors(EMPTY_ASSIGN_PLAN_ERRORS);
    setAssignError("");
    setAssignOpen(true);
  };

  const clearAssignFieldError = (key) => {
    if (assignFieldErrors[key]) {
      setAssignFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleAssign = async () => {
    const errors = getAssignPlanFieldErrors(assignForm);
    setAssignFieldErrors(errors);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setAssignError(firstError);
      return;
    }
    setAssigning(true);
    setAssignError("");
    try {
      const res = await fetch("/api/super-admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAssignPlanSubmitBody(assignForm)),
      });
      const data = await res.json();
      if (!data.success) { setAssignError(data.error ?? "Failed."); return; }
      showToast("Plan assigned successfully.");
      setAssignOpen(false);
      setAssignForm(emptyAssignForm);
      setAssignFieldErrors(EMPTY_ASSIGN_PLAN_ERRORS);
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
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${saIconBadgeCls}`}>
            <Receipt className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-2xl font-semibold tracking-tight">Billing</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">
              Manage which plan each restaurant is on (active, trial, expired).{" "}
              <Link href="/super-admin/payments" className="text-sa-primary hover:text-sa-primary-muted underline-offset-2 hover:underline">
                View payment history →
              </Link>
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm ${
              activeTab === "overview"
                ? "admin-surface-segment-btn-active admin-shell-text"
                : "admin-surface-segment-btn hover:admin-surface-body"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscriptions")}
            className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm ${
              activeTab === "subscriptions"
                ? "admin-surface-segment-btn-active admin-shell-text"
                : "admin-surface-segment-btn hover:admin-surface-body"
            }`}
          >
            Subscriptions
          </button>
          </div>
          <button type="button" onClick={fetchAll}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto">
            <RefreshCw className={"size-4 " + (loading ? saSpinnerCls : "")} />
            Refresh
          </button>
          <button type="button"
            onClick={() => openAssignModal()}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sa-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 sm:w-auto">
            <Plus className="size-4" /> Assign Plan
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      {loading ? (
        <SuperAdminPageSkeleton cards={4} cardClassName="h-24" rows={0} />
      ) : (
        <>
          {activeTab === "overview" && (
          <>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Revenue",        value: formatSaMoney(billing?.overview?.totalRevenue ?? 0), icon: DollarSign,    color: "text-sa-accent", bg: "bg-sa-accent-5",  border: "border-sa-accent-20" },
              { label: "Active Subscriptions", value: stats.active,   icon: CheckCircle2, color: "text-sky-400",     bg: "bg-sky-500/5",      border: "border-sky-500/20"     },
              { label: "On Trial",             value: stats.trial,    icon: Calendar,     color: "text-indigo-400",  bg: "bg-indigo-500/5",   border: "border-indigo-500/20"  },
              { label: "Expired",              value: stats.expired,  icon: AlertTriangle,color: "text-red-400",     bg: "bg-red-500/5",      border: "border-red-500/20"     },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={"min-w-0 rounded-2xl border p-4 sm:p-5 " + bg + " " + border}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
                    <p className={"mt-2 break-words text-2xl font-bold tabular-nums sm:text-3xl " + color}>{value}</p>
                  </div>
                  <span className={"flex size-10 shrink-0 items-center justify-center rounded-xl " + bg}>
                    <Icon className={"size-5 " + color} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2 admin-surface-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="size-4 text-sa-accent" />
                <h2 className="text-sm font-semibold admin-shell-text">Revenue — Last 6 Months</h2>
              </div>
              {!billing?.revenueByMonth?.length ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm admin-surface-faint">No revenue data yet.</p>
                </div>
              ) : (
                <div className="flex h-40 min-w-0 items-end gap-1 overflow-x-auto pb-1 sm:gap-1.5 sm:overflow-visible">
                  {billing.revenueByMonth.map((m) => (
                    <div key={m.label} className="group flex min-w-[2.75rem] flex-1 flex-col items-center gap-1 sm:min-w-0">
                      <div className="relative flex flex-1 w-full flex-col justify-end">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded-lg admin-chart-tooltip px-2 py-1 text-[10px] font-semibold admin-shell-text shadow-lg z-10">
                          {formatSaMoney(m.revenue)}
                        </div>
                        <div className="w-full rounded-t-md bg-sa-accent-30 hover:bg-sa-accent-50 transition-colors cursor-default"
                          style={{ height: Math.max(4, (m.revenue / maxRevenue) * 100) + "%" }} />
                      </div>
                      <p className="text-[10px] admin-surface-faint text-center leading-tight shrink-0">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 admin-surface-card p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-semibold admin-shell-text">Plan Distribution</h2>
              {!billing?.planBreakdown?.length ? (
                <p className="text-sm admin-surface-faint">No data.</p>
              ) : (
                <div className="space-y-3">
                  {billing.planBreakdown.map((p, planIdx) => {
                    const total = billing.overview?.totalRestaurants || 1;
                    const pct   = Math.round((p.count / total) * 100);
                    return (
                      <div key={`plan-dist-${p.plan}-${planIdx}`}>
                        <div className="mb-1.5 flex min-w-0 flex-wrap items-center justify-between gap-1">
                          <span className={"inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[p.plan] ?? PLAN_BADGE.free)}>
                            {p.plan}
                          </span>
                          <span className="text-xs admin-surface-muted">{p.count} · {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full admin-progress-track">
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
          <div className="min-w-0 admin-surface-card">
            <div className="flex flex-col gap-3 admin-surface-divider-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold admin-shell-text">Subscriptions</h2>
                <p className="mt-0.5 text-xs admin-surface-muted">Track plan assignments, expiry, and status per restaurant.</p>
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className={filterSelectCls}>
                <option value="all">All statuses</option>
                {["active","trial","expired","cancelled"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {subs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <CreditCard className="size-10 text-zinc-700" />
                <p className="text-sm admin-surface-muted">No subscriptions found.</p>
                <button type="button" onClick={() => openAssignModal()}
                  className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110">
                  Assign First Plan
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 p-3 md:hidden">
                  {subs.map((s) => {
                    const StatusIcon = STATUS_ICON[s.status] ?? CheckCircle2;
                    const isExpiring = s.daysLeft != null && s.daysLeft <= 7 && s.status === "active";
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3 ${s.status === "cancelled" ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg admin-rank-badge text-xs font-bold admin-surface-body">
                            {s.restaurantName?.[0]?.toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-medium admin-shell-text">{s.restaurantName}</p>
                            <p className="truncate text-xs admin-surface-muted">{s.restaurantEmail}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={"inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[s.planSlug] ?? PLAN_BADGE.free)}>
                            {s.planName}
                          </span>
                          <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (STATUS_BADGE[s.status] ?? STATUS_BADGE.cancelled)}>
                            <StatusIcon className="size-3" />
                            {s.status}
                          </span>
                        </div>
                        {s.price > 0 && (
                          <p className="mt-2 text-[10px] admin-surface-faint">{formatSaMoney(s.price)}/{s.billingCycle}</p>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="admin-surface-faint">Start</p>
                            <p className="admin-surface-muted">
                              {s.startDate ? new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="admin-surface-faint">Expires</p>
                            <p className={isExpiring ? "font-semibold text-amber-400" : "admin-surface-muted"}>
                              {s.endDate ? new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </p>
                          </div>
                        </div>
                        {s.daysLeft != null && (
                          <p className={"mt-2 text-xs font-semibold tabular-nums " + (s.daysLeft === 0 ? "text-red-400" : s.daysLeft <= 7 ? "text-amber-400" : "text-zinc-400")}>
                            {s.daysLeft === 0 ? "Expires today" : `${s.daysLeft} days left`}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-1 border-t admin-shell-border pt-3">
                          <AdminTableIconButton
                            onClick={() => { setRenewTarget(s); setRenewDays("30"); }}
                            title="Renew / extend"
                            aria-label="Renew / extend"
                            className="hover:text-sa-primary"
                          >
                            <RotateCcw className="size-4" />
                          </AdminTableIconButton>
                          {s.status !== "cancelled" && (
                            <AdminTableIconButton
                              variant="danger"
                              onClick={() => setCancelTarget(s)}
                              title="Cancel subscription"
                              aria-label="Cancel subscription"
                            >
                              <Ban className="size-4" />
                            </AdminTableIconButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block">
              <DataTableShell>
                <AdminTable>
                  <AdminTableHead>
                    <AdminTableHeadRow>
                      <AdminTableTh>Restaurant</AdminTableTh>
                      <AdminTableTh>Plan</AdminTableTh>
                      <AdminTableTh>Status</AdminTableTh>
                      <AdminTableTh hidden="md">Start</AdminTableTh>
                      <AdminTableTh hidden="md">Expires</AdminTableTh>
                      <AdminTableTh hidden="lg">Days Left</AdminTableTh>
                      <AdminTableThActions />
                    </AdminTableHeadRow>
                  </AdminTableHead>
                  <AdminTableBody>
                    {subs.map((s) => {
                      const StatusIcon = STATUS_ICON[s.status] ?? CheckCircle2;
                      const isExpiring = s.daysLeft != null && s.daysLeft <= 7 && s.status === "active";
                      return (
                        <AdminTableRow key={s.id} className={s.status === "cancelled" ? "opacity-50" : ""}>
                          <AdminTableTd>
                            <div className="flex items-center gap-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg admin-rank-badge text-xs font-bold admin-surface-body">
                                {s.restaurantName?.[0]?.toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium admin-shell-text">{s.restaurantName}</p>
                                <p className="truncate text-xs admin-surface-muted">{s.restaurantEmail}</p>
                              </div>
                            </div>
                          </AdminTableTd>
                          <AdminTableTd>
                            <span className={"inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[s.planSlug] ?? PLAN_BADGE.free)}>
                              {s.planName}
                            </span>
                            {s.price > 0 && (
                              <p className="mt-0.5 text-[10px] admin-surface-faint">{formatSaMoney(s.price)}/{s.billingCycle}</p>
                            )}
                          </AdminTableTd>
                          <AdminTableTd>
                            <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (STATUS_BADGE[s.status] ?? STATUS_BADGE.cancelled)}>
                              <StatusIcon className="size-3" />
                              {s.status}
                            </span>
                          </AdminTableTd>
                          <AdminTableTd hidden="md" className="text-xs admin-surface-faint">
                            {s.startDate ? new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </AdminTableTd>
                          <AdminTableTd hidden="md">
                            {s.endDate ? (
                              <span className={"text-xs " + (isExpiring ? "font-semibold text-amber-400" : "text-zinc-600")}>
                                {new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            ) : <span className="text-xs text-zinc-700">—</span>}
                          </AdminTableTd>
                          <AdminTableTd hidden="lg">
                            {s.daysLeft != null ? (
                              <span className={"text-xs font-semibold tabular-nums " + (s.daysLeft === 0 ? "text-red-400" : s.daysLeft <= 7 ? "text-amber-400" : "text-zinc-400")}>
                                {s.daysLeft === 0 ? "Today" : s.daysLeft + "d"}
                              </span>
                            ) : <span className="text-xs text-zinc-700">—</span>}
                          </AdminTableTd>
                          <AdminTableActionsCell>
                              <AdminTableIconButton
                                onClick={() => { setRenewTarget(s); setRenewDays("30"); }}
                                title="Renew / extend"
                                aria-label="Renew / extend"
                                className="hover:text-sa-primary"
                              >
                                <RotateCcw className="size-4" />
                              </AdminTableIconButton>
                              {s.status !== "cancelled" && (
                                <AdminTableIconButton
                                  variant="danger"
                                  onClick={() => setCancelTarget(s)}
                                  title="Cancel subscription"
                                  aria-label="Cancel subscription"
                                >
                                  <Ban className="size-4" />
                                </AdminTableIconButton>
                              )}
                          </AdminTableActionsCell>
                        </AdminTableRow>
                      );
                    })}
                  </AdminTableBody>
                </AdminTable>
              </DataTableShell>
                </div>
              </>
            )}
            <div className="min-w-0 px-4 pb-4">
              <PaginationBar
                page={subsPage}
                totalPages={subsPagination.pages}
                total={subsPagination.total}
                pageSize={SUBS_PAGE_SIZE}
                onPageChange={setSubsPage}
                hideWhenSinglePage
              />
            </div>
          </div>
          )}
        </>
      )}

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Plan to Restaurant"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setAssignOpen(false)}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body transition-colors hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={handleAssign} disabled={assigning}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-40 sm:w-auto">
              {assigning ? "Assigning…" : "Assign Plan"}
            </button>
          </div>
        }>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAssign();
          }}
        >
          {assignError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{assignError}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Restaurant *</label>
            <select
              value={assignForm.restaurantId}
              onChange={(e) => {
                setAssignForm((f) => ({ ...f, restaurantId: e.target.value }));
                clearAssignFieldError("restaurantId");
              }}
              aria-invalid={assignFieldErrors.restaurantId ? true : undefined}
              className={"cursor-pointer " + inputCls}
            >
              <option value="">— Select restaurant —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.adminEmail ?? r.ownerEmail ?? ""}</option>
              ))}
            </select>
            <FieldError message={assignFieldErrors.restaurantId} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Plan *</label>
            <select
              value={assignForm.planSlug}
              onChange={(e) => {
                setAssignForm((f) => ({ ...f, planSlug: e.target.value }));
                clearAssignFieldError("planSlug");
              }}
              aria-invalid={assignFieldErrors.planSlug ? true : undefined}
              className={"cursor-pointer " + inputCls}
            >
              <option value="">— Select plan —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} — {p.price === 0 ? "Free" : `${formatSaMoney(p.price)}/${p.billingCycle}`}
                </option>
              ))}
            </select>
            <FieldError message={assignFieldErrors.planSlug} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
              <input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => {
                  setAssignForm((f) => ({ ...f, startDate: e.target.value }));
                  clearAssignFieldError("startDate");
                  clearAssignFieldError("endDate");
                }}
                aria-invalid={assignFieldErrors.startDate ? true : undefined}
                className={inputCls}
              />
              <FieldError message={assignFieldErrors.startDate} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
              <input
                type="date"
                value={assignForm.endDate}
                min={assignForm.startDate || undefined}
                onChange={(e) => {
                  setAssignForm((f) => ({ ...f, endDate: e.target.value }));
                  clearAssignFieldError("endDate");
                  clearAssignFieldError("startDate");
                }}
                aria-invalid={assignFieldErrors.endDate ? true : undefined}
                className={inputCls}
              />
              <FieldError message={assignFieldErrors.endDate} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Trial Days</label>
              <input
                {...intInputProps({ min: 0, max: 90, step: 1 })}
                value={assignForm.trialDays}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setAssignForm((f) => ({ ...f, trialDays: v }));
                  clearAssignFieldError("trialDays");
                }}
                placeholder="0"
                aria-invalid={assignFieldErrors.trialDays ? true : undefined}
                className={inputCls}
              />
              <FieldError message={assignFieldErrors.trialDays} />
            </div>
          </div>
          <p className="text-[11px] text-zinc-600">Leave Start/End blank to use today + 1 billing cycle automatically.</p>
        </form>
      </Modal>

      <Modal open={!!renewTarget} onClose={() => setRenewTarget(null)} title="Renew Subscription"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setRenewTarget(null)}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body transition-colors hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={handleRenew} disabled={renewing}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-40 sm:w-auto">
              {renewing ? "Renewing…" : "Renew"}
            </button>
          </div>
        }>
        {renewTarget && (
          <div className="space-y-4">
            <div className="min-w-0 rounded-xl admin-surface-card px-4 py-3 text-sm admin-surface-muted">
              <span className="break-words font-medium admin-shell-text">{renewTarget.restaurantName}</span>
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
