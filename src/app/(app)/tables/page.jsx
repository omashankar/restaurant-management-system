"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import { useModuleData } from "@/context/ModuleDataContext";
import { getCategoryBadge } from "@/lib/tableCategoryColors";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { LayoutGrid, Pencil, Plus, Table2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function TablesModulePage() {
  const { hydrated, floorTables, setFloorTables, tableCategories } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tableNumber: "", capacity: "4", status: "available", categoryId: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [hydrated]);

  const filterFn = useCallback((row) => {
    const st = row.status === "reserved" ? "occupied" : row.status;
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (categoryFilter !== "all" && row.categoryId !== categoryFilter) return false;
    return true;
  }, [statusFilter, categoryFilter]);

  const { search, setSearch, page, setPage, pageRows, total, totalPages, pageSize } =
    usePaginatedList(floorTables, {
      searchKeys: ["tableNumber", "zone"],
      pageSize: 8,
      filter: filterFn,
      resetKey: `${statusFilter}-${categoryFilter}`,
    });

  const defaultCategoryId = tableCategories[0]?.id ?? "";

  const openCreate = () => {
    setEditingId(null);
    setForm({ tableNumber: "", capacity: "4", status: "available", categoryId: defaultCategoryId });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    const st = row.status === "reserved" ? "occupied" : row.status;
    setForm({
      tableNumber: row.tableNumber,
      capacity: String(row.capacity),
      status: st === "occupied" ? "occupied" : "available",
      categoryId: row.categoryId ?? defaultCategoryId,
    });
    setModalOpen(true);
  };

  const saveTable = () => {
    const cap = parseInt(form.capacity, 10);
    if (!form.tableNumber.trim() || Number.isNaN(cap) || cap < 1) return;
    const cat = tableCategories.find((c) => c.id === form.categoryId);
    const payload = {
      tableNumber: form.tableNumber.trim().toUpperCase(),
      capacity: cap,
      status: form.status,
      zone: cat?.name ?? "Main",
      area: cat?.name?.toLowerCase().replace(/\s+/g, "-") ?? "general",
      categoryId: form.categoryId,
    };
    if (editingId) {
      setFloorTables((prev) => prev.map((t) => t.id === editingId ? { ...t, ...payload } : t));
    } else {
      setFloorTables((prev) => [...prev, { ...payload, id: `tbl-${Date.now()}` }]);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setFloorTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const displayStatus = (row) => row.status === "reserved" ? "occupied" : row.status;

  if (!hydrated || loading) {
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Table2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Tables</h1>
            <p className="mt-1 text-sm text-zinc-500">Floor layout · capacity and live status.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tables/areas"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100">
            <LayoutGrid className="size-4" /> Manage Areas
          </Link>
          <button type="button" onClick={openCreate}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" /> Add Table
          </button>
        </div>
      </div>

      {/* Toolbar */}
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
              {tableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {total === 0 ? (
        <EmptyState
          title="No tables"
          description="Add tables to match your floor plan."
          action={
            <button type="button" onClick={openCreate}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              Add table
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pageRows.map((t) => {
              const st = displayStatus(t);
              const cat = tableCategories.find((c) => c.id === t.categoryId);
              const badgeClass = cat ? getCategoryBadge(cat.color) : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25";
              return (
                <div key={t.id}
                  className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm transition-all duration-200 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-zinc-50">{t.tableNumber}</p>
                      <p className="text-xs text-zinc-600">{t.zone}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                      st === "available"
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                        : "bg-sky-500/15 text-sky-300 ring-sky-500/25"
                    }`}>
                      {st}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    Capacity: <span className="font-medium text-zinc-200">{t.capacity} persons</span>
                  </p>
                  {cat && (
                    <div className="mt-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass}`}>
                        {cat.name}
                      </span>
                    </div>
                  )}
                  <div className="mt-4 flex gap-1 border-t border-zinc-800/80 pt-3">
                    <button type="button" onClick={() => openEdit(t)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400">
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(t)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-400">
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <DataTableShell className="!border-0 !bg-transparent !shadow-none">
            <div className="px-1">
              <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
            </div>
          </DataTableShell>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Table" : "Add Table"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={saveTable}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Table number</label>
            <input value={form.tableNumber}
              onChange={(e) => setForm((f) => ({ ...f, tableNumber: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50"
              placeholder="T12" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Capacity</label>
            <input type="number" min={1} value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Status</label>
            <select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50">
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Area / Category</label>
            {tableCategories.length === 0 ? (
              <div className="mt-1 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-500">
                No areas yet —{" "}
                <Link href="/tables/areas" className="cursor-pointer text-emerald-400 hover:text-emerald-300">
                  create one first
                </Link>
              </div>
            ) : (
              <select value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50">
                <option value="">— Select area —</option>
                {tableCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove table?"
        message={deleteTarget ? `Table ${deleteTarget.tableNumber} will be deleted.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
