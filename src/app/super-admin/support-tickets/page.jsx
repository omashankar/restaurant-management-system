"use client";

import SuperAdminPreloader from "@/components/super-admin/SuperAdminPreloader";
import { saSpinnerCls } from "@/config/superAdminTheme";
import { Loader2, RefreshCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function SuperAdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2200);
  }

  async function loadTickets() {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const res = await fetch(`/api/super-admin/support-tickets?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
      else {
        const message = data.error || "Failed to load tickets.";
        setLoadError(message);
        showToast("error", message);
      }
    } catch {
      const message = "Network error.";
      setLoadError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  async function updateTicket(ticketId, payload) {
    try {
      const res = await fetch(`/api/super-admin/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Update failed.");
        return;
      }
      showToast("success", "Ticket updated.");
      setTickets((prev) =>
        prev.map((t) => (String(t._id) === ticketId ? { ...t, ...data.ticket } : t))
      );
      if (selectedTicketId === ticketId) setSelectedTicket(data.ticket);
    } catch {
      showToast("error", "Network error.");
    }
  }

  async function openTicket(ticketId) {
    setSelectedTicketId(ticketId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/super-admin/support-tickets/${ticketId}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Failed to load ticket.");
        return;
      }
      setSelectedTicket(data.ticket);
    } catch {
      showToast("error", "Network error.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function addNote() {
    if (!selectedTicketId || !note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/super-admin/support-tickets/${selectedTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Could not save note.");
        return;
      }
      setSelectedTicket(data.ticket);
      setTickets((prev) =>
        prev.map((t) => (String(t._id) === String(data.ticket._id) ? { ...t, ...data.ticket } : t))
      );
      setNote("");
      showToast("success", "Note added.");
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Support Tickets</h1>
        <p className="admin-page-desc mt-1 text-sm">Platform-wide tenant support queue.</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 admin-surface-card p-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border admin-shell-border admin-surface-input px-2.5 py-1.5 text-xs admin-shell-text"
        >
          <option value="all">status: all</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border admin-shell-border admin-surface-input px-2.5 py-1.5 text-xs admin-shell-text"
        >
          <option value="all">priority: all</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={loadTickets}
          className="cursor-pointer inline-flex items-center gap-1 rounded-lg border admin-shell-border px-2.5 py-1.5 text-xs admin-surface-body hover:border-zinc-500"
        >
          <RefreshCcw className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border admin-shell-border">
        <div className="grid grid-cols-[130px_1fr_140px_110px_120px_80px] gap-2 border-b admin-shell-border admin-table-head px-4 py-2 text-xs uppercase tracking-wide text-zinc-500">
          <span>Ticket</span>
          <span>Subject</span>
          <span>Restaurant</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {loading ? (
          <SuperAdminPreloader compact message="Loading tickets…" />
        ) : tickets.length === 0 ? (
          <div className="px-4 py-4 text-sm admin-surface-muted">No tickets found.</div>
        ) : (
          <div className="divide-y admin-shell-divider">
            {tickets.map((ticket) => (
              <div
                key={String(ticket._id)}
                className="grid grid-cols-[130px_1fr_140px_110px_120px_80px] gap-2 px-4 py-3 text-sm admin-shell-text"
              >
                <div>
                  <p className="font-medium">{ticket.ticketCode}</p>
                  <p className="text-xs admin-surface-muted">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{ticket.message}</p>
                </div>
                <p className="truncate text-xs admin-surface-body">{ticket.restaurantName || "Unknown"}</p>
                <select
                  value={ticket.priority}
                  onChange={(e) => updateTicket(String(ticket._id), { priority: e.target.value })}
                  className="h-8 rounded-md border admin-shell-border admin-surface-input px-2 text-xs admin-shell-text"
                >
                  {PRIORITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={ticket.status}
                  onChange={(e) => updateTicket(String(ticket._id), { status: e.target.value })}
                  className="h-8 rounded-md border admin-shell-border admin-surface-input px-2 text-xs admin-shell-text"
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => openTicket(String(ticket._id))}
                  className="h-8 rounded-md border admin-shell-border admin-surface-input px-2 text-xs admin-shell-text"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicketId ? (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/50 p-0">
          <div className="relative h-full w-full max-w-xl overflow-y-auto border-l admin-shell-border admin-surface-card-solid p-4">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b admin-shell-border admin-surface-card pb-3 pt-1 backdrop-blur">
              <h3 className="text-base font-semibold admin-shell-text">Support ticket</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedTicketId("");
                  setSelectedTicket(null);
                  setNote("");
                }}
                className="cursor-pointer relative z-20 rounded-lg border admin-shell-border p-1.5 admin-surface-body hover:border-zinc-500"
              >
                <X className="size-4" />
              </button>
            </div>
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-sm admin-surface-muted">
                <Loader2 className={saSpinnerCls} />
                Loading ticket...
              </div>
            ) : !selectedTicket ? (
              <p className="text-sm admin-surface-muted">Ticket not available.</p>
            ) : (
              <div className="space-y-4">
                <div className="admin-surface-card p-3">
                  <p className="text-sm font-semibold admin-shell-text">
                    {selectedTicket.ticketCode} · {selectedTicket.subject}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {selectedTicket.restaurantName || "Unknown Restaurant"}
                  </p>
                  <p className="mt-2 text-sm admin-surface-body">{selectedTicket.message}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Timeline</p>
                  <div className="space-y-2">
                    {(selectedTicket.updates || []).slice().reverse().map((u, idx) => (
                      <div key={`${u.at}-${idx}`} className="rounded-lg border admin-shell-border admin-surface-card p-2.5">
                        <p className="text-xs text-zinc-400">
                          {u.at ? new Date(u.at).toLocaleString() : "—"} · {u.role || "user"}
                        </p>
                        <p className="mt-0.5 text-sm admin-shell-text">{u.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Add internal note</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none transition-colors focus-sa-primary"
                    placeholder="Add investigation notes or resolution detail..."
                  />
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={savingNote || !note.trim()}
                    className="cursor-pointer rounded-lg border border-sa-primary-40 bg-sa-primary-15 px-3 py-1.5 text-xs font-medium text-sa-primary-muted disabled:opacity-40"
                  >
                    {savingNote ? "Saving..." : "Save note"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-2 text-sm ${
            toast.type === "success"
              ? "border-sa-accent-30 admin-surface-card text-sa-accent-muted"
              : "border-red-500/30 admin-surface-card text-red-300"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
