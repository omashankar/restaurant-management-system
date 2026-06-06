"use client";

import { useCallback, useEffect, useState } from "react";
import PaginationBar from "@/components/ui/PaginationBar";
import { RefreshCw, Search } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/config/paymentConfig";

const STATUS_BADGE = {
  paid:    "bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25",
  pending: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  failed:  "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  refunded:"bg-zinc-500/15 admin-surface-muted ring-1 ring-zinc-500/25",
};

export default function PaymentTransactionsSection({ showToast }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState({ totalAmount: 0, paidCount: 0 });
  const [pagination, setPagination]     = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [status, setStatus]             = useState("all");
  const [method, setMethod]             = useState("all");
  const [from, setFrom]                 = useState("");
  const [to, setTo]                     = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status !== "all") params.set("status", status);
      if (method !== "all") params.set("method", method);
      if (from) params.set("from", from);
      if (to)   params.set("to", to);
      const res  = await fetch(`/api/payment-transactions?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        showToast(data?.error ?? "Failed to load transactions.", "error");
      }
    } catch {
      showToast("Failed to load transactions.", "error");
    }
    finally { setLoading(false); }
  }, [page, status, method, from, to, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [status, method, from, to]);

  return (
    <section className="min-w-0 admin-surface-card p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold admin-shell-text">Transaction History</h2>
          <p className="mt-1 text-sm admin-surface-muted">Subscription payments and online order transactions for your restaurant.</p>
        </div>
        <button type="button" onClick={fetchData}
          className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2 text-sm admin-surface-muted transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ra-primary-20 bg-ra-primary-5 px-4 py-3">
          <p className="text-xs admin-surface-muted">Total Revenue</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-ra-primary">₹{summary.totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border admin-shell-border bg-[var(--admin-hover)] px-4 py-3">
          <p className="text-xs admin-surface-muted">Paid Transactions</p>
          <p className="mt-1 text-xl font-bold tabular-nums admin-shell-text">{summary.paidCount}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="w-full cursor-pointer rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2 text-sm admin-shell-text outline-none focus-ra-primary sm:w-auto">
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="w-full cursor-pointer rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2 text-sm admin-shell-text outline-none focus-ra-primary sm:w-auto">
          <option value="all">All Methods</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="w-full rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2 text-sm admin-shell-text outline-none focus-ra-primary sm:w-auto" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2 text-sm admin-shell-text outline-none focus-ra-primary sm:w-auto" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse admin-surface-card" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed admin-shell-border py-16 text-center">
          <Search className="size-8 text-zinc-700" />
          <p className="text-sm admin-surface-muted">No transactions found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {transactions.map((t) => (
              <div key={t.id} className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs admin-surface-muted">…{t.transactionId.slice(-8)}</p>
                    <p className="mt-0.5 text-xs admin-surface-muted">Order: {t.orderId}</p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[t.status] ?? STATUS_BADGE.pending}`}>
                    {t.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="capitalize admin-surface-muted">{PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod}</span>
                  <span className="font-semibold tabular-nums admin-shell-text">₹{t.amount.toLocaleString()}</span>
                </div>
                {t.customerName ? (
                  <p className="mt-1 truncate text-xs admin-surface-body">{t.customerName}</p>
                ) : null}
                <p className="mt-1 text-xs admin-surface-faint">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
            ))}
            <div className="pt-2">
              <PaginationBar
                page={page}
                totalPages={pagination.pages}
                total={pagination.total}
                pageSize={20}
                onPageChange={setPage}
                hideWhenSinglePage
              />
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-2xl border admin-shell-border md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="admin-table-head-row text-xs font-semibold uppercase tracking-wider admin-surface-muted">
                  <th className="px-4 py-3">Txn ID</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="hidden px-4 py-3 md:table-cell">Customer</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-[var(--admin-hover)]">
                    <td className="px-4 py-3 font-mono text-xs admin-surface-muted">{t.transactionId.slice(-8)}</td>
                    <td className="px-4 py-3 text-xs admin-surface-muted">{t.orderId}</td>
                    <td className="hidden px-4 py-3 admin-surface-body md:table-cell">{t.customerName}</td>
                    <td className="px-4 py-3 text-xs capitalize admin-surface-muted">{PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums admin-shell-text">₹{t.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[t.status] ?? STATUS_BADGE.pending}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs admin-surface-faint md:table-cell">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        </div>
        </>
      )}
    </section>
  );
}
