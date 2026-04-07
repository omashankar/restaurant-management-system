"use client";

import InventoryAlertCard from "@/components/inventory/InventoryAlertCard";
import InventoryFormModal from "@/components/inventory/InventoryFormModal";
import InventoryStockHistory from "@/components/inventory/InventoryStockHistory";
import InventoryTable from "@/components/inventory/InventoryTable";
import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";
import RoleCard from "@/components/rms/RoleCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useApp } from "@/context/AppProviders";
import { useModuleData } from "@/context/ModuleDataContext";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const HISTORY_CAP = 80;

function emptyForm() {
  return {
    name: "",
    category: "Dry goods",
    quantity: "0",
    unit: "",
    reorderLevel: "0",
    supplier: "",
    notes: "",
  };
}

export default function InventoryPage() {
  const { user } = useApp();
  const limited = user?.role === "manager";
  const {
    hydrated,
    inventoryRows,
    setInventoryRows,
    inventoryHistory,
    setInventoryHistory,
  } = useModuleData();

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [hydrated]);

  const filterFn = useCallback(
    (row) => {
      if (statusFilter === "all") return true;
      return computeInventoryStatus(row) === statusFilter;
    },
    [statusFilter]
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    pageRows,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList(inventoryRows, {
    searchKeys: ["name", "category", "supplier", "notes"],
    pageSize: 8,
    filter: filterFn,
    resetKey: statusFilter,
  });

  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    let ok = 0;
    for (const row of inventoryRows) {
      const s = computeInventoryStatus(row);
      if (s === "low") low += 1;
      else if (s === "out") out += 1;
      else ok += 1;
    }
    return { total: inventoryRows.length, low, out, ok };
  }, [inventoryRows]);

  const alertItems = useMemo(
    () => inventoryRows.filter((r) => computeInventoryStatus(r) !== "in"),
    [inventoryRows]
  );

  const sortedHistory = useMemo(
    () =>
      [...inventoryHistory].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [inventoryHistory]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      category: row.category,
      quantity: String(row.quantity),
      unit: row.unit,
      reorderLevel: String(row.reorderLevel),
      supplier: row.supplier ?? "",
      notes: row.notes ?? "",
    });
    setModalOpen(true);
  };

  const appendLog = (entry) => {
    setInventoryHistory((prev) => [entry, ...prev].slice(0, HISTORY_CAP));
  };

  const saveItem = () => {
    if (!form.name.trim() || !form.unit.trim()) return;
    const quantity = Math.max(0, parseInt(form.quantity, 10) || 0);
    const reorderLevel = Math.max(0, parseInt(form.reorderLevel, 10) || 0);
    const payload = {
      name: form.name.trim(),
      category: (form.category.trim() || "Other"),
      quantity,
      unit: form.unit.trim(),
      reorderLevel,
      supplier: form.supplier.trim(),
      notes: form.notes.trim(),
    };
    const ts = Date.now();

    if (editingId) {
      const prevRow = inventoryRows.find((r) => r.id === editingId);
      setInventoryRows((rows) =>
        rows.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
      );
      if (prevRow && prevRow.quantity !== quantity) {
        appendLog({
          id: `ih-${ts}`,
          itemId: editingId,
          itemName: payload.name,
          delta: quantity - prevRow.quantity,
          message: `Adjusted from ${prevRow.quantity} → ${quantity} ${payload.unit}`,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      const id = `inv-${ts}`;
      setInventoryRows((rows) => [...rows, { ...payload, id }]);
      appendLog({
        id: `ih-${ts + 1}`,
        itemId: id,
        itemName: payload.name,
        delta: quantity,
        message: `Initial stock · ${quantity} ${payload.unit}`,
        createdAt: new Date().toISOString(),
      });
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setInventoryRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-zinc-800 animate-pulse" />
        <TableSkeleton rows={8} cols={7} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Par levels, stock status, and movement history.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          <Plus className="size-4" />
          Add item
        </button>
      </div>

      {limited ? (
        <RoleCard
          variant="limited"
          title="Manager permissions"
          description="You can adjust counts and see alerts. Supplier credentials and cost basis edits require admin."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 transition-colors hover:border-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total SKUs
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-50">
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 transition-colors hover:border-emerald-500/20">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            In stock
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-400">
            {stats.ok}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 transition-colors hover:border-amber-500/25">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Low stock
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-400">
            {stats.low}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 transition-colors hover:border-red-500/25">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Out of stock
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-red-400">
            {stats.out}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-400" aria-hidden />
          <h2 className="text-sm font-semibold text-zinc-200">
            Attention needed
          </h2>
        </div>
        {alertItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-4 text-sm text-zinc-400">
            <Package className="size-5 shrink-0 text-emerald-400" />
            All items are above reorder levels.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {alertItems.map((item) => (
              <InventoryAlertCard
                key={item.id}
                item={item}
                onOpen={openEdit}
              />
            ))}
          </div>
        )}
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, category, supplier…"
        filterSlot={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">All statuses</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        }
      />

      {total === 0 ? (
        <EmptyState
          title="No inventory items"
          description="Add ingredients and supplies to track par levels and alerts."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Add item
            </button>
          }
        />
      ) : (
        <InventoryTable
          rows={pageRows}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onUpdateQty={(row, delta) => {
            const next = Math.max(0, row.quantity + delta);
            setInventoryRows((prev) =>
              prev.map((r) => r.id === row.id ? { ...r, quantity: next } : r)
            );
            appendLog({
              id: `ih-${Date.now()}`,
              itemId: row.id,
              itemName: row.name,
              delta,
              message: delta > 0 ? `+1 quick update` : `-1 quick update`,
              createdAt: new Date().toISOString(),
            });
          }}
          footer={
            <div className="px-4 pb-4">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          }
        />
      )}

      <InventoryStockHistory
        historyEntries={sortedHistory.slice(0, 12)}
        items={inventoryRows}
      />

      <InventoryFormModal
        open={modalOpen}
        title={editingId ? "Edit item" : "Add item"}
        form={form}
        onChange={setForm}
        onClose={() => setModalOpen(false)}
        onSubmit={saveItem}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove item?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}” from inventory? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
