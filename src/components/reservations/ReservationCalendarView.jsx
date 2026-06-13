"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import StatusBadge from "./StatusBadge";

/** Group rows by date string YYYY-MM-DD and sort dates ascending */
function groupByDate(rows) {
  const map = new Map();
  for (const r of rows) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  const dates = [...map.keys()].sort();
  return dates.map((date) => ({
    date,
    items: (map.get(date) ?? []).sort((a, b) => a.time.localeCompare(b.time)),
  }));
}

export default function ReservationCalendarView({ rows, onView, onEdit, onDelete, canDelete = true }) {
  const { formatReservationDate, formatTimeSlot } = useAdminLocale();
  const groups = groupByDate(rows);

  if (groups.length === 0) return null;

  function gridCls(count) {
    if (count <= 1) return "grid max-w-lg grid-cols-1 gap-4";
    if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
    return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  }

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      {groups.map(({ date, items }) => (
        <section key={date} className="min-w-0">
          <h3 className="sticky top-0 z-10 mb-4 inline-flex max-w-full scroll-mt-16 rounded-lg border border-ra-primary-25 bg-[var(--admin-surface)] px-3 py-1.5 text-sm font-semibold text-ra-primary backdrop-blur-sm">
            {formatReservationDate(date)}
          </h3>
          <div className={`min-w-0 ${gridCls(items.length)}`}>
            {items.map((r) => (
              <div
                key={r.id}
                className="min-w-0 rounded-2xl border admin-shell-border bg-[var(--admin-surface)] p-4 transition-colors hover:border-ra-primary-40 hover:bg-[var(--admin-hover)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold admin-shell-text">{r.customerName}</p>
                    <p className="break-all text-xs admin-surface-muted">{r.phone}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs admin-surface-muted">
                  <span className="rounded-md bg-[var(--admin-hover-strong)] px-2 py-1 font-medium admin-surface-body">
                    {formatTimeSlot(r.time)}
                  </span>
                  <span>
                    {r.guests} guests ·{" "}
                    <span className="font-mono text-ra-primary">
                      {r.tableNumber}
                    </span>
                  </span>
                  {r.area && (
                    <span className="rounded-md bg-[var(--admin-hover-strong)] px-2 py-1 admin-surface-muted">
                      {r.area}
                    </span>
                  )}
                </div>
                {r.notes ? (
                  <p className="mt-2 line-clamp-2 text-xs admin-surface-muted">
                    {r.notes}
                  </p>
                ) : null}
                <div className="mt-4 flex gap-1 admin-surface-divider-t pt-3">
                  <button
                    type="button"
                    onClick={() => onView(r)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-hover)] hover:text-sky-600"
                  >
                    <Eye className="size-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-hover)] hover:text-ra-primary"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    disabled={!canDelete}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-[var(--admin-text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
