"use client";

import { useToast } from "@/hooks/useToast";
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  Clock, DollarSign, Download, FileText, RefreshCw, Search, XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STATUS_BADGE = {
  paid:    "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  pending: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  failed:  "bg-red-500/15 text-red-400 ring-red-500/25",
  refunded:"bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
};

const STATUS_ICON = {
  paid:    <CheckCircle2 className="size-3.5 text-emerald-400" />,
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
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]           = useState(1);
  const [downloadingId, setDownloadingId] = useState("");
  const { showToast, ToastUI }    = useToast();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search)              params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res  = await fetch(`/api/super-admin/payments?${params}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setSummary(data.summary);
        setPagination(data.pagination);
      }
    } catch { showToast("Failed to load payments.", "error"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  /* Reset to page 1 when filters change */
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const invoiceRows = payments.filter((p) => p.status === "paid" && p.paymentType === "subscription");

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
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25">
            <DollarSign className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Payments</h1>
            <p className="mt-1 text-sm text-zinc-500">Transaction history across all tenants.</p>
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
            onClick={() => setActiveTab("transactions")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "transactions"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "invoices"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            Invoices
          </button>
          <button type="button" onClick={fetchPayments}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {activeTab === "overview" && (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-400">
            ${summary.totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-600">{summary.paidCount} paid transactions</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Transactions</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">{pagination.total}</p>
          <p className="mt-1 text-xs text-zinc-600">All statuses</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Showing</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-400">{payments.length}</p>
          <p className="mt-1 text-xs text-zinc-600">Page {pagination.page} of {pagination.pages}</p>
        </div>
      </div>
      )}

      {/* Filters */}
      {activeTab === "transactions" && (
      <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant, email, invoice…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <DollarSign className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No transactions found.</p>
          <p className="text-xs text-zinc-600">Payments will appear here once restaurants subscribe to a plan.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="hidden px-4 py-3 md:table-cell">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Method</th>
                  <th className="hidden px-4 py-3 md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-800/20">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-zinc-400">{p.invoiceId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-100">{p.restaurantName}</p>
                      <p className="text-xs text-zinc-500">{p.adminEmail}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold capitalize text-zinc-300">
                        {p.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold tabular-nums text-zinc-100">
                        ${p.amount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{p.currency}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${STATUS_BADGE[p.status] ?? STATUS_BADGE.pending}`}>
                        {STATUS_ICON[p.status]}
                        {p.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs capitalize text-zinc-500">{p.method}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-600 md:table-cell">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-600">
                {pagination.total} total · page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {activeTab === "invoices" && (
      <>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : invoiceRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <FileText className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No subscription invoices available.</p>
          <p className="text-xs text-zinc-600">Paid subscription receipts will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="hidden px-4 py-3 md:table-cell">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="hidden px-4 py-3 md:table-cell">Paid On</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {invoiceRows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-800/20">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-zinc-400">{p.invoiceId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-100">{p.restaurantName}</p>
                      <p className="text-xs text-zinc-500">{p.adminEmail}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold capitalize text-zinc-300">
                        {p.planName || p.plan} {p.billingCycle ? `(${p.billingCycle})` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold tabular-nums text-zinc-100">
                        ${p.amount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{p.currency}</span>
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-600 md:table-cell">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : (p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={downloadingId === p.id}
                        onClick={() => downloadReceipt(p)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
                      >
                        <Download className="size-3.5" />
                        {downloadingId === p.id ? "Downloading..." : "Download"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-600">
            {invoiceRows.length} subscription invoice{invoiceRows.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
      </>
      )}

      {ToastUI}
    </div>
  );
}
