"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";

const STATUS_BADGE = {
  pending:  "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  approved: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  rejected: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
};

export default function RefundManagementSection({ showToast }) {
  const [requests, setRequests]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState("all");
  const [processing, setProcessing] = useState("");

  // New refund form
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ orderId: "", refundAmount: "", type: "full", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res  = await fetch(`/api/refund-requests?${params}`);
      const data = await res.json();
      if (data.success) { setRequests(data.requests); setPagination(data.pagination); }
    } catch { showToast("error", "Failed to load refunds."); }
    finally { setLoading(false); }
  }, [page, statusFilter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function processRefund(id, action) {
    setProcessing(id + action);
    try {
      const res  = await fetch(`/api/refund-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) { showToast("success", `Refund ${action}d.`); fetchData(); }
      else showToast("error", data.error ?? "Failed.");
    } catch { showToast("error", "Network error."); }
    finally { setProcessing(""); }
  }

  async function submitRefund() {
    if (!form.orderId || !form.refundAmount) {
      showToast("error", "Order ID and amount are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/refund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, refundAmount: Number(form.refundAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Refund request created.");
        setShowForm(false);
        setForm({ orderId: "", refundAmount: "", type: "full", reason: "" });
        fetchData();
      } else {
        showToast("error", data.error ?? "Failed.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setSubmitting(false); }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Refund Management</h2>
          <p className="mt-1 text-sm text-zinc-500">Approve, reject, or create refund requests.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm((v) => !v)}
            className="cursor-pointer rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
            + New Refund
          </button>
          <button type="button" onClick={fetchData}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* New refund form */}
      {showForm && (
        <div className="mb-5 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-200">Create Refund Request</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Order ID</label>
              <input value={form.orderId} onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                placeholder="ORD-C-…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Refund Amount</label>
              <input type="number" value={form.refundAmount} onChange={(e) => setForm((f) => ({ ...f, refundAmount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45">
                <option value="full">Full Refund</option>
                <option value="partial">Partial Refund</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Reason</label>
              <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Reason for refund"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={submitRefund} disabled={submitting}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-500">No refund requests found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Refund ID</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="hidden px-4 py-3 md:table-cell">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {requests.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.refundId}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{r.orderId}</td>
                    <td className="hidden px-4 py-3 text-zinc-300 md:table-cell">{r.customerName}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-zinc-100">₹{r.refundAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs capitalize text-zinc-400">{r.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button type="button"
                            onClick={() => processRefund(r.id, "approve")}
                            disabled={Boolean(processing)}
                            className="cursor-pointer rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors">
                            {processing === r.id + "approve" ? "…" : "Approve"}
                          </button>
                          <button type="button"
                            onClick={() => processRefund(r.id, "reject")}
                            disabled={Boolean(processing)}
                            className="cursor-pointer rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-colors">
                            {processing === r.id + "reject" ? "…" : "Reject"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-600">{pagination.total} total</p>
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
