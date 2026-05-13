"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/config/paymentConfig";

const STATUS_BADGE = {
  paid:    "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  pending: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  failed:  "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  refunded:"bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",
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
      const res  = await fetch(`/api/payment-transactions?${params}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      }
    } catch { showToast("error", "Failed to load transactions."); }
    finally { setLoading(false); }
  }, [page, status, method, from, to, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [status, method, from, to]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Transaction History</h2>
          <p className="mt-1 text-sm text-zinc-500">All payment transactions for your restaurant.</p>
        </div>
        <button type="button" onClick={fetchData}
          className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs text-zinc-500">Total Revenue</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-400">₹{summary.totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-4 py-3">
          <p className="text-xs text-zinc-500">Paid Transactions</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-zinc-100">{summary.paidCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All Methods</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <Search className="size-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No transactions found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Txn ID</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="hidden px-4 py-3 md:table-cell">Customer</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {transactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{t.transactionId.slice(-8)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{t.orderId}</td>
                    <td className="hidden px-4 py-3 text-zinc-300 md:table-cell">{t.customerName}</td>
                    <td className="px-4 py-3 text-xs capitalize text-zinc-400">{PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-zinc-100">₹{t.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[t.status] ?? STATUS_BADGE.pending}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-600 md:table-cell">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
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
      )}
    </section>
  );
}
