"use client";

import { useUser } from "@/context/AuthContext";
import { Loader2, MessageSquarePlus, RefreshCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/45";

export default function SupportTicketsPage() {
  const { user } = useUser();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });

  const canModerate = user?.role === "admin" || user?.role === "manager";

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2400);
  }

  async function loadTickets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/support/tickets?${params.toString()}`, { cache: "no-store" });
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
  }, [statusFilter]);

  async function createTicket(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showToast("error", "Subject and message are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Failed to create ticket.");
        return;
      }
      setForm({ subject: "", message: "", priority: "medium" });
      showToast("success", "Ticket created.");
      loadTickets();
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdate(ticketId, payload) {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Failed to update ticket.");
        return;
      }
      showToast("success", "Ticket updated.");
      setTickets((prev) => prev.map((t) => (String(t._id) === ticketId ? data.ticket : t)));
    } catch {
      showToast("error", "Network error.");
    }
  }

  async function openTicket(ticketId) {
    setSelectedTicketId(ticketId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, { cache: "no-store" });
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
      const res = await fetch(`/api/support/tickets/${selectedTicketId}`, {
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
        prev.map((t) => (String(t._id) === String(data.ticket._id) ? data.ticket : t))
      );
      setNote("");
      showToast("success", "Note added.");
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSavingNote(false);
    }
  }

  const stats = useMemo(() => {
    const out = { total: tickets.length, open: 0, in_progress: 0, resolved: 0, closed: 0 };
    for (const t of tickets) {
      if (out[t.status] != null) out[t.status] += 1;
    }
    return out;
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Support Tickets</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Raise issues for platform support and track progress.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["total", stats.total],
          ["open", stats.open],
          ["in progress", stats.in_progress],
          ["resolved", stats.resolved],
          ["closed", stats.closed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
            <p className="text-lg font-semibold text-zinc-100">{value}</p>
            <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={createTicket} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center gap-2 text-zinc-200">
          <MessageSquarePlus className="size-4 text-emerald-400" />
          <h2 className="text-sm font-semibold">Create New Ticket</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Subject</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              className={inputCls}
              placeholder="Payment is not reflecting"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              className={inputCls}
            >
              {PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Message</label>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            className={inputCls}
            placeholder="Please describe issue with reproducible steps."
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? "Creating..." : "Create Ticket"}
        </button>
      </form>

      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">Tickets</h2>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200"
            >
              <option value="all">all</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-zinc-500">No tickets found.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div key={String(ticket._id)} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-100">
                    {ticket.ticketCode} · {ticket.subject}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}
                  </p>
                </div>
                <p className="mt-1 text-sm text-zinc-300">{ticket.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-zinc-700 px-2 py-1 text-zinc-300">
                    priority: {ticket.priority}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-2 py-1 text-zinc-300">
                    status: {ticket.status}
                  </span>
                  {canModerate ? (
                    <>
                      <select
                        value={ticket.status}
                        onChange={(e) => quickUpdate(String(ticket._id), { status: e.target.value })}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        value={ticket.priority}
                        onChange={(e) => quickUpdate(String(ticket._id), { priority: e.target.value })}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openTicket(String(ticket._id))}
                    className="cursor-pointer rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicketId ? (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/50 p-0">
          <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 pb-3 pt-1 backdrop-blur">
              <h3 className="text-base font-semibold text-zinc-100">Ticket details</h3>
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
                  <p className="mt-1 text-sm text-zinc-300">{selectedTicket.message}</p>
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Add note</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={inputCls}
                    placeholder="Add extra details or update message..."
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
