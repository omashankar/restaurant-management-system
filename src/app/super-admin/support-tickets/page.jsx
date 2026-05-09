"use client";

import { Loader2, RefreshCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function SuperAdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const res = await fetch(`/api/super-admin/support-tickets?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
      else showToast("error", data.error || "Failed to load tickets.");
    } catch {
      showToast("error", "Network error.");
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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Support Tickets</h1>
        <p className="mt-1 text-sm text-zinc-500">Platform-wide tenant support queue.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200"
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
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200"
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
          className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
        >
          <RefreshCcw className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="grid grid-cols-[150px_1fr_160px_130px_150px] gap-2 border-b border-zinc-800 bg-zinc-950/70 px-4 py-2 text-xs uppercase tracking-wide text-zinc-500">
          <span>Ticket</span>
          <span>Subject</span>
          <span>Restaurant</span>
          <span>Priority</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-4 py-4 text-sm text-zinc-500">No tickets found.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {tickets.map((ticket) => (
              <div
                key={String(ticket._id)}
                className="grid grid-cols-[150px_1fr_160px_130px_150px] gap-2 px-4 py-3 text-sm text-zinc-200"
              >
                <div>
                  <p className="font-medium">{ticket.ticketCode}</p>
                  <p className="text-xs text-zinc-500">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{ticket.message}</p>
                </div>
                <p className="truncate text-xs text-zinc-300">{ticket.restaurantName || "Unknown"}</p>
                <select
                  value={ticket.priority}
                  onChange={(e) => updateTicket(String(ticket._id), { priority: e.target.value })}
                  className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
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
                  className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
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
                  className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
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
          <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 pb-3 pt-1 backdrop-blur">
              <h3 className="text-base font-semibold text-zinc-100">Support ticket</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedTicketId("");
                  setSelectedTicket(null);
                  setNote("");
                }}
                className="cursor-pointer relative z-20 rounded-lg border border-zinc-700 p-1.5 text-zinc-300 hover:border-zinc-500"
              >
                <X className="size-4" />
              </button>
            </div>
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" />
                Loading ticket...
              </div>
            ) : !selectedTicket ? (
              <p className="text-sm text-zinc-500">Ticket not available.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <p className="text-sm font-semibold text-zinc-100">
                    {selectedTicket.ticketCode} · {selectedTicket.subject}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {selectedTicket.restaurantName || "Unknown Restaurant"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">{selectedTicket.message}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Timeline</p>
                  <div className="space-y-2">
                    {(selectedTicket.updates || []).slice().reverse().map((u, idx) => (
                      <div key={`${u.at}-${idx}`} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
                        <p className="text-xs text-zinc-400">
                          {u.at ? new Date(u.at).toLocaleString() : "—"} · {u.role || "user"}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-200">{u.note}</p>
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/45"
                    placeholder="Add investigation notes or resolution detail..."
                  />
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={savingNote || !note.trim()}
                    className="cursor-pointer rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 disabled:opacity-40"
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
              ? "border-emerald-500/30 bg-zinc-900 text-emerald-300"
              : "border-red-500/30 bg-zinc-900 text-red-300"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
