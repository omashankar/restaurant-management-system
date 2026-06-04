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
    <DataTableShell>
      <AdminTable className="min-w-[800px] w-full">
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
              <AdminTableTd>
                <p className="font-medium admin-shell-text">{r.customerName}</p>
                <p className="text-[11px] admin-surface-faint">{r.id}</p>
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
  );
}
