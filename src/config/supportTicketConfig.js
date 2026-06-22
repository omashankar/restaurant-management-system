export const SUPPORT_PRIORITIES = ["low", "medium", "high", "urgent"];
export const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"];

export function normalizeTicketStatus(status) {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

const PRIORITY_BADGE = {
  low: "bg-zinc-500/15 text-zinc-500 ring-zinc-500/25",
  medium: "bg-sky-500/15 text-sky-600 ring-sky-500/25",
  high: "bg-amber-500/15 text-amber-600 ring-amber-500/25",
  urgent: "bg-red-500/15 text-red-500 ring-red-500/25",
};

const STATUS_BADGE_RA = {
  open: "bg-amber-500/15 text-amber-600 ring-amber-500/25",
  in_progress: "bg-sky-500/15 text-sky-600 ring-sky-500/25",
  resolved: "bg-ra-primary-15 text-ra-primary ring-ra-primary-25",
  closed: "bg-zinc-500/15 text-zinc-500 ring-zinc-500/25",
};

const STATUS_BADGE_SA = {
  open: "bg-amber-500/15 text-amber-600 ring-amber-500/25",
  in_progress: "bg-sky-500/15 text-sky-600 ring-sky-500/25",
  resolved: "bg-sa-accent-15 text-sa-accent ring-sa-accent-25",
  closed: "bg-zinc-500/15 text-zinc-500 ring-zinc-500/25",
};

export function ticketPriorityBadgeCls(priority) {
  const key = String(priority ?? "medium").toLowerCase();
  const tone = PRIORITY_BADGE[key] ?? PRIORITY_BADGE.medium;
  return `inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${tone}`;
}

export function ticketStatusBadgeCls(status, portal = "restaurant") {
  const key = normalizeTicketStatus(status) || "open";
  const map = portal === "super-admin" ? STATUS_BADGE_SA : STATUS_BADGE_RA;
  const tone = map[key] ?? map.open;
  return `inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${tone}`;
}

export function buildTicketStats(tickets) {
  const out = { total: tickets.length, open: 0, in_progress: 0, resolved: 0, closed: 0 };
  for (const t of tickets) {
    const key = normalizeTicketStatus(t.status);
    if (Object.prototype.hasOwnProperty.call(out, key)) out[key] += 1;
  }
  return out;
}

export const adminFilterSelectCls =
  "admin-inline-select cursor-pointer rounded-lg border admin-shell-border bg-[var(--admin-control)] px-2.5 py-1.5 text-xs admin-shell-text outline-none";

export const adminTableSelectCls =
  "admin-inline-select h-8 cursor-pointer rounded-md border admin-shell-border bg-[var(--admin-control)] px-2 text-xs admin-shell-text outline-none";

/** Solid control surface — semi-transparent badge bg breaks native option list on Windows. */
const TABLE_SELECT_BASE =
  "admin-inline-select admin-ticket-table-select h-8 w-[7.25rem] shrink-0 cursor-pointer rounded-lg border bg-[var(--admin-control)] px-2 text-center text-xs font-semibold capitalize outline-none transition-colors";

const PRIORITY_SELECT_TONE = {
  low: "border-zinc-500/45 text-zinc-400",
  medium: "border-sky-500/45 text-sky-400",
  high: "border-amber-500/45 text-amber-400",
  urgent: "border-red-500/45 text-red-400",
};

const STATUS_SELECT_RA = {
  open: "border-amber-500/45 text-amber-400",
  in_progress: "border-sky-500/45 text-sky-400",
  resolved: "border-ra-primary/50 text-ra-primary",
  closed: "border-zinc-500/45 text-zinc-400",
};

const STATUS_SELECT_SA = {
  open: "border-amber-500/45 text-amber-400",
  in_progress: "border-sky-500/45 text-sky-400",
  resolved: "border-sa-accent/50 text-sa-accent",
  closed: "border-zinc-500/45 text-zinc-400",
};

export { adminPageDrawerOverlay as supportTicketDrawerOverlayCls } from "@/config/adminSurfaceClasses";

export const supportTicketDrawerPanelCls =
  "relative flex w-full max-h-[min(92dvh,100dvh)] flex-col overflow-hidden rounded-t-2xl border admin-shell-border admin-surface-card-solid sm:h-full sm:max-h-none sm:max-w-xl sm:rounded-none sm:border-l sm:border-t-0";

/** Fixed drawer chrome — body scrolls separately so content cannot bleed through the header */
export const supportTicketDrawerHeaderCls =
  "relative z-10 flex shrink-0 items-center justify-between gap-3 border-b admin-surface-divider-b bg-[var(--admin-surface)] px-4 pb-3 pt-4 sm:pt-5";

export const supportTicketDrawerBodyCls =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]";

export const supportTicketStatsGridCls = "grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";

export const SUPPORT_STAT_ITEMS = [
  { key: "total", label: "Total", field: "total", valueCls: "admin-shell-text" },
  { key: "open", label: "Open", field: "open", valueCls: "text-amber-500" },
  { key: "in_progress", label: "In progress", field: "in_progress", valueCls: "text-sky-500" },
  { key: "resolved", label: "Resolved", field: "resolved", valueCls: "text-sa-accent" },
  { key: "closed", label: "Closed", field: "closed", valueCls: "admin-surface-muted" },
];

export const SUPPORT_STAT_ITEMS_RA = SUPPORT_STAT_ITEMS.map((item) =>
  item.key === "resolved"
    ? { ...item, valueCls: "text-ra-primary" }
    : item
);

export function ticketPrioritySelectCls(priority) {
  const key = String(priority ?? "medium").toLowerCase();
  const tone = PRIORITY_SELECT_TONE[key] ?? PRIORITY_SELECT_TONE.medium;
  return `${TABLE_SELECT_BASE} focus:ring-2 focus:ring-sky-500/25 ${tone}`;
}

export function ticketStatusSelectCls(status, portal = "super-admin") {
  const key = normalizeTicketStatus(status) || "open";
  const map = portal === "super-admin" ? STATUS_SELECT_SA : STATUS_SELECT_RA;
  const tone = map[key] ?? map.open;
  const focusRing =
    portal === "super-admin" ? "focus:ring-sa-accent/25" : "focus:ring-ra-primary/25";
  return `${TABLE_SELECT_BASE} focus:ring-2 ${focusRing} ${tone}`;
}

export const adminTableActionBtnCls =
  "inline-flex h-8 min-w-[4.5rem] shrink-0 cursor-pointer items-center justify-center rounded-lg border admin-shell-border bg-[var(--admin-control)] px-3 text-xs font-medium admin-shell-text transition-colors hover:bg-[var(--admin-hover)]";

export const supportTicketRowCardCls =
  "rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3";

/** Super Admin support tickets table grid */
export const saTicketTableGridCls =
  "grid grid-cols-[minmax(7.5rem,8.5rem)_minmax(0,1fr)_minmax(6.5rem,9rem)_7.25rem_7.25rem_4.5rem] items-center gap-x-3 gap-y-2";

/** Super Admin contact inbox table grid */
export const contactInboxTableGridCls =
  "grid w-full min-w-[48rem] grid-cols-[minmax(8rem,1fr)_minmax(10rem,1.35fr)_minmax(6.5rem,0.8fr)_minmax(7rem,0.85fr)_6.75rem_5.25rem] items-center gap-x-3 gap-y-1";
