"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

const STATUS_BADGE = {
  pending:  "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  approved: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  rejected: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
};

export default function PayoutRequestsSection({ settlement, showToast }) {
  const [requests, setRequests]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [showForm, setShowForm]     = useState(false);
  const [amount, setAmount]         = useState("");
  const [note, setNote]             = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/payout-requests?page=${page}`);
      const data = await res.json();
      if (data.success) { setRequests(data.requests); setPagination(data.pagination); }
    } catch { showToast("error", "Failed to load payout requests."); }
    finally { setLoading(false); }
  }, [page, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function submitRequest() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { showToast("error", "Enter a valid amount."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/payout-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, note }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Payout request ${data.requestId} submitted.`);
        setShowForm(false);
        setAmount("");
        setNote("");
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
          <h2 className="text-lg font-semibold text-zinc-100">Payout Requests</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Request manual withdrawals. Min: ₹{settlement?.minWithdrawalAmount ?? 100}.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm((v) => !v)}
            className="cursor-pointer rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
            + Request Payout
          </button>
          <button type="button" onClick={fetchData}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Request form */}
      {showForm && (
        <div className="mb-5 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-200">New Payout Request</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ₹${settlement?.minWithdrawalAmount ?? 100}`}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Any note for admin"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={submitRequest} disabled={submitting}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-500">No payout requests yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Note</th>
                  <th className="hidden px-4 py-3 md:table-cell">Admin Note</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {requests.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.requestId}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-zinc-100">₹{r.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">{r.note || "—"}</td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">{r.adminNote || "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
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
