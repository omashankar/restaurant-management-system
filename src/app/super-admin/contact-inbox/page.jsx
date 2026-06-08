"use client";

import SuperAdminPreloader from "@/components/super-admin/SuperAdminPreloader";
import DataTableShell from "@/components/ui/DataTableShell";
import PageDrawer from "@/components/ui/PageDrawer";
import PaginationBar from "@/components/ui/PaginationBar";
import SearchField from "@/components/ui/SearchField";
import {
  adminFilterSelectCls,
  adminTableActionBtnCls,
  supportTicketDrawerPanelCls,
} from "@/config/supportTicketConfig";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import { useToast } from "@/hooks/useToast";
import { AlertTriangle, Globe, Inbox, Mail, RefreshCcw, Send, Store, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 15;
const STATUSES = ["new", "read", "replied", "archived"];
const SOURCES = [
  { id: "all", label: "All sources" },
  { id: "landing_page", label: "Landing page" },
  { id: "customer_site", label: "Customer site" },
];

const STATUS_BADGE = {
  new: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  read: "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  replied: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  archived: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
};

function statusBadgeCls(status) {
  const key = String(status ?? "new").toLowerCase();
  const tone = STATUS_BADGE[key] ?? STATUS_BADGE.new;
  return `inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${tone}`;
}

function statusSelectCls(status) {
  const key = String(status ?? "new").toLowerCase();
  const tone = STATUS_BADGE[key] ?? STATUS_BADGE.new;
  return `admin-inline-select h-8 cursor-pointer rounded-md border admin-shell-border bg-[var(--admin-control)] px-2 text-xs capitalize outline-none ring-1 ${tone}`;
}

function sourceLabel(source) {
  if (source === "landing_page") return "Landing page";
  if (source === "customer_site") return "Customer site";
  return source || "Unknown";
}

function formatWhen(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SuperAdminContactInboxPage() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, read: 0, replied: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const { showToast, ToastUI } = useToast();

  async function refreshStats() {
    try {
      const statsRes = await fetch("/api/super-admin/contact-messages?stats=1", { cache: "no-store" });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats ?? {});
        setEmailConfigured(statsData.stats?.emailConfigured !== false);
      }
    } catch {
      /* non-blocking */
    }
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sourceFilter, search]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (search.trim()) params.set("q", search.trim());

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/super-admin/contact-messages?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/super-admin/contact-messages?stats=1", { cache: "no-store" }),
      ]);
      const data = await listRes.json();
      const statsData = await statsRes.json();

      if (data.success) {
        setMessages(data.messages ?? []);
        setPagination(data.pagination ?? { total: 0, pages: 1 });
      } else {
        const message = data.error || "Failed to load messages.";
        setLoadError(message);
        showToast(message, "error");
      }

      if (statsData.success) {
        setStats(statsData.stats ?? {});
        setEmailConfigured(statsData.stats?.emailConfigured !== false);
      }
    } catch {
      const message = "Network error.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sourceFilter, search, showToast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function updateStatus(messageId, status) {
    const apply = (prev) =>
      prev.map((m) => (String(m._id) === messageId ? { ...m, status } : m));
    setMessages(apply);
    if (selected && String(selected._id) === messageId) {
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    }

    try {
      const res = await fetch(`/api/super-admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Update failed.", "error");
        loadMessages();
        return;
      }
      const applyServer = (prev) =>
        prev.map((m) => (String(m._id) === messageId ? { ...m, ...data.message } : m));
      setMessages(applyServer);
      if (selected && String(selected._id) === messageId) setSelected(data.message);
      await refreshStats();
      showToast("Status updated.");
    } catch {
      showToast("Network error.", "error");
      loadMessages();
    }
  }

  function primeReplyForm(message) {
    const baseSubject = message?.subject || "Your inquiry";
    setReplySubject(/^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`);
    setReplyMessage(
      message?.name
        ? `Hi ${message.name},\n\nThank you for contacting us.\n\n`
        : "Hi,\n\nThank you for contacting us.\n\n"
    );
  }

  async function openMessage(messageId) {
    setSelectedId(messageId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/super-admin/contact-messages/${messageId}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Failed to load message.", "error");
        setSelectedId("");
        setSelected(null);
        return;
      }
      setSelected(data.message);
      primeReplyForm(data.message);
      const applyServer = (prev) =>
        prev.map((m) => (String(m._id) === messageId ? { ...m, ...data.message } : m));
      setMessages(applyServer);
      await refreshStats();
    } catch {
      showToast("Network error.", "error");
      setSelectedId("");
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDrawer() {
    setSelectedId("");
    setSelected(null);
    setReplySubject("");
    setReplyMessage("");
  }

  async function sendReply() {
    if (!selectedId || !replyMessage.trim()) {
      showToast("Write a reply message first.", "error");
      return;
    }
    if (replyMessage.trim().length < 5) {
      showToast("Reply must be at least 5 characters.", "error");
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`/api/super-admin/contact-messages/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: replySubject.trim(),
          message: replyMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Could not send reply.", "error");
        return;
      }

      const updated = data.contact;
      setSelected(updated);
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(updated._id) ? { ...m, ...updated } : m))
      );
      setReplyMessage("");
      await refreshStats();
      showToast("Reply sent to customer.");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSendingReply(false);
    }
  }

  const statItems = [
    { key: "new", label: "New", cls: "text-amber-400" },
    { key: "read", label: "Read", cls: "text-sky-400" },
    { key: "replied", label: "Replied", cls: "text-emerald-400" },
    { key: "total", label: "Total", cls: "admin-shell-text" },
  ];

  return (
    <div className="min-w-0 w-full max-w-full space-y-5 overflow-x-hidden">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${saIconBadgeCls}`}>
          <Inbox className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title break-words text-2xl font-semibold tracking-tight">Contact Inbox</h1>
          <p className="admin-page-desc mt-1 text-sm">
            Landing page and customer site inquiries in one place.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      {!emailConfigured && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
            <p className="text-sm text-amber-100">
              SMTP email is not configured. Set up outbound email to send replies from this inbox.
            </p>
          </div>
          <Link
            href="/super-admin/settings"
            className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-300 hover:text-white sm:w-auto"
          >
            Open Email Settings
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statItems.map(({ key, label, cls }) => (
          <div key={key} className="min-w-0 admin-surface-card px-3 py-2.5">
            <p className={`text-lg font-semibold tabular-nums ${cls}`}>{stats[key] ?? 0}</p>
            <p className="text-xs uppercase tracking-wider admin-surface-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 admin-surface-card p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <SearchField
          id="contact-inbox-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, message…"
          className="w-full sm:max-w-xs"
          clearable
          onClear={() => setSearch("")}
        />
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${adminFilterSelectCls} focus-sa-primary w-full sm:min-w-[8.5rem] sm:w-auto`}
          >
            <option value="all">Status: all</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className={`${adminFilterSelectCls} focus-sa-primary w-full sm:min-w-[9.5rem] sm:w-auto`}
          >
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadMessages}
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
          <SuperAdminPreloader compact message="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm admin-surface-muted">No contact messages yet.</div>
        ) : (
          <>
            <div className="space-y-2 p-3 lg:hidden">
              {messages.map((msg) => (
                <div key={String(msg._id)} className="min-w-0 space-y-3 rounded-xl border admin-shell-border admin-surface-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words font-medium admin-shell-text">{msg.name}</p>
                      <p className="break-all text-xs admin-surface-muted">{msg.email}</p>
                    </div>
                    <span className={statusBadgeCls(msg.status)}>{msg.status ?? "new"}</span>
                  </div>
                  <p className="line-clamp-2 text-xs admin-surface-body">{msg.message}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] admin-surface-muted">
                    <span className="inline-flex items-center gap-1">
                      {msg.source === "landing_page" ? <Globe className="size-3" /> : <Store className="size-3" />}
                      {sourceLabel(msg.source)}
                    </span>
                    <span>·</span>
                    <span>{formatWhen(msg.createdAt)}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      id={`contact-inbox-status-mobile-${msg._id}`}
                      value={msg.status ?? "new"}
                      onChange={(e) => updateStatus(String(msg._id), e.target.value)}
                      className={`${statusSelectCls(msg.status)} w-full sm:w-auto`}
                      aria-label={`Status for ${msg.name}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openMessage(String(msg._id))}
                      className={`${adminTableActionBtnCls} w-full sm:w-auto`}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden min-w-0 lg:block">
              <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_auto] gap-3 admin-table-list-header px-4 py-2.5 text-xs uppercase tracking-wide admin-surface-muted">
                <span>From</span>
                <span>Message</span>
                <span>Source</span>
                <span>Received</span>
                <span className="text-center">Status</span>
                <span className="text-center">Action</span>
              </div>
              <div className="admin-table-body">
                {messages.map((msg) => (
                  <div
                    key={String(msg._id)}
                    className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_auto] gap-3 px-4 py-3 text-sm admin-shell-text transition-colors hover:bg-[var(--admin-hover)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{msg.name}</p>
                      <p className="truncate text-xs admin-surface-muted">{msg.email}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{msg.subject || "General inquiry"}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs admin-surface-muted">{msg.message}</p>
                    </div>
                    <p className="min-w-0 truncate text-xs admin-surface-body">{sourceLabel(msg.source)}</p>
                    <p className="min-w-0 text-xs admin-surface-muted">{formatWhen(msg.createdAt)}</p>
                    <div className="flex justify-center">
                      <select
                        id={`contact-inbox-status-desktop-${msg._id}`}
                        value={msg.status ?? "new"}
                        onChange={(e) => updateStatus(String(msg._id), e.target.value)}
                        className={statusSelectCls(msg.status)}
                        aria-label={`Status for ${msg.name}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => openMessage(String(msg._id))}
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
        {!loading && messages.length > 0 && (
          <div className="min-w-0 px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={pagination.pages}
              total={pagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              hideWhenSinglePage
            />
          </div>
        )}
      </DataTableShell>

      <PageDrawer
        open={Boolean(selectedId)}
        panelClassName={supportTicketDrawerPanelCls}
        ariaLabel="Contact message details"
      >
        <div className="sticky top-0 z-10 mb-4 flex min-w-0 items-start justify-between gap-3 admin-surface-divider-b bg-[var(--admin-surface)] pb-3 pt-1 backdrop-blur sm:items-center">
          <h3 className="min-w-0 break-words text-base font-semibold admin-shell-text">
            {selected?.name ? `Message from ${selected.name}` : "Contact message"}
          </h3>
          <button
            type="button"
            onClick={closeDrawer}
            className="admin-surface-btn-icon shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {loadingDetail ? (
          <SuperAdminPreloader compact message="Loading…" />
        ) : !selected ? (
          <p className="text-sm admin-surface-muted">Message not available.</p>
        ) : (
          <div className="space-y-4">
            <div className="admin-surface-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusBadgeCls(selected.status)}>{selected.status ?? "new"}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 ring-1 ring-zinc-500/20">
                  {sourceLabel(selected.source)}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide admin-surface-muted">Contact</p>
              <p className="mt-1 break-words text-sm font-medium admin-shell-text">{selected.name}</p>
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your inquiry"}`)}`}
                className="mt-1 inline-flex items-center gap-1 break-all text-sm text-sa-primary hover:underline"
              >
                <Mail className="size-3.5 shrink-0" />
                {selected.email}
              </a>
              {selected.restaurantName && (
                <p className="mt-2 text-xs admin-surface-muted">
                  Restaurant: <span className="admin-shell-text">{selected.restaurantName}</span>
                </p>
              )}
              <p className="mt-3 text-xs admin-surface-muted">
                Received {formatWhen(selected.createdAt)}
              </p>
            </div>

            <div className="admin-surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Subject</p>
              <p className="mt-1 break-words text-sm admin-shell-text">{selected.subject || "General inquiry"}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide admin-surface-muted">Message</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed admin-surface-body">
                {selected.message}
              </p>
            </div>

            {(selected.replies ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Sent replies</p>
                <div className="space-y-2">
                  {[...(selected.replies ?? [])].reverse().map((reply) => (
                    <div key={reply.id} className="rounded-lg border admin-shell-border admin-surface-card p-3">
                      <p className="text-xs admin-surface-muted">
                        {reply.sentAt ? formatWhen(reply.sentAt) : "—"} · To {reply.to}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium admin-shell-text">{reply.subject}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm admin-surface-body">{reply.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form
              className="space-y-3 rounded-xl border admin-shell-border admin-surface-card p-4"
              onSubmit={(e) => {
                e.preventDefault();
                sendReply();
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Send reply</p>
              <div className="space-y-2">
                <label htmlFor={`contact-inbox-reply-subject-${selectedId}`} className="block text-xs font-medium admin-surface-muted">
                  Subject
                </label>
                <input
                  id={`contact-inbox-reply-subject-${selectedId}`}
                  name="replySubject"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  maxLength={200}
                  autoComplete="off"
                  className="w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`contact-inbox-reply-message-${selectedId}`} className="block text-xs font-medium admin-surface-muted">
                  Message
                </label>
                <textarea
                  id={`contact-inbox-reply-message-${selectedId}`}
                  name="replyMessage"
                  rows={6}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your reply to the customer…"
                  autoComplete="off"
                  className="w-full resize-none rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary"
                />
              </div>
              <button
                type="submit"
                disabled={sendingReply || !emailConfigured || !replyMessage.trim()}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sa-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingReply ? (
                  <>
                    <span className={`size-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 ${saSpinnerCls}`} />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Send reply
                  </>
                )}
              </button>
              {!emailConfigured && (
                <p className="text-xs text-amber-400">
                  Configure SMTP in{" "}
                  <Link href="/super-admin/settings" className="underline hover:text-amber-300">
                    Super Admin Settings
                  </Link>{" "}
                  to enable sending.
                </p>
              )}
            </form>

            <div className="space-y-2">
              <label htmlFor={`contact-inbox-drawer-status-${selectedId}`} className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">
                Update status
              </label>
              <select
                id={`contact-inbox-drawer-status-${selectedId}`}
                value={selected.status ?? "new"}
                onChange={(e) => updateStatus(String(selected._id), e.target.value)}
                className={`${adminFilterSelectCls} focus-sa-primary w-full`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </PageDrawer>

      {ToastUI}
    </div>
  );
}
