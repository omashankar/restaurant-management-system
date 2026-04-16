"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import { getCategoryBadge } from "@/lib/tableCategoryColors";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { LayoutGrid, Pencil, Plus, RefreshCw, Table2, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const emptyForm = { tableNumber: "", capacity: "4", status: "available", categoryId: "" };

export default function TablesModulePage() {
  const [tables, setTables]         = useState([]);
  const [areas, setAreas]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── Fetch tables + areas ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesRes, areasRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/tables/areas"),
      ]);
      const [tablesData, areasData] = await Promise.all([tablesRes.json(), areasRes.json()]);
      if (tablesData.success) setTables(tablesData.tables);
      if (areasData.success)  setAreas(areasData.areas);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
    setModalOpen(true);
  };

  const saveTable = async () => {
    const cap = parseInt(form.capacity, 10);
    if (!form.tableNumber.trim() || Number.isNaN(cap) || cap < 1) {
      setFormError("Table number and valid capacity are required.");
      return;
    }
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
      } else {
        const res  = await fetch("/api/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to create."); return; }
        setTables((prev) => [data.table, ...prev]);
      }
      setModalOpen(false);
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/tables/${deleteTarget.id}`, { method: "DELETE" });
    setTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
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
          <button type="button" onClick={openCreate}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" /> Add Table
          </button>
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
            <button type="button" onClick={openCreate}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              Add Table
            </button>
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
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-zinc-400">
                    <Users className="size-3.5" />
                    <span className="font-medium text-zinc-200">{t.capacity} persons</span>
                  </div>
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
              <input value={form.tableNumber} onChange={(e) => setForm((f) => ({ ...f, tableNumber: e.target.value }))}
                placeholder="T12"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50" />
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
                <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50">
                  <option value="">— Select area —</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
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
