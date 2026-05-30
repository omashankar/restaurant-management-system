"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import TableCapacityIcon from "@/components/table/TableCapacityIcon";
import { getCategoryBadge } from "@/lib/tableCategoryColors";
import { useModuleData } from "@/context/ModuleDataContext";
import { useUser } from "@/context/AuthContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { LayoutGrid, Pencil, Plus, RefreshCw, ShoppingCart, Table2, Trash2, Users } from "lucide-react";
import Link from "next/link";
import {
  EMPTY_TABLE_ERRORS,
  getTableFieldErrors,
} from "@/lib/formValidation";
import { useCallback, useEffect, useState } from "react";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";

const emptyForm = { tableNumber: "", capacity: "4", status: "available", categoryId: "" };

export default function TablesModulePage() {
  const { user } = useUser();
  const { refreshMenu } = useModuleData();
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || user?.role === "manager";

  const [tables, setTables]         = useState([]);
  const [areas, setAreas]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving]         = useState(false);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_TABLE_ERRORS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast, ToastUI } = useToast();

  /* â”€â”€ Fetch tables + areas â”€â”€ */
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError("");
    }
    try {
      const [tablesRes, areasRes] = await Promise.all([
        fetch("/api/tables", { cache: "no-store" }),
        fetch("/api/tables/areas", { cache: "no-store" }),
      ]);
      const [tablesData, areasData] = await Promise.all([tablesRes.json(), areasRes.json()]);
      if (tablesData.success) setTables(tablesData.tables);
      else if (!silent) setFetchError(tablesData.error ?? "Could not load tables.");
      if (areasData.success) setAreas(areasData.areas);
      if (tablesData.success) await refreshMenu();
    } catch {
      if (!silent) setFetchError("Network error while loading tables.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [refreshMenu]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useLiveRefresh(fetchAll, { intervalMs: 15_000 });

  const filterFn = useCallback((row) => {
    const st = row.status === "reserved" ? "occupied" : row.status;
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (categoryFilter !== "all" && row.categoryId !== categoryFilter) return false;
    return true;
  }, [statusFilter, categoryFilter]);

  const { search, setSearch, page, setPage, pageRows, total, totalPages, pageSize } =
    usePaginatedList(tables, {
      searchKeys: ["tableNumber", "zone"],
      pageSize: 8,
      filter: filterFn,
      resetKey: `${statusFilter}-${categoryFilter}`,
    });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: areas[0]?.id ?? "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      tableNumber: row.tableNumber,
      capacity: String(row.capacity),
      status: row.status === "reserved" ? "occupied" : row.status,
      categoryId: row.categoryId ?? "",
    });
    setFormError("");
    setFieldErrors(EMPTY_TABLE_ERRORS);
    setModalOpen(true);
  };

  const saveTable = async () => {
    const validation = getTableFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setFormError(validation.message ?? "Fix the highlighted fields.");
      return;
    }
    const cap = parseInt(form.capacity, 10);
    setSaving(true); setFormError("");

    const cat = areas.find((a) => a.id === form.categoryId);
    const body = {
      tableNumber: form.tableNumber.trim().toUpperCase(),
      capacity: cap,
      status: form.status,
      categoryId: form.categoryId || null,
      zone: cat?.name ?? "",
    };

    try {
      if (editingId) {
        const res  = await fetch(`/api/tables/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to update."); return; }
        setTables((prev) => prev.map((t) => t.id === editingId ? { ...t, ...body } : t));
        showToast("Table updated.");
      } else {
        const res  = await fetch("/api/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to create."); return; }
        setTables((prev) => [data.table, ...prev]);
        showToast("Table created.");
      }
      await refreshMenu();
      setModalOpen(false);
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/tables/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      await refreshMenu();
      showToast(`Table ${deleteTarget.tableNumber} deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fetchError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Table2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Tables</h1>
            <p className="mt-1 text-sm text-zinc-500">Floor layout · {total} table{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tables/areas"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100">
            <LayoutGrid className="size-4" /> Manage Areas
          </Link>
          <button type="button" onClick={fetchAll}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className="size-4" />
          </button>
          {isAdmin && (
            <button type="button" onClick={openCreate}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              <Plus className="size-4" /> Add Table
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search table number…"
        filterSlot={
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
              <option value="all">All areas</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        }
      />

      {/* Table cards */}
      {total === 0 ? (
        <EmptyState
          title="No tables"
          description="Add tables to match your floor plan."
          action={
            isAdmin ? (
              <button type="button" onClick={openCreate}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
                Add Table
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pageRows.map((t) => {
              const st  = t.status === "reserved" ? "occupied" : t.status;
              const cat = areas.find((a) => a.id === t.categoryId);
              const badgeClass = cat ? getCategoryBadge(cat.color) : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25";
              return (
                <div key={t.id}
                  className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm transition-all duration-200 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-zinc-50">{t.tableNumber}</p>
                      {t.zone && <p className="text-xs text-zinc-600">{t.zone}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                      st === "available"
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                        : "bg-red-500/15 text-red-300 ring-red-500/25"
                    }`}>
                      {st}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <Users className="size-3.5" />
                      <span className="font-medium text-zinc-200">{t.capacity} persons</span>
                    </div>
                    <div title={`${t.capacity} Seater Table`} className="rounded-lg border border-zinc-700/70 bg-zinc-800/70 p-1 text-zinc-300">
                      <TableCapacityIcon capacity={t.capacity} className="size-8" />
                    </div>
                  </div>
                  {cat && (
                    <div className="mt-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass}`}>
                        {cat.name}
                      </span>
                    </div>
                  )}
                  <div className="mt-4 flex flex-col gap-1 border-t border-zinc-800/80 pt-3">
                    {st === "available" && (
                      <Link
                        href={`/pos?tableId=${encodeURIComponent(t.id)}`}
                        className="cursor-pointer flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500/15 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25 transition-colors hover:bg-emerald-500/25"
                      >
                        <ShoppingCart className="size-3.5" /> Open in POS
                      </Link>
                    )}
                    <div className="flex gap-1">
                    {canEdit && (
                    <button type="button" onClick={() => openEdit(t)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400">
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    )}
                    {isAdmin && (
                    <button type="button" onClick={() => setDeleteTarget(t)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-400">
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-1">
            <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Table" : "Add Table"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={saveTable} disabled={saving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-500">Table Number *</label>
              <input
                value={form.tableNumber}
                onChange={(e) => {
                  setForm((f) => ({ ...f, tableNumber: e.target.value }));
                  if (fieldErrors.tableNumber) setFieldErrors((p) => ({ ...p, tableNumber: "" }));
                }}
                placeholder="T12"
                aria-invalid={fieldErrors.tableNumber ? true : undefined}
                className={`mt-1 w-full rounded-xl border bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 ${
                  fieldErrors.tableNumber ? "border-red-500/50" : "border-zinc-700"
                }`}
              />
              {fieldErrors.tableNumber && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.tableNumber}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-zinc-500">Capacity *</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => {
                  setForm((f) => ({ ...f, capacity: e.target.value }));
                  if (fieldErrors.capacity) setFieldErrors((p) => ({ ...p, capacity: "" }));
                }}
                aria-invalid={fieldErrors.capacity ? true : undefined}
                className={`mt-1 w-full rounded-xl border bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 ${
                  fieldErrors.capacity ? "border-red-500/50" : "border-zinc-700"
                }`}
              />
              {fieldErrors.capacity && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.capacity}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-zinc-500">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500">Area</label>
              {areas.length === 0 ? (
                <div className="mt-1 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-500">
                  No areas —{" "}
                  <Link href="/tables/areas" className="cursor-pointer text-emerald-400 hover:text-emerald-300">create one</Link>
                </div>
              ) : (
                <select
                  value={form.categoryId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, categoryId: e.target.value }));
                    if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: "" }));
                  }}
                  aria-invalid={fieldErrors.categoryId ? true : undefined}
                  className={`cursor-pointer mt-1 w-full rounded-xl border bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 ${
                    fieldErrors.categoryId ? "border-red-500/50" : "border-zinc-700"
                  }`}
                >
                  <option value="">— Select area —</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              {fieldErrors.categoryId && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.categoryId}</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove table?"
        message={deleteTarget ? `Table ${deleteTarget.tableNumber} will be deleted.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}

