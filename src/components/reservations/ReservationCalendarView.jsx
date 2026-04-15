"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import {
  formatReservationDate,
  formatTimeSlot,
} from "@/lib/reservationUtils";

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

export default function ReservationCalendarView({ rows, onView, onEdit, onDelete }) {
  const groups = groupByDate(rows);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-8">
      {groups.map(({ date, items }) => (
        <section key={date}>
          <h3 className="sticky top-0 z-10 mb-4 inline-flex rounded-lg bg-zinc-950/90 px-3 py-1.5 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/25 backdrop-blur-sm">
            {formatReservationDate(date)}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <div
                key={r.id}
                className="group rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-4 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-emerald-500/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{r.customerName}</p>
                    <p className="text-xs text-zinc-500">{r.phone}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span className="rounded-md bg-zinc-800/80 px-2 py-1 font-medium text-zinc-300">
                    {formatTimeSlot(r.time)}
                  </span>
                  <span>
                    {r.guests} guests ·{" "}
                    <span className="font-mono text-emerald-400/90">
                      {r.tableNumber}
                    </span>
                  </span>
                  {r.area && (
                    <span className="rounded-md bg-zinc-800/80 px-2 py-1 text-zinc-400">
                      {r.area}
                    </span>
                  )}
                </div>
                {r.notes ? (
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                    {r.notes}
                  </p>
                ) : null}
                <div className="mt-4 flex gap-1 border-t border-zinc-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => onView(r)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-sky-400"
                  >
                    <Eye className="size-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-emerald-400"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-400"
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
