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
import PaginationBar from "@/components/ui/PaginationBar";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useApp } from "@/context/AppProviders";
import { useModuleData } from "@/context/ModuleDataContext";
import { useToast } from "@/hooks/useToast";
import { raIconBadgeCls, raSpinnerCls, raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import { CalendarClock, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";

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
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
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

  const loadReservations = useCallback(async (silent = false) => {
    if (!hydrated) return;
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    }
    try {
      const res = await fetch("/api/reservations", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.reservations)) {
        setReservationRows(data.reservations.map(normalizeReservation));
      } else if (!silent) {
        setFetchError(data?.error ?? "Could not load reservations.");
      }
    } catch {
      if (!silent) setFetchError("Network error while loading reservations.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hydrated, setReservationRows]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  useLiveRefresh(loadReservations, { intervalMs: 15_000 });

  const refreshReservations = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      await loadReservations(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadReservations]);

  const tableOptions = useMemo(
    () =>
      floorTables.length
        ? floorTables.map((t) => t.tableNumber)
        : ["T01", "T02", "T03", "T04", "T05"],
    [floorTables]
  );

  const filterKey = `${statusFilter}|${dateFilter}|${areaFilter}`;
  const {
    search,
    setSearch,
    page,
    setPage,
    pageRows,
    filtered: filteredRows,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList(reservationRows, {
    searchKeys: ["customerName", "phone"],
    pageSize: 10,
    filter: (r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      if (areaFilter !== "all" && (r.area ?? "") !== areaFilter) return false;
      return true;
    },
    resetKey: filterKey,
  });

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
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error ?? "Reservation update failed.";
          showToast(msg, "error");
          return { ok: false, error: msg };
        }
        setReservationRows((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...body } : x))
        );
        showToast("Reservation updated.");
        return { ok: true };
      }
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.id) {
        const msg = data?.error ?? "Reservation creation failed.";
        showToast(msg, "error");
        return { ok: false, error: msg };
      }
      setReservationRows((prev) => [
        ...prev,
        normalizeReservation({ ...payload, id: data.id }),
      ]);
      showToast("Reservation created.");
      return { ok: true };
    } catch {
      const msg = "Network error while saving reservation.";
      showToast(msg, "error");
      return { ok: false, error: msg };
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
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <ReservationTableSkeleton />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      {limited ? (
            <RoleCard
              variant="limited"
              title="Limited access"
              description="You can view and adjust reservations within policy. Overrides may require admin approval."
            />
          ) : null}

          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
                <CalendarClock className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                  Reservations
                </h1>
                <p className="admin-page-desc mt-1 break-words text-sm">
                  Booking-style book · search, filter, and manage holds.
                </p>
              </div>
            </div>
            <div className="admin-page-header-actions">
              <button
                type="button"
                onClick={refreshReservations}
                disabled={refreshing}
                className={raPageRefreshBtnCls}
              >
                <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-ra-primary-glow transition-all duration-200 hover:brightness-110 hover:shadow-ra-primary-soft active:scale-[0.98] sm:w-auto"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Add Reservation
              </button>
            </div>
          </div>

          {fetchError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {fetchError}
            </div>
          ) : null}

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

          {total === 0 ? (
            <EmptyState
              title="No reservations found"
              description="Try different filters or add a new booking."
              action={
                <button
                  type="button"
                  onClick={openAdd}
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
                >
                  Add reservation
                </button>
              }
            />
          ) : viewMode === "table" ? (
            <div className="min-w-0 overflow-hidden transition-opacity duration-300">
              <ReservationTable
                rows={pageRows}
                onView={setViewing}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                canDelete={canDelete}
              />
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                hideWhenSinglePage
                className="px-1 pt-3"
              />
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden transition-opacity duration-300">
              <ReservationCalendarView
                rows={filteredRows}
                onView={setViewing}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                canDelete={canDelete}
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
