"use client";

import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import MenuCard from "@/components/menu/MenuCard";
import MenuItemImageField from "@/components/menu/MenuItemImageField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { DEFAULT_KITCHEN_FOR_TYPE, ITEM_TYPE_META, KITCHEN_TYPE_LABELS } from "@/types/menu";
import AdminFoodTypeIndicator from "@/components/menu/AdminFoodTypeIndicator";
import { useModuleData } from "@/context/ModuleDataContext";
import { useToast } from "@/hooks/useToast";
import SearchField from "@/components/ui/SearchField";
import PaginationBar from "@/components/ui/PaginationBar";
import DataTableShell from "@/components/ui/DataTableShell";
import { usePaginatedList } from "@/hooks/usePaginatedList";
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
import { LayoutGrid, List, Pencil, Plus, RefreshCw, Trash2, UtensilsCrossed } from "lucide-react";
import {
  EMPTY_MENU_ITEM_ERRORS,
  getMenuItemFieldErrors,
} from "@/lib/formValidation";
import { useCallback, useEffect, useMemo, useState } from "react";

const ITEM_TYPES    = ["veg", "non-veg", "egg", "drink", "halal", "other"];
const KITCHEN_TYPES = ["default_kitchen", "veg_kitchen", "non_veg_kitchen"];
const emptyForm = { name: "", categoryId: "", price: "", description: "", status: "active", imageUrl: "", itemType: "veg", prepTime: "", kitchenType: "default_kitchen", badge: "" };

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden admin-surface-card animate-pulse">
          <div className="aspect-[5/3] admin-progress-track" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded admin-progress-track" />
            <div className="h-4 w-1/2 rounded admin-progress-track" />
            <div className="h-10 rounded-xl admin-progress-track" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MenuItemsPage() {
  const [items, setItems]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode]     = useState("grid"); // grid | list
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_MENU_ITEM_ERRORS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [fetchError, setFetchError]       = useState("");
  const { refreshMenu } = useModuleData();
  const { showToast, ToastUI }          = useToast();

  /* ── Fetch items + categories ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories"),
      ]);
      const [itemsData, catsData] = await Promise.all([itemsRes.json(), catsRes.json()]);
      if (!itemsRes.ok || !catsRes.ok) {
        setFetchError(
          itemsData?.error ?? catsData?.error ?? "Could not load menu data."
        );
        return;
      }
      if (itemsData.success)  setItems(itemsData.items);
      if (catsData.success)   setCategories(catsData.categories);
      if (!itemsData.success || !catsData.success) {
        setFetchError("Could not load menu data.");
      }
    } catch {
      setFetchError("Could not load menu data. Check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const {
    search,
    setSearch,
    page,
    setPage,
    pageRows,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList(items, {
    searchKeys: ["name", "categoryName", "price"],
    pageSize: 12,
    filter: (item) => activeCategory === "all" || item.categoryId === activeCategory,
    resetKey: activeCategory,
  });

  // Only show categories that have at least one menu item
  const categoriesWithItems = useMemo(() => {
    const catIds = new Set(items.map((m) => m.categoryId));
    return categories.filter((c) => catIds.has(c.id));
  }, [categories, items]);

  const stats = useMemo(() => ({
    total:    items.length,
    active:   items.filter((m) => m.status === "active").length,
    inactive: items.filter((m) => m.status === "inactive").length,
  }), [items]);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setFormError("");
    setFieldErrors(EMPTY_MENU_ITEM_ERRORS);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name, categoryId: row.categoryId, price: String(row.price),
      description: row.description ?? "", status: row.status,
      imageUrl: row.image ?? "", itemType: row.itemType ?? "veg",
      prepTime: row.prepTime != null ? String(row.prepTime) : "",
      kitchenType: row.kitchenType ?? "default_kitchen",
      badge: row.badge ?? "",
    });
    setFormError("");
    setFieldErrors(EMPTY_MENU_ITEM_ERRORS);
    setModalOpen(true);
  };

  const save = async () => {
    const validation = getMenuItemFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setFormError(validation.message ?? "Fix the highlighted fields.");
      return;
    }
    const price = parseFloat(form.price);
    setSaving(true); setFormError("");

    const cat = categories.find((c) => c.id === form.categoryId);
    const body = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      categoryName: cat?.name ?? "",
      price,
      description: form.description.trim(),
      status: form.status,
      itemType: form.itemType,
      prepTime: form.prepTime !== "" ? parseInt(form.prepTime, 10) : null,
      kitchenType: form.kitchenType,
      image: form.imageUrl.trim() || null,
      badge: form.badge.trim() || null,
    };

    try {
      if (editingId) {
        const res  = await fetch(`/api/menu/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to update."); return; }
        setItems((prev) => prev.map((m) => m.id === editingId ? { ...m, ...body } : m));
        await Promise.all([refreshMenu(), fetchAll()]);
        showToast("Item updated successfully.");
      } else {
        const res  = await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to create."); return; }
        setItems((prev) => [data.item, ...prev]);
        await Promise.all([refreshMenu(), fetchAll()]);
        showToast("Item created successfully.");
      }
      setModalOpen(false);
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/menu/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      await Promise.all([refreshMenu(), fetchAll()]);
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full space-y-8 overflow-x-hidden">
        <div className="h-10 w-64 animate-pulse rounded-lg admin-progress-track" />
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      {fetchError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      )}
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <UtensilsCrossed className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight md:text-3xl">Menu Items</h1>
            <p className="admin-page-desc mt-1 text-sm">Full catalog · filter, search, and update.</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button type="button" onClick={fetchAll}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto">
            <RefreshCw className="size-4" />
            <span className="sm:hidden">Refresh</span>
          </button>
          <button type="button" onClick={openCreate}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-ra-primary-glow hover:brightness-110 active:scale-[0.98] sm:w-auto">
            <Plus className="size-4" strokeWidth={2.5} /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "admin-shell-text",    bg: "admin-surface-card",   border: "admin-shell-border"       },
          { label: "Active",   value: stats.active,   color: "text-ra-primary", bg: "bg-ra-primary-5", border: "border-ra-primary-20" },
          { label: "Inactive", value: stats.inactive, color: "text-zinc-500",    bg: "admin-surface-card",   border: "admin-shell-border"       },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`min-w-0 rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 ${bg} ${border}`}>
            <p className={`text-lg font-bold tabular-nums sm:text-xl ${color}`}>{value}</p>
            <p className="mt-0.5 text-[11px] admin-surface-muted sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Category tabs + search + view toggle */}
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        {/* Category pills */}
        <div className="min-w-0 flex-1 overflow-x-auto bg-transparent pb-1 [scrollbar-width:none]">
          <div className="flex min-w-max gap-2 bg-transparent">
            {[{ id: "all", name: "All" }, ...categoriesWithItems].map((cat) => (
              <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-ra-primary text-zinc-950 shadow-ra-primary-glow"
                    : "border admin-shell-border bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] shadow-sm hover:bg-[var(--admin-hover)]"
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* Search */}
          <SearchField
            className="w-full sm:w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            inputClassName="focus-ra-primary"
          />
          {/* View toggle */}
          <div className="flex w-full rounded-xl border admin-shell-border p-0.5 sm:w-auto">
            <button type="button" onClick={() => setViewMode("grid")}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:flex-none ${viewMode === "grid" ? "bg-ra-primary text-zinc-950" : "text-zinc-500 hover:admin-surface-body"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button type="button" onClick={() => setViewMode("list")}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:flex-none ${viewMode === "list" ? "bg-ra-primary text-zinc-950" : "text-zinc-500 hover:admin-surface-body"}`}>
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Items */}
      {total === 0 ? (
        <EmptyState
          title="No items found"
          description={search ? "Try a different search." : "Add your first menu item."}
          action={<button type="button" onClick={openCreate} className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110">Add Item</button>}
        />
      ) : viewMode === "grid" ? (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageRows.map((item) => (
              <MenuCard key={item.id} variant="menu" item={item} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            hideWhenSinglePage
          />
        </>
      ) : (
        /* List view */
        <div className="min-w-0 overflow-hidden admin-surface-card">
          <div className="space-y-2 p-3 md:hidden">
            {pageRows.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-start gap-1.5 break-words font-medium admin-shell-text">
                      <span className="mt-0.5 shrink-0">
                        <AdminFoodTypeIndicator type={item.itemType} size={13} />
                      </span>
                      <span>{item.name}</span>
                    </p>
                    <p className="mt-1 text-xs admin-surface-muted">{item.categoryName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <AdminTableIconButton onClick={() => openEdit(item)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton variant="danger" onClick={() => setDeleteTarget(item)} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </AdminTableIconButton>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular-nums text-ra-primary">
                    ${Number(item.price).toFixed(2)}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                    item.status === "active"
                      ? "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25"
                      : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
            <div className="px-1 pb-1">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                hideWhenSinglePage
              />
            </div>
          </div>

          <div className="hidden md:block">
            <DataTableShell>
              <AdminTable>
                <AdminTableHead>
                  <AdminTableHeadRow>
                    <AdminTableTh>Name</AdminTableTh>
                    <AdminTableTh>Category</AdminTableTh>
                    <AdminTableTh>Price</AdminTableTh>
                    <AdminTableTh>Status</AdminTableTh>
                    <AdminTableThActions />
                  </AdminTableHeadRow>
                </AdminTableHead>
                <AdminTableBody>
                  {pageRows.map((item) => (
                    <AdminTableRow key={item.id}>
                      <AdminTableTd className="max-w-[12rem] font-medium admin-shell-text sm:max-w-none">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <span className="shrink-0">
                            <AdminFoodTypeIndicator type={item.itemType} size={13} />
                          </span>
                          <span className="truncate">{item.name}</span>
                        </span>
                      </AdminTableTd>
                      <AdminTableTd className="admin-surface-muted">{item.categoryName}</AdminTableTd>
                      <AdminTableTd className="font-semibold tabular-nums text-ra-primary">${Number(item.price).toFixed(2)}</AdminTableTd>
                      <AdminTableTd>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                          item.status === "active"
                            ? "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25"
                            : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"
                        }`}>{item.status}</span>
                      </AdminTableTd>
                      <AdminTableActionsCell>
                        <AdminTableIconButton onClick={() => openEdit(item)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton variant="danger" onClick={() => setDeleteTarget(item)} aria-label="Delete">
                          <Trash2 className="size-4" />
                        </AdminTableIconButton>
                      </AdminTableActionsCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
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
            </DataTableShell>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Menu Item" : "Add Menu Item"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setModalOpen(false)}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 sm:w-auto">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium admin-surface-muted">Item Name *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="e.g. Grilled Chicken"
                aria-invalid={fieldErrors.name ? true : undefined}
                className={`mt-1 w-full rounded-xl border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary placeholder:admin-surface-faint ${
                  fieldErrors.name ? "border-red-500/50" : "border-zinc-700"
                }`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, categoryId: e.target.value }));
                  if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: "" }));
                }}
                aria-invalid={fieldErrors.categoryId ? true : undefined}
                className={`cursor-pointer mt-1 w-full rounded-xl border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary ${
                  fieldErrors.categoryId ? "border-red-500/50" : "border-zinc-700"
                }`}
              >
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {fieldErrors.categoryId && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.categoryId}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Price *</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => {
                  setForm((f) => ({ ...f, price: e.target.value }));
                  if (fieldErrors.price) setFieldErrors((p) => ({ ...p, price: "" }));
                }}
                placeholder="0.00"
                aria-invalid={fieldErrors.price ? true : undefined}
                className={`mt-1 w-full rounded-xl border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary ${
                  fieldErrors.price ? "border-red-500/50" : "border-zinc-700"
                }`}
              />
              {fieldErrors.price && <p className="mt-1 text-xs text-red-400">{fieldErrors.price}</p>}
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Item Type</label>
              <select value={form.itemType}
                onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value, kitchenType: DEFAULT_KITCHEN_FOR_TYPE[e.target.value] ?? "default_kitchen" }))}
                className="cursor-pointer mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary">
                {ITEM_TYPES.map((t) => {
                  const label = t.charAt(0).toUpperCase() + t.slice(1);
                  return <option key={t} value={t}>{label}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Prep Time (min)</label>
              <input type="number" inputMode="numeric" min="0" max="120" value={form.prepTime}
                onChange={(e) => setForm((f) => ({ ...f, prepTime: e.target.value }))}
                placeholder="e.g. 10"
                className="mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary" />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Kitchen</label>
              <select value={form.kitchenType} onChange={(e) => setForm((f) => ({ ...f, kitchenType: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary">
                {KITCHEN_TYPES.map((k) => <option key={k} value={k}>{KITCHEN_TYPE_LABELS[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium admin-surface-muted">Featured badge (optional)</label>
              <input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                placeholder="e.g. Chef's Pick — shows on customer home"
                className="mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary placeholder:admin-surface-faint" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium admin-surface-muted">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description…"
                className="mt-1 w-full resize-none rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary placeholder:admin-surface-faint" />
            </div>
            <div className="sm:col-span-2">
              <MenuItemImageField
                value={form.imageUrl}
                onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
                disabled={saving}
                error={fieldErrors.imageUrl}
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete menu item?"
        message={deleteTarget ? `Remove "${deleteTarget.name}" from the catalog?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
      />
      {ToastUI}
    </div>
  );
}
