"use client";

import { raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import SearchField from "@/components/ui/SearchField";
import PaginationBar from "@/components/ui/PaginationBar";
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
import { useSuperAdminLocale } from "@/context/SuperAdminLocaleContext";
import { formatSaMoney } from "@/lib/formatSaMoney";
import { useToast } from "@/hooks/useToast";
import { useHydrateSearchFromUrl } from "@/hooks/useHydrateSearchFromUrl";
import {
  CheckCircle2,
  Clock, DollarSign, Download, FileText, RefreshCw, XCircle,
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

const filterSelectCls =
  "cursor-pointer w-full min-w-0 rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary sm:w-auto sm:min-w-[9.5rem] sm:shrink-0";

export default function PaymentsPage() {
  const { formatDate } = useSuperAdminLocale();
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

  useHydrateSearchFromUrl(setSearch);

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
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">

      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 flex shrink-0 items-center justify-center ${saIconBadgeCls}`}>
            <DollarSign className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Subscription Payments</h1>
            <p className="admin-page-desc mt-1 text-sm">
              Money received when restaurants pay for a plan.{" "}
              <Link href="/super-admin/billing" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline">
                Manage plans &amp; expiry →
              </Link>
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <div className="grid w-full min-w-0 grid-cols-3 gap-1 sm:flex sm:w-auto sm:gap-2">
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
              onClick={() => setActiveTab("transactions")}
              className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm ${
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
              className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm ${
                activeTab === "invoices"
                  ? "admin-surface-segment-btn-active admin-shell-text"
                  : "admin-surface-segment-btn hover:admin-surface-body"
              }`}
            >
              Invoices
            </button>
          </div>
          <button
            type="button"
            onClick={fetchPayments}
            aria-label="Refresh payments"
            className={raPageRefreshBtnCls}
          >
            <RefreshCw className={`size-4 ${loading ? saSpinnerCls : ""}`} />
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      {/* Summary cards */}
      {activeTab === "overview" && (
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-sa-accent-20 bg-sa-accent-5 px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Revenue</p>
          <p className="mt-2 break-words text-xl font-bold tabular-nums text-sa-accent sm:text-2xl lg:text-3xl">
            {formatSaMoney(summary.totalRevenue)}
          </p>
          <p className="mt-1 text-xs admin-surface-faint">{summary.paidCount} paid transactions</p>
        </div>
        <div className="min-w-0 admin-surface-card px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Transactions</p>
          <p className="mt-2 text-xl font-bold tabular-nums admin-shell-text sm:text-2xl lg:text-3xl">{pagination.total}</p>
          <p className="mt-1 text-xs admin-surface-faint">All statuses</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Showing</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-amber-400 sm:text-2xl lg:text-3xl">{payments.length}</p>
          <p className="mt-1 text-xs admin-surface-faint">Page {pagination.page} of {pagination.pages}</p>
        </div>
      </div>
      )}

      {/* Filters */}
      {activeTab === "transactions" && (
      <>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          className="min-w-0 w-full max-w-none sm:max-w-sm sm:flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurant, email, invoice…"
          inputClassName="focus-sa-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={filterSelectCls}
        >
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
          <div className="space-y-2 p-3 md:hidden">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-all font-mono text-xs admin-surface-muted">{p.invoiceId}</p>
                    <p className="mt-1 break-words font-medium admin-shell-text">{p.restaurantName}</p>
                    <p className="truncate text-xs admin-surface-muted">{p.adminEmail}</p>
                  </div>
                  <p className="shrink-0 text-right font-semibold tabular-nums admin-shell-text">
                    {formatSaMoney(p.amount, p.currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold capitalize admin-surface-body">
                    {p.plan}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${STATUS_BADGE[p.status] ?? STATUS_BADGE.pending}`}>
                    {STATUS_ICON[p.status]}
                    {p.status}
                  </span>
                  <span className="text-xs capitalize admin-surface-muted">{p.method}</span>
                </div>
                <p className="mt-2 text-[10px] admin-surface-faint">{formatDate(p.createdAt)}</p>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHead>
                <AdminTableHeadRow>
                  <AdminTableTh>Invoice</AdminTableTh>
                  <AdminTableTh>Restaurant</AdminTableTh>
                  <AdminTableTh>Plan</AdminTableTh>
                  <AdminTableTh>Amount</AdminTableTh>
                  <AdminTableTh>Status</AdminTableTh>
                  <AdminTableTh>Method</AdminTableTh>
                  <AdminTableTh>Date</AdminTableTh>
                </AdminTableHeadRow>
              </AdminTableHead>
              <AdminTableBody>
                {payments.map((p) => (
                  <AdminTableRow key={p.id}>
                    <AdminTableTd>
                      <p className="break-all font-mono text-xs admin-surface-muted">{p.invoiceId}</p>
                    </AdminTableTd>
                    <AdminTableTd>
                      <div className="min-w-0">
                        <p className="truncate font-medium admin-shell-text">{p.restaurantName}</p>
                        <p className="truncate text-xs admin-surface-muted">{p.adminEmail}</p>
                      </div>
                    </AdminTableTd>
                    <AdminTableTd>
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
                    <AdminTableTd>
                      <span className="text-xs capitalize admin-surface-muted">{p.method}</span>
                    </AdminTableTd>
                    <AdminTableTd className="whitespace-nowrap text-xs admin-surface-faint">
                      {formatDate(p.createdAt)}
                    </AdminTableTd>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </div>

          <div className="px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={pagination.pages}
              total={pagination.total}
              pageSize={20}
              onPageChange={setPage}
              hideWhenSinglePage
            />
          </div>
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
          <div className="space-y-2 p-3 md:hidden">
            {invoiceRows.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-all font-mono text-xs text-zinc-400">{p.invoiceId}</p>
                    <p className="mt-1 break-words font-medium admin-shell-text">{p.restaurantName}</p>
                    <p className="truncate text-xs admin-surface-muted">{p.adminEmail}</p>
                  </div>
                  <p className="shrink-0 text-right font-semibold tabular-nums admin-shell-text">
                    {formatSaMoney(p.amount, p.currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold capitalize admin-surface-body">
                    {p.planName || p.plan} {p.billingCycle ? `(${p.billingCycle})` : ""}
                  </span>
                  <span className="text-[10px] admin-surface-faint">
                    Paid {formatDate(p.paidAt || p.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={downloadingId === p.id}
                  onClick={() => downloadReceipt(p)}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border admin-shell-border px-2.5 py-2 text-xs font-medium admin-surface-body transition-colors hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50"
                >
                  <Download className="size-3.5" />
                  {downloadingId === p.id ? "Downloading..." : "Download Receipt"}
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHead>
                <AdminTableHeadRow>
                  <AdminTableTh>Invoice</AdminTableTh>
                  <AdminTableTh>Restaurant</AdminTableTh>
                  <AdminTableTh>Plan</AdminTableTh>
                  <AdminTableTh>Amount</AdminTableTh>
                  <AdminTableTh>Paid On</AdminTableTh>
                  <AdminTableTh align="right">Receipt</AdminTableTh>
                </AdminTableHeadRow>
              </AdminTableHead>
              <AdminTableBody>
                {invoiceRows.map((p) => (
                  <AdminTableRow key={p.id}>
                    <AdminTableTd>
                      <p className="break-all font-mono text-xs text-zinc-400">{p.invoiceId}</p>
                    </AdminTableTd>
                    <AdminTableTd>
                      <div className="min-w-0">
                        <p className="truncate font-medium admin-shell-text">{p.restaurantName}</p>
                        <p className="truncate text-xs admin-surface-muted">{p.adminEmail}</p>
                      </div>
                    </AdminTableTd>
                    <AdminTableTd>
                      <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold capitalize admin-surface-body">
                        {p.planName || p.plan} {p.billingCycle ? `(${p.billingCycle})` : ""}
                      </span>
                    </AdminTableTd>
                    <AdminTableTd>
                      <p className="font-semibold tabular-nums admin-shell-text">
                        {formatSaMoney(p.amount, p.currency)}
                      </p>
                    </AdminTableTd>
                    <AdminTableTd className="whitespace-nowrap text-xs admin-surface-faint">
                      {formatDate(p.paidAt || p.createdAt)}
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
          </div>

          <div className="px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={pagination.pages}
              total={pagination.total}
              pageSize={20}
              onPageChange={setPage}
              hideWhenSinglePage
            />
          </div>
        </DataTableShell>
      )}
      </>
      )}

      {ToastUI}
    </div>
  );
}
