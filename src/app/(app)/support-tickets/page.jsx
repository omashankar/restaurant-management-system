"use client";

import { useUser } from "@/context/AuthContext";
import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import { LifeBuoy, Loader2, MessageSquarePlus, RefreshCcw, X } from "lucide-react";
import {
  EMPTY_SUPPORT_TICKET_ERRORS,
  getSupportTicketFieldErrors,
} from "@/lib/formValidation";
import {
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  SUPPORT_STAT_ITEMS_RA,
  adminFilterSelectCls,
  adminTableActionBtnCls,
  buildTicketStats,
  supportTicketDrawerPanelCls,
  supportTicketStatsGridCls,
  supportTicketRowCardCls,
  ticketPriorityBadgeCls,
  ticketPrioritySelectCls,
  ticketStatusBadgeCls,
  ticketStatusSelectCls,
} from "@/config/supportTicketConfig";
import { raInputCls } from "@/config/restaurantAdminTheme";
import PaginationBar from "@/components/ui/PaginationBar";
import PageDrawer from "@/components/ui/PageDrawer";
import { useEffect, useMemo, useState } from "react";

const TICKETS_PAGE_SIZE = 10;

const inputCls = raInputCls;

export default function SupportTicketsPage() {
  const { user } = useUser();
  const [tickets, setTickets] = useState([]);
  const [statsTickets, setStatsTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
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
  const [fieldErrors, setFieldErrors] = useState(EMPTY_SUPPORT_TICKET_ERRORS);

  const canModerate = user?.role === "admin" || user?.role === "manager";

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2400);
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function loadTickets() {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(TICKETS_PAGE_SIZE),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/support/tickets?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/support/tickets?stats=1", { cache: "no-store" }),
      ]);
      const data = await listRes.json();
      const statsData = await statsRes.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.pagination) setPagination(data.pagination);
      }
      else {
        const msg = data.error || "Failed to load tickets.";
        setLoadError(msg);
        showToast("error", msg);
      }
      if (statsData.success) setStatsTickets(statsData.tickets || []);
    } catch {
      const msg = "Could not load support tickets.";
      setLoadError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  async function createTicket(e) {
    e.preventDefault();
    const validation = getSupportTicketFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      showToast("error", validation.message ?? "Subject and message are required.");
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
    const mergeTicket = (prev) =>
      prev.map((t) => (String(t._id) === ticketId ? { ...t, ...payload } : t));
    setTickets(mergeTicket);
    setStatsTickets(mergeTicket);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Failed to update ticket.");
        loadTickets();
        return;
      }
      showToast("success", "Ticket updated.");
      const applyServer = (prev) =>
        prev.map((t) => (String(t._id) === ticketId ? { ...t, ...data.ticket } : t));
      setTickets(applyServer);
      setStatsTickets(applyServer);
      if (selectedTicketId === ticketId) setSelectedTicket(data.ticket);
    } catch {
      showToast("error", "Network error.");
      loadTickets();
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
      const applyServer = (prev) =>
        prev.map((t) => (String(t._id) === String(data.ticket._id) ? { ...t, ...data.ticket } : t));
      setTickets(applyServer);
      setStatsTickets(applyServer);
      setNote("");
      showToast("success", "Note added.");
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSavingNote(false);
    }
  }

  const stats = useMemo(() => buildTicketStats(statsTickets), [statsTickets]);

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
          <LifeBuoy className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Support Tickets</h1>
          <p className="admin-page-desc mt-1 text-sm">
            Raise issues for platform support and track progress.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      <div className={supportTicketStatsGridCls}>
        {SUPPORT_STAT_ITEMS_RA.map(({ key, label, field, valueCls }) => (
          <div key={key} className="admin-surface-card px-3 py-2.5">
            <p className={`text-lg font-semibold tabular-nums ${valueCls}`}>{stats[field]}</p>
            <p className="text-xs uppercase tracking-wider admin-surface-muted">{label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={createTicket} className="space-y-4 admin-surface-card p-4 sm:p-5">
        <div className="flex items-center gap-2 admin-shell-text">
          <MessageSquarePlus className="size-4 text-ra-primary" />
          <h2 className="text-sm font-semibold">Create New Ticket</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide admin-surface-muted">Subject</label>
            <input
              value={form.subject}
              onChange={(e) => {
                setForm((p) => ({ ...p, subject: e.target.value }));
                if (fieldErrors.subject) setFieldErrors((p) => ({ ...p, subject: "" }));
              }}
              aria-invalid={fieldErrors.subject ? true : undefined}
              className={`${inputCls} ${fieldErrors.subject ? "border-red-500/50" : ""}`}
              placeholder="Payment is not reflecting"
            />
            {fieldErrors.subject && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.subject}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide admin-surface-muted">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              className={`${inputCls} focus-ra-primary`}
            >
              {SUPPORT_PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide admin-surface-muted">Message</label>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => {
              setForm((p) => ({ ...p, message: e.target.value }));
              if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: "" }));
            }}
            aria-invalid={fieldErrors.message ? true : undefined}
            className={`${inputCls} ${fieldErrors.message ? "border-red-500/50" : ""}`}
            placeholder="Please describe issue with reproducible steps."
          />
          {fieldErrors.message && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 sm:w-auto"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? "Creating..." : "Create Ticket"}
        </button>
      </form>

      <div className="space-y-3 admin-surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold admin-shell-text">Tickets</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${adminFilterSelectCls} focus-ra-primary w-full sm:min-w-[8rem] sm:w-auto`}
            >
              <option value="all">Status: all</option>
              {SUPPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadTickets}
              disabled={loading}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border admin-shell-border px-2.5 py-2 text-xs admin-surface-body transition-colors hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <RefreshCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm admin-surface-muted">
            <Loader2 className="size-4 animate-spin" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm admin-surface-muted">No tickets found.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div key={String(ticket._id)} className={supportTicketRowCardCls}>
                <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-2">
                  <p className="min-w-0 break-words text-sm font-semibold admin-shell-text">
                    {ticket.ticketCode} · {ticket.subject}
                  </p>
                  <p className="shrink-0 text-xs admin-surface-muted">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}
                  </p>
                </div>
                <p className="mt-1 break-words text-sm admin-surface-body">{ticket.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {canModerate ? (
                    <>
                      <select
                        value={ticket.priority}
                        onChange={(e) => quickUpdate(String(ticket._id), { priority: e.target.value })}
                        className={ticketPrioritySelectCls(ticket.priority)}
                        aria-label={`Priority for ${ticket.ticketCode}`}
                      >
                        {SUPPORT_PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <select
                        value={ticket.status}
                        onChange={(e) => quickUpdate(String(ticket._id), { status: e.target.value })}
                        className={ticketStatusSelectCls(ticket.status, "restaurant")}
                        aria-label={`Status for ${ticket.ticketCode}`}
                      >
                        {SUPPORT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <span className={ticketPriorityBadgeCls(ticket.priority)}>
                        {ticket.priority}
                      </span>
                      <span className={ticketStatusBadgeCls(ticket.status, "restaurant")}>
                        {String(ticket.status ?? "").replace(/_/g, " ")}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => openTicket(String(ticket._id))}
                    className={adminTableActionBtnCls}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && tickets.length > 0 && (
          <PaginationBar
            page={page}
            totalPages={pagination.pages}
            total={pagination.total}
            pageSize={TICKETS_PAGE_SIZE}
            onPageChange={setPage}
            hideWhenSinglePage
          />
        )}
      </div>

      <PageDrawer
        open={Boolean(selectedTicketId)}
        panelClassName={supportTicketDrawerPanelCls}
        ariaLabel="Support ticket details"
      >
            <div className="sticky top-0 z-10 mb-4 flex min-w-0 items-center justify-between gap-3 admin-surface-divider-b bg-[var(--admin-surface)] pb-3 pt-1 backdrop-blur">
              <h3 className="min-w-0 truncate text-base font-semibold admin-shell-text">Ticket details</h3>
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
                <Loader2 className="size-4 animate-spin" />
                Loading ticket...
              </div>
            ) : !selectedTicket ? (
              <p className="text-sm admin-surface-muted">Ticket not available.</p>
            ) : (
              <div className="space-y-4">
                <div className="admin-surface-card p-3">
                  <p className="break-words text-sm font-semibold admin-shell-text">
                    {selectedTicket.ticketCode} · {selectedTicket.subject}
                  </p>
                  <p className="mt-1 break-words text-sm admin-surface-body">{selectedTicket.message}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Timeline</p>
                  <div className="space-y-2">
                    {(selectedTicket.updates || []).slice().reverse().map((u, idx) => (
                      <div key={`${u.at}-${idx}`} className="rounded-lg border admin-shell-border admin-surface-card p-2.5">
                        <p className="text-xs admin-surface-muted">
                          {u.at ? new Date(u.at).toLocaleString() : "—"} · {u.role || "user"}
                        </p>
                        <p className="mt-0.5 text-sm admin-shell-text">{u.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Add note</label>
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
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-ra-primary-40 bg-ra-primary-15 px-3 py-2 text-xs font-medium text-ra-primary-muted disabled:opacity-40 sm:w-auto"
                  >
                    {savingNote ? "Saving..." : "Save note"}
                  </button>
                </div>
              </div>
            )}
          </PageDrawer>

      {toast ? (
        <div
          className={`fixed bottom-4 left-4 right-4 z-50 rounded-xl border px-4 py-2 text-sm sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm ${
            toast.type === "success"
              ? "border-ra-primary-30 admin-surface-card text-ra-primary-muted"
              : "border-red-500/30 admin-surface-card text-red-400"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
