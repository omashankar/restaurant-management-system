"use client";

import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import SearchField from "@/components/ui/SearchField";
import DataTableShell from "@/components/ui/DataTableShell";
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  AdminTableHeadRow,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "@/components/ui/AdminTable";
import { formatSaMoney } from "@/lib/formatSaMoney";
import { useToast } from "@/hooks/useToast";
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  Clock, DollarSign, Download, FileText, RefreshCw, Search, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUS_BADGE = {
  paid:    "sa-status-badge",
  pending: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  failed:  "bg-red-500/15 text-red-400 ring-red-500/25",
  refunded:"bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
};

const STATUS_ICON = {
  paid:    <CheckCircle2 className="size-3.5 text-sa-accent" />,
  pending: <Clock className="size-3.5 text-amber-400" />,
  failed:  <XCircle className="size-3.5 text-red-400" />,
  refunded:<XCircle className="size-3.5 text-zinc-400" />,
};

const STATUSES = ["paid", "pending", "failed", "refunded"];

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [payments, setPayments]   = useState([]);
  const [summary, setSummary]     = useState({ totalRevenue: 0, paidCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]           = useState(1);
  const [downloadingId, setDownloadingId] = useState("");
  const { showToast, ToastUI }    = useToast();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ page: String(page), paymentType: "subscription" });
      if (search)              params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res  = await fetch(`/api/super-admin/payments?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoadError(data?.error ?? "Failed to load subscription payments.");
        return;
      }
      setPayments(data.payments);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch {
      setLoadError("Could not load subscription payments.");
      showToast("Failed to load payments.", "error");
    }
    finally { setLoading(false); }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  /* Reset to page 1 when filters change */
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const invoiceRows = payments.filter(
    (p) =>
      p.status === "paid" &&
      (p.paymentType === "subscription" || p.paymentType === "subscription_renewal"),
  );

  const downloadReceipt = async (payment) => {
    setDownloadingId(payment.id);
    try {
      const res = await fetch(`/api/super-admin/payments/${payment.id}/receipt`);
      if (!res.ok) {
        let message = "Failed to download receipt.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // keep fallback message
        }
        showToast(message, "error");
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${payment.invoiceId || `receipt-${payment.id}`}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      showToast("Receipt downloaded.");
    } catch {
      showToast("Failed to download receipt.", "error");
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`mt-1 ${saIconBadgeCls}`}>
            <DollarSign className="size-5" />
          </span>
          <div>
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Subscription Payments</h1>
            <p className="admin-page-desc mt-1 text-sm">
              Money received when restaurants pay for a plan.{" "}
              <Link href="/super-admin/billing" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline">
                Manage plans &amp; expiry →
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "admin-surface-segment-btn-active admin-shell-text"
                : "admin-surface-segment-btn hover:admin-surface-body"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "transactions"
                ? "admin-surface-segment-btn-active admin-shell-text"
                : "admin-surface-segment-btn hover:admin-surface-body"
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "invoices"
                ? "admin-surface-segment-btn-active admin-shell-text"
                : "admin-surface-segment-btn hover:admin-surface-body"
            }`}
          >
            Invoices
          </button>
          <button type="button" onClick={fetchPayments}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:admin-shell-text transition-colors">
            <RefreshCw className={`size-4 ${loading ? saSpinnerCls : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {/* Summary cards */}
      {activeTab === "overview" && (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sa-accent-20 bg-sa-accent-5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-sa-accent">
            {formatSaMoney(summary.totalRevenue)}
          </p>
          <p className="mt-1 text-xs admin-surface-faint">{summary.paidCount} paid transactions</p>
        </div>
        <div className="admin-surface-card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Transactions</p>
          <p className="mt-2 text-3xl font-bold tabular-nums admin-shell-text">{pagination.total}</p>
          <p className="mt-1 text-xs admin-surface-faint">All statuses</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Showing</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-400">{payments.length}</p>
          <p className="mt-1 text-xs admin-surface-faint">Page {pagination.page} of {pagination.pages}</p>
        </div>
      </div>
      )}

      {/* Filters */}
      {activeTab === "transactions" && (
      <>
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          className="min-w-[200px] max-w-sm flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurant, email, invoice…"
          inputClassName="focus-sa-primary"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SuperAdminPageSkeleton rows={8} rowClassName="h-14" />
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-20 text-center">
          <DollarSign className="size-10 text-zinc-700" />
          <p className="text-sm admin-surface-muted">No transactions found.</p>
          <p className="text-xs admin-surface-faint">Payments will appear here once restaurants subscribe to a plan.</p>
        </div>
      ) : (
        <DataTableShell>
            <AdminTable>
              <AdminTableHead>
                <AdminTableHeadRow>
                  <AdminTableTh>Invoice</AdminTableTh>
                  <AdminTableTh>Restaurant</AdminTableTh>
                  <AdminTableTh hidden="md">Plan</AdminTableTh>
                  <AdminTableTh>Amount</AdminTableTh>
                  <AdminTableTh>Status</AdminTableTh>
                  <AdminTableTh hidden="lg">Method</AdminTableTh>
                  <AdminTableTh hidden="md">Date</AdminTableTh>
                </AdminTableHeadRow>
              </AdminTableHead>
              <AdminTableBody>
                {payments.map((p) => (
                  <AdminTableRow key={p.id}>
                    <AdminTableTd>
                      <p className="font-mono text-xs admin-surface-muted">{p.invoiceId}</p>
                    </AdminTableTd>
                    <AdminTableTd>
                      <p className="font-medium admin-shell-text">{p.restaurantName}</p>
                      <p className="text-xs admin-surface-muted">{p.adminEmail}</p>
                    </AdminTableTd>
                    <AdminTableTd hidden="md">
                      <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold capitalize admin-surface-body">
                        {p.plan}
                      </span>
                    </AdminTableTd>
                    <AdminTableTd>
                      <p className="font-semibold tabular-nums admin-shell-text">
                        {formatSaMoney(p.amount, p.currency)}
                      </p>
                    </AdminTableTd>
                    <AdminTableTd>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${STATUS_BADGE[p.status] ?? STATUS_BADGE.pending}`}>
                        {STATUS_ICON[p.status]}
                        {p.status}
                      </span>
                    </AdminTableTd>
                    <AdminTableTd hidden="lg">
                      <span className="text-xs capitalize admin-surface-muted">{p.method}</span>
                    </AdminTableTd>
                    <AdminTableTd hidden="md" className="text-xs admin-surface-faint">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </AdminTableTd>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t admin-shell-border px-4 py-3">
              <p className="text-xs admin-surface-faint">
                {pagination.total} total · page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border admin-shell-border text-zinc-400 hover:border-zinc-600 hover:admin-shell-text disabled:opacity-30 transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border admin-shell-border text-zinc-400 hover:border-zinc-600 hover:admin-shell-text disabled:opacity-30 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </DataTableShell>
      )}
      </>
      )}

      {activeTab === "invoices" && (
      <>
      {loading ? (
        <SuperAdminPageSkeleton rows={6} rowClassName="h-14" />
      ) : invoiceRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-20 text-center">
          <FileText className="size-10 text-zinc-700" />
          <p className="text-sm admin-surface-muted">No subscription invoices available.</p>
          <p className="text-xs admin-surface-faint">Paid subscription receipts will appear here.</p>
        </div>
      ) : (
        <DataTableShell>
            <AdminTable>
              <AdminTableHead>
                <AdminTableHeadRow>
                  <AdminTableTh>Invoice</AdminTableTh>
                  <AdminTableTh>Restaurant</AdminTableTh>
                  <AdminTableTh hidden="md">Plan</AdminTableTh>
                  <AdminTableTh>Amount</AdminTableTh>
                  <AdminTableTh hidden="md">Paid On</AdminTableTh>
                  <AdminTableTh align="right">Receipt</AdminTableTh>
                </AdminTableHeadRow>
              </AdminTableHead>
              <AdminTableBody>
                {invoiceRows.map((p) => (
                  <AdminTableRow key={p.id}>
                    <AdminTableTd>
                      <p className="font-mono text-xs text-zinc-400">{p.invoiceId}</p>
                    </AdminTableTd>
                    <AdminTableTd>
                      <p className="font-medium admin-shell-text">{p.restaurantName}</p>
                      <p className="text-xs admin-surface-muted">{p.adminEmail}</p>
                    </AdminTableTd>
                    <AdminTableTd hidden="md">
                      <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold capitalize admin-surface-body">
                        {p.planName || p.plan} {p.billingCycle ? `(${p.billingCycle})` : ""}
                      </span>
                    </AdminTableTd>
                    <AdminTableTd>
                      <p className="font-semibold tabular-nums admin-shell-text">
                        {formatSaMoney(p.amount, p.currency)}
                      </p>
                    </AdminTableTd>
                    <AdminTableTd hidden="md" className="text-xs admin-surface-faint">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : (p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—")}
                    </AdminTableTd>
                    <AdminTableTd align="right">
                      <button
                        type="button"
                        disabled={downloadingId === p.id}
                        onClick={() => downloadReceipt(p)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border admin-shell-border px-2.5 py-1.5 text-xs font-medium admin-surface-body hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50"
                      >
                        <Download className="size-3.5" />
                        {downloadingId === p.id ? "Downloading..." : "Download"}
                      </button>
                    </AdminTableTd>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          <div className="border-t admin-shell-border px-4 py-2.5 text-xs admin-surface-faint">
            {invoiceRows.length} subscription invoice{invoiceRows.length !== 1 ? "s" : ""}
          </div>
        </DataTableShell>
      )}
      </>
      )}

      {ToastUI}
    </div>
  );
}
