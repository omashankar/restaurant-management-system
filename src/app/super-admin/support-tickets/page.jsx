"use client";

import SuperAdminPreloader from "@/components/super-admin/SuperAdminPreloader";
import DataTableShell from "@/components/ui/DataTableShell";
import {
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  SUPPORT_STAT_ITEMS,
  adminFilterSelectCls,
  adminTableActionBtnCls,
  buildTicketStats,
  saTicketTableGridCls,
  supportTicketDrawerPanelCls,
  supportTicketRowCardCls,
  supportTicketStatsGridCls,
  ticketPrioritySelectCls,
  ticketStatusSelectCls,
} from "@/config/supportTicketConfig";
import { saIconBadgeCls, saInputCls, saSpinnerCls } from "@/config/superAdminTheme";
import PaginationBar from "@/components/ui/PaginationBar";
import PageDrawer from "@/components/ui/PageDrawer";
import { LifeBuoy, Loader2, RefreshCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TICKETS_PAGE_SIZE = 15;

export default function SuperAdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [statsTickets, setStatsTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
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

  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter]);

  async function loadTickets() {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(TICKETS_PAGE_SIZE),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/super-admin/support-tickets?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/super-admin/support-tickets?stats=1", { cache: "no-store" }),
      ]);
      const data = await listRes.json();
      const statsData = await statsRes.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.pagination) setPagination(data.pagination);
      }
      else {
        const message = data.error || "Failed to load tickets.";
        setLoadError(message);
        showToast("error", message);
      }
      if (statsData.success) setStatsTickets(statsData.tickets || []);
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
  }, [statusFilter, priorityFilter, page]);

  async function updateTicket(ticketId, payload) {
    const mergeTicket = (prev) =>
      prev.map((t) => (String(t._id) === ticketId ? { ...t, ...payload } : t));
    setTickets(mergeTicket);
    setStatsTickets(mergeTicket);
    try {
      const res = await fetch(`/api/super-admin/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        showToast("error", data.error || "Update failed.");
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
    <div className="min-w-0 w-full max-w-full space-y-5 overflow-x-hidden">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${saIconBadgeCls}`}>
          <LifeBuoy className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title break-words text-2xl font-semibold tracking-tight">Support Tickets</h1>
          <p className="admin-page-desc mt-1 text-sm">Platform-wide tenant support queue.</p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      <div className={supportTicketStatsGridCls}>
        {SUPPORT_STAT_ITEMS.map(({ key, label, field, valueCls }) => (
          <div key={key} className="min-w-0 admin-surface-card px-3 py-2.5">
            <p className={`text-lg font-semibold tabular-nums ${valueCls}`}>{stats[field]}</p>
            <p className="text-xs uppercase tracking-wider admin-surface-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 admin-surface-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Filters</p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${adminFilterSelectCls} focus-sa-primary w-full sm:min-w-[8.5rem] sm:w-auto`}
          >
            <option value="all">Status: all</option>
            {SUPPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`${adminFilterSelectCls} focus-sa-primary w-full sm:min-w-[8.5rem] sm:w-auto`}
          >
            <option value="all">Priority: all</option>
            {SUPPORT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadTickets}
            disabled={loading}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border admin-shell-border px-2.5 py-2 text-xs admin-surface-body transition-colors hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCcw className={`size-3.5 ${loading ? saSpinnerCls : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <DataTableShell>
        {loading ? (
          <SuperAdminPreloader compact message="Loading tickets…" />
        ) : tickets.length === 0 ? (
          <div className="px-4 py-4 text-sm admin-surface-muted">No tickets found.</div>
        ) : (
          <>
            <div className="space-y-2 p-3 lg:hidden">
              {tickets.map((ticket) => (
                <div key={String(ticket._id)} className={`${supportTicketRowCardCls} min-w-0 space-y-3`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all font-medium admin-shell-text">{ticket.ticketCode}</p>
                      <p className="text-xs admin-surface-muted">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <p className="min-w-0 break-words text-xs admin-surface-body">
                      {ticket.restaurantName || "Unknown"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-medium admin-shell-text">{ticket.subject}</p>
                    <p className="mt-0.5 line-clamp-3 text-xs admin-surface-muted">{ticket.message}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicket(String(ticket._id), { priority: e.target.value })}
                      className={`${ticketPrioritySelectCls(ticket.priority)} w-full sm:w-[7.25rem]`}
                      aria-label={`Priority for ${ticket.ticketCode}`}
                    >
                      {SUPPORT_PRIORITIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      value={ticket.status}
                      onChange={(e) => updateTicket(String(ticket._id), { status: e.target.value })}
                      className={`${ticketStatusSelectCls(ticket.status, "super-admin")} w-full sm:w-[7.25rem]`}
                      aria-label={`Status for ${ticket.ticketCode}`}
                    >
                      {SUPPORT_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {item.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openTicket(String(ticket._id))}
                      className={`${adminTableActionBtnCls} w-full sm:w-auto`}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden min-w-0 lg:block">
        <div className={`${saTicketTableGridCls} admin-table-list-header px-4 py-2.5 text-xs uppercase tracking-wide admin-surface-muted`}>
          <span>Ticket</span>
          <span>Subject</span>
          <span>Restaurant</span>
          <span className="text-center">Priority</span>
          <span className="text-center">Status</span>
          <span className="text-center">Action</span>
        </div>

          <div className="admin-table-body">
            {tickets.map((ticket) => (
              <div
                key={String(ticket._id)}
                className={`${saTicketTableGridCls} px-4 py-3 text-sm admin-shell-text transition-colors hover:bg-[var(--admin-hover)]`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{ticket.ticketCode}</p>
                  <p className="text-xs admin-surface-muted">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{ticket.subject}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs admin-surface-muted">{ticket.message}</p>
                </div>
                <p className="min-w-0 truncate text-xs admin-surface-body">{ticket.restaurantName || "Unknown"}</p>
                <div className="flex justify-center">
                  <select
                    value={ticket.priority}
                    onChange={(e) => updateTicket(String(ticket._id), { priority: e.target.value })}
                    className={ticketPrioritySelectCls(ticket.priority)}
                    aria-label={`Priority for ${ticket.ticketCode}`}
                  >
                    {SUPPORT_PRIORITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-center">
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicket(String(ticket._id), { status: e.target.value })}
                    className={ticketStatusSelectCls(ticket.status, "super-admin")}
                    aria-label={`Status for ${ticket.ticketCode}`}
                  >
                    {SUPPORT_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-center">
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
            </div>
          </>
        )}
        {!loading && tickets.length > 0 && (
          <div className="min-w-0 px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={pagination.pages}
              total={pagination.total}
              pageSize={TICKETS_PAGE_SIZE}
              onPageChange={setPage}
              hideWhenSinglePage
            />
          </div>
        )}
      </DataTableShell>

      <PageDrawer
        open={Boolean(selectedTicketId)}
        panelClassName={supportTicketDrawerPanelCls}
        ariaLabel="Support ticket details"
      >
            <div className="sticky top-0 z-10 mb-4 flex min-w-0 items-start justify-between gap-3 admin-surface-divider-b bg-[var(--admin-surface)] pb-3 pt-1 backdrop-blur sm:items-center">
              <h3 className="min-w-0 break-words text-base font-semibold admin-shell-text sm:truncate">
                {selectedTicket?.ticketCode ? `${selectedTicket.ticketCode}` : "Support ticket"}
              </h3>
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
                  <p className="break-words text-sm font-semibold admin-shell-text">
                    {selectedTicket.ticketCode} · {selectedTicket.subject}
                  </p>
                  <p className="mt-1 text-xs admin-surface-muted">
                    {selectedTicket.restaurantName || "Unknown Restaurant"}
                  </p>
                  <p className="mt-2 break-words text-sm admin-surface-body">{selectedTicket.message}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Timeline</p>
                  <div className="space-y-2">
                    {(selectedTicket.updates || []).slice().reverse().map((u, idx) => (
                      <div key={`${u.at}-${idx}`} className="rounded-lg border admin-shell-border admin-surface-card p-2.5">
                        <p className="text-xs admin-surface-muted">
                          {u.at ? new Date(u.at).toLocaleString() : "—"} · {u.role || "user"}
                        </p>
                        <p className="mt-0.5 break-words text-sm admin-shell-text">{u.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Add internal note</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={`${saInputCls} resize-none`}
                    placeholder="Add investigation notes or resolution detail..."
                  />
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={savingNote || !note.trim()}
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-sa-primary-40 bg-sa-primary-15 px-3 py-2 text-xs font-medium text-sa-primary-muted disabled:opacity-40 sm:w-auto"
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
              ? "border-sa-accent-30 admin-surface-card text-sa-accent-muted"
              : "border-red-500/30 admin-surface-card text-red-400"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
