"use client";

import ReservationCalendarView from "@/components/reservations/ReservationCalendarView";
import ReservationDetailModal from "@/components/reservations/ReservationDetailModal";
import ReservationFormModal from "@/components/reservations/ReservationFormModal";
import ReservationTable from "@/components/reservations/ReservationTable";
import ReservationTableSkeleton from "@/components/reservations/ReservationTableSkeleton";
import SearchFilterBar from "@/components/reservations/SearchFilterBar";
import RoleCard from "@/components/rms/RoleCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useApp } from "@/context/AppProviders";
import { useModuleData } from "@/context/ModuleDataContext";
import { useToast } from "@/hooks/useToast";
import { CalendarClock, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function normalizeReservation(row) {
  return {
    id: row.id,
    customerName: row.customerName ?? "",
    phone: row.phone ?? "",
    date: row.date ?? "",
    time: row.time ?? "",
    guests: Number(row.guests ?? 2),
    tableNumber: row.tableNumber ?? "TBD",
    area: row.area ?? "",
    notes: row.notes ?? "",
    status: row.status ?? "pending",
    createdAt: row.createdAt ?? null,
    confirmedAt: row.confirmedAt ?? null,
    completedAt: row.completedAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
  };
}

export default function ReservationsPage() {
  const { user } = useApp();
  const {
    hydrated,
    reservationRows,
    setReservationRows,
    floorTables,
    tableCategories,
  } = useModuleData();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const limited = user?.role === "manager" || user?.role === "waiter";
  const canDelete = user?.role === "admin" || user?.role === "manager";
  const { showToast, ToastUI } = useToast();

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    async function loadReservations() {
      setLoading(true);
      try {
        const res = await fetch("/api/reservations", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (res.ok && data?.success && Array.isArray(data.reservations)) {
          setReservationRows(data.reservations.map(normalizeReservation));
        }
      } catch {
        // Keep fallback/session data when API is unavailable.
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadReservations();
    return () => {
      alive = false;
    };
  }, [hydrated, setReservationRows]);

  const tableOptions = useMemo(
    () =>
      floorTables.length
        ? floorTables.map((t) => t.tableNumber)
        : ["T01", "T02", "T03", "T04", "T05"],
    [floorTables]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservationRows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      if (areaFilter !== "all" && (r.area ?? "") !== areaFilter) return false;
      if (!q) return true;
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      );
    });
  }, [reservationRows, search, dateFilter, statusFilter, areaFilter]);

  // Unique area names from categories for filter dropdown
  const areaOptions = useMemo(
    () => tableCategories.map((c) => c.name),
    [tableCategories]
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setFormOpen(true);
  };

  const saveReservation = async (payload) => {
    const body = {
      customerName: payload.customerName,
      phone: payload.phone,
      date: payload.date,
      time: payload.time,
      guests: payload.guests,
      tableNumber: payload.tableNumber,
      area: payload.area,
      notes: payload.notes,
      status: payload.status,
    };

    try {
      if (editing?.id) {
        const res = await fetch(`/api/reservations/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          showToast("Reservation update failed.", "error");
          return;
        }
        setReservationRows((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...body } : x))
        );
        showToast("Reservation updated.");
      } else {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || !data?.id) {
          showToast(data?.error ?? "Reservation creation failed.", "error");
          return;
        }
        setReservationRows((prev) => [
          ...prev,
          normalizeReservation({ ...payload, id: data.id }),
        ]);
        showToast("Reservation created.");
      }
    } catch {
      showToast("Network error while saving reservation.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      showToast("Only admin or manager can delete reservations.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/reservations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showToast("Delete failed. Permission or server error.", "error");
        return;
      }
      setReservationRows((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      setViewing((v) => (v?.id === deleteTarget.id ? null : v));
      showToast("Reservation deleted.");
    } catch {
      showToast("Network error while deleting reservation.", "error");
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <ReservationTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {limited ? (
            <RoleCard
              variant="limited"
              title="Limited access"
              description="You can view and adjust reservations within policy. Overrides may require admin approval."
            />
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                <CalendarClock className="size-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
                  Reservations
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Booking-style book · search, filter, and manage holds.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="cursor-pointer inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-400 hover:shadow-emerald-400/25 active:scale-[0.98]"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Add Reservation
            </button>
          </div>

          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            areaFilter={areaFilter}
            onAreaChange={setAreaFilter}
            areaOptions={areaOptions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {filteredRows.length === 0 ? (
            <EmptyState
              title="No reservations found"
              description="Try different filters or add a new booking."
              action={
                <button
                  type="button"
                  onClick={openAdd}
                  className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
                >
                  Add reservation
                </button>
              }
            />
          ) : viewMode === "table" ? (
            <div className="overflow-hidden transition-opacity duration-300">
              <ReservationTable
                rows={filteredRows}
                onView={setViewing}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                canDelete={canDelete}
              />
            </div>
          ) : (
            <div className="transition-opacity duration-300">
              <ReservationCalendarView
                rows={filteredRows}
                onView={setViewing}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            </div>
          )}

          <ReservationFormModal
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            editing={editing}
            tableOptions={tableOptions}
            onSave={saveReservation}
          />

          <ReservationDetailModal
            open={!!viewing}
            onClose={() => setViewing(null)}
            reservation={viewing}
          />

          <ConfirmDialog
            open={!!deleteTarget}
            title="Cancel this reservation?"
            message={
              deleteTarget
                ? `Remove booking for ${deleteTarget.customerName} on ${deleteTarget.date}?`
                : ""
            }
            confirmLabel="Delete"
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
          />
      {ToastUI}
    </div>
  );
}
