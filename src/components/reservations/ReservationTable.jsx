"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import DataTableShell from "@/components/ui/DataTableShell";
import {
  AdminTable,
  AdminTableActionsCell,
  AdminTableBody,
  AdminTableHead,
  AdminTableHeadRow,
  AdminTableIconButton,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
  AdminTableThActions,
} from "@/components/ui/AdminTable";
import StatusBadge from "./StatusBadge";
import { formatReservationDate, formatTimeSlot } from "@/lib/reservationUtils";

export default function ReservationTable({ rows, onView, onEdit, onDelete, canDelete = true }) {
  return (
    <div className="min-w-0 overflow-hidden admin-surface-card">
      <div className="space-y-2 p-3 md:hidden">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium admin-shell-text">{r.customerName}</p>
                <p className="mt-1 tabular-nums text-xs admin-surface-muted">{r.phone}</p>
                <p className="mt-0.5 text-[11px] admin-surface-faint">{r.id}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge status={r.status} />
                <div className="flex items-center gap-1">
                  <AdminTableIconButton variant="sky" onClick={() => onView(r)} aria-label="View">
                    <Eye className="size-4" />
                  </AdminTableIconButton>
                  <AdminTableIconButton onClick={() => onEdit(r)} aria-label="Edit">
                    <Pencil className="size-4" />
                  </AdminTableIconButton>
                  <AdminTableIconButton
                    variant="danger"
                    onClick={() => onDelete(r)}
                    disabled={!canDelete}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </AdminTableIconButton>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs admin-surface-muted">
              <span className="admin-surface-body">{formatReservationDate(r.date)}</span>
              <span className="tabular-nums admin-surface-body">{formatTimeSlot(r.time)}</span>
              <span>{r.guests} guest{r.guests === 1 ? "" : "s"}</span>
              <span className="font-mono text-ra-primary-muted">{r.tableNumber}</span>
              {r.area ? <span className="capitalize">{r.area}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <DataTableShell>
          <AdminTable className="min-w-[720px] w-full">
            <AdminTableHead>
              <AdminTableHeadRow>
                <AdminTableTh>Customer</AdminTableTh>
                <AdminTableTh hidden="md">Phone</AdminTableTh>
                <AdminTableTh>Date</AdminTableTh>
                <AdminTableTh>Time</AdminTableTh>
                <AdminTableTh hidden="md">Guests</AdminTableTh>
                <AdminTableTh>Table</AdminTableTh>
                <AdminTableTh hidden="lg">Area</AdminTableTh>
                <AdminTableTh>Status</AdminTableTh>
                <AdminTableThActions />
              </AdminTableHeadRow>
            </AdminTableHead>
            <AdminTableBody>
              {rows.map((r) => (
                <AdminTableRow key={r.id} className="hover:bg-[var(--admin-hover)]/35">
                  <AdminTableTd className="max-w-[10rem] sm:max-w-none">
                    <p className="truncate font-medium admin-shell-text">{r.customerName}</p>
                    <p className="truncate text-[11px] admin-surface-faint">{r.id}</p>
                  </AdminTableTd>
                  <AdminTableTd hidden="md" className="tabular-nums admin-surface-muted">{r.phone}</AdminTableTd>
                  <AdminTableTd className="admin-surface-body">{formatReservationDate(r.date)}</AdminTableTd>
                  <AdminTableTd className="tabular-nums admin-surface-body">{formatTimeSlot(r.time)}</AdminTableTd>
                  <AdminTableTd hidden="md" className="tabular-nums admin-surface-body">{r.guests}</AdminTableTd>
                  <AdminTableTd className="font-mono text-xs text-ra-primary-muted">{r.tableNumber}</AdminTableTd>
                  <AdminTableTd hidden="lg" className="text-xs capitalize admin-surface-muted">{r.area ?? "—"}</AdminTableTd>
                  <AdminTableTd>
                    <StatusBadge status={r.status} />
                  </AdminTableTd>
                  <AdminTableActionsCell>
                    <AdminTableIconButton variant="sky" onClick={() => onView(r)} aria-label="View">
                      <Eye className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton onClick={() => onEdit(r)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton variant="danger" onClick={() => onDelete(r)} disabled={!canDelete} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </AdminTableIconButton>
                  </AdminTableActionsCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </DataTableShell>
      </div>
    </div>
  );
}
