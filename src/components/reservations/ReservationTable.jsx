"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import DataTableShell from "@/components/ui/DataTableShell";
import StatusBadge from "./StatusBadge";
import { formatReservationDate, formatTimeSlot } from "@/lib/reservationUtils";

export default function ReservationTable({ rows, onView, onEdit, onDelete, canDelete = true }) {
  return (
    <DataTableShell>
      <table className="min-w-[800px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/70 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <th className="whitespace-nowrap px-4 py-3">Customer</th>
            <th className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
              Phone
            </th>
            <th className="whitespace-nowrap px-4 py-3">Date</th>
            <th className="whitespace-nowrap px-4 py-3">Time</th>
            <th className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
              Guests
            </th>
            <th className="whitespace-nowrap px-4 py-3">Table</th>
            <th className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">Area</th>
            <th className="whitespace-nowrap px-4 py-3">Status</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {rows.map((r) => (
            <tr
              key={r.id}
              className="transition-colors duration-200 hover:bg-zinc-800/35"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-100">{r.customerName}</p>
                <p className="text-[11px] text-zinc-600">{r.id}</p>
              </td>
              <td className="hidden px-4 py-3 tabular-nums text-zinc-400 md:table-cell">
                {r.phone}
              </td>
              <td className="px-4 py-3 text-zinc-300">
                {formatReservationDate(r.date)}
              </td>
              <td className="px-4 py-3 tabular-nums text-zinc-300">
                {formatTimeSlot(r.time)}
              </td>
              <td className="hidden px-4 py-3 tabular-nums text-zinc-300 md:table-cell">
                {r.guests}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-emerald-400/90">
                {r.tableNumber}
              </td>
              <td className="hidden px-4 py-3 text-xs text-zinc-400 capitalize lg:table-cell">
                {r.area ?? "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-0.5">
                  <button
                    type="button"
                    onClick={() => onView(r)}
                    className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-sky-400"
                    aria-label="View"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-emerald-400"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    disabled={!canDelete}
                    className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
