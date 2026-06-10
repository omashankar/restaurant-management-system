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
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { getInventoryFormFieldErrors } from "@/lib/formValidation";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function emptyForm() {
  return {
    name: "",
    category: "Dry goods",
    quantity: "0",
    unit: "piece",
    reorderLevel: "0",
    maxLevel: "",
    supplier: "",
    notes: "",
  };
}

function normalizeInventoryItem(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category ?? "Other",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "unit",
    reorderLevel: Number(row.reorderLevel ?? 0),
    maxLevel: row.maxLevel ?? "",
    supplier: row.supplier ?? "",
    notes: row.notes ?? "",
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
  const [fetchError, setFetchError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast, ToastUI } = useToast();

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/history?limit=80", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.history)) {
        setInventoryHistory(data.history);
      }
    } catch {
      /* keep existing */
    }
  }, [setInventoryHistory]);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    async function loadInventory() {
      setLoading(true);
      setFetchError(null);
      try {
        const [itemsRes, historyRes] = await Promise.all([
          fetch("/api/inventory", { cache: "no-store" }),
          fetch("/api/inventory/history?limit=80", { cache: "no-store" }),
        ]);
        const [itemsData, historyData] = await Promise.all([
          itemsRes.json(),
          historyRes.json(),
        ]);
        if (!alive) return;
        if (itemsRes.ok && itemsData?.success && Array.isArray(itemsData.items)) {
          setInventoryRows(itemsData.items.map(normalizeInventoryItem));
        } else {
          setFetchError(itemsData?.error ?? "Could not load inventory.");
        }
        if (historyRes.ok && historyData?.success && Array.isArray(historyData.history)) {
          setInventoryHistory(historyData.history);
        }
      } catch {
        if (alive) setFetchError("Network error while loading inventory.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadInventory();
    return () => {
      alive = false;
    };
  }, [hydrated, setInventoryRows, setInventoryHistory]);

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
      maxLevel: row.maxLevel != null ? String(row.maxLevel) : "",
      supplier: row.supplier ?? "",
      notes: row.notes ?? "",
    });
    setModalOpen(true);
  };

  const saveItem = async () => {
    const validation = getInventoryFormFieldErrors(form);
    if (!validation.valid) {
      showToast(validation.message ?? "Fix the highlighted fields.", "error");
      return;
    }
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
    try {
      if (editingId) {
        const prevRow = inventoryRows.find((r) => r.id === editingId);
        const res = await fetch(`/api/inventory/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            historyMessage:
              prevRow && prevRow.quantity !== quantity
                ? `Adjusted from ${prevRow.quantity} → ${quantity} ${payload.unit}`
                : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          showToast(data?.error ?? "Inventory update failed.", "error");
          return;
        }
        setInventoryRows((rows) =>
          rows.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
        );
        await loadHistory();
        showToast("Inventory item updated.");
      } else {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.id) {
          showToast(data?.error ?? "Inventory creation failed.", "error");
          return;
        }
        setInventoryRows((rows) => [
          ...rows,
          normalizeInventoryItem({ ...payload, id: data.id }),
        ]);
        await loadHistory();
        showToast("Inventory item added.");
      }
      setModalOpen(false);
    } catch {
      showToast("Network error while saving inventory.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/inventory/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Delete failed. Permission or server error.", "error");
        return;
      }
      setInventoryRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Inventory item deleted.");
    } catch {
      showToast("Network error while deleting inventory item.", "error");
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
        <TableSkeleton rows={8} cols={7} />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-8 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="admin-page-title text-2xl font-semibold tracking-tight">
            Inventory
          </h1>
          <p className="admin-page-desc mt-1 text-sm">
            Par levels, stock status, and movement history.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 sm:w-auto"
        >
          <Plus className="size-4" />
          Add item
        </button>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      ) : null}

      {limited ? (
        <RoleCard
          variant="limited"
          title="Manager permissions"
          description="You can adjust counts and see alerts. Supplier credentials and cost basis edits require admin."
        />
      ) : null}

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-surface-card px-4 py-3 sm:py-4 transition-colors hover:border-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total SKUs
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-50 sm:text-3xl">
            {stats.total}
          </p>
        </div>
        <div className="admin-surface-card px-4 py-3 sm:py-4 transition-colors hover:border-ra-primary-20">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            In stock
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ra-primary sm:text-3xl">
            {stats.ok}
          </p>
        </div>
        <div className="admin-surface-card px-4 py-3 sm:py-4 transition-colors hover:border-amber-500/25">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Low stock
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-400 sm:text-3xl">
            {stats.low}
          </p>
        </div>
        <div className="admin-surface-card px-4 py-3 sm:py-4 transition-colors hover:border-red-500/25">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Out of stock
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-red-400 sm:text-3xl">
            {stats.out}
          </p>
        </div>
      </div>

      <section className="min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-400" aria-hidden />
          <h2 className="text-sm font-semibold admin-shell-text">
            Attention needed
          </h2>
        </div>
        {alertItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-ra-primary-25 bg-ra-primary-5 px-4 py-4 text-sm admin-surface-muted">
            <Package className="size-5 shrink-0 text-ra-primary" />
            All items are above reorder levels.
          </div>
        ) : (
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
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
            className="w-full admin-surface-card px-3 py-2 text-sm admin-shell-text sm:w-auto"
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
          title={
            inventoryRows.length === 0
              ? "No inventory items"
              : "No matching items"
          }
          description={
            inventoryRows.length === 0
              ? "Add ingredients and supplies to track par levels and alerts."
              : statusFilter !== "all" || search.trim()
                ? "Try a different status filter or search term."
                : "No items match your filters."
          }
          action={
            inventoryRows.length === 0 ? (
              <button
                type="button"
                onClick={openCreate}
                className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950"
              >
                Add item
              </button>
            ) : statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-shell-text transition-colors hover:border-zinc-600"
              >
                Show all statuses
              </button>
            ) : null
          }
        />
      ) : (
        <InventoryTable
          rows={pageRows}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          allowDelete={!limited}
          onUpdateQty={(row, delta) => {
            if (!delta) return;
            const next = Math.max(0, row.quantity + delta);
            const historyMessage =
              delta > 0
                ? `+${delta} stock adjustment`
                : `${delta} stock adjustment`;
            fetch(`/api/inventory/${row.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantity: next, historyMessage }),
            })
              .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data?.success) {
                  showToast(data?.error ?? "Quick quantity update failed.", "error");
                  return;
                }
                setInventoryRows((prev) =>
                  prev.map((r) => (r.id === row.id ? { ...r, quantity: next } : r))
                );
                loadHistory();
              })
              .catch(() => {
                showToast("Network error while updating quantity.", "error");
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
                hideWhenSinglePage
              />
            </div>
          }
        />
      )}

      <InventoryStockHistory
        historyEntries={sortedHistory}
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
      {ToastUI}
    </div>
  );
}

