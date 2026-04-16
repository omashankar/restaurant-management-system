"use client";

import MenuCard from "@/components/menu/MenuCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { DEFAULT_KITCHEN_FOR_TYPE, KITCHEN_TYPE_LABELS } from "@/types/menu";
import { useToast } from "@/hooks/useToast";
import { LayoutGrid, List, Plus, RefreshCw, Search, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const ITEM_TYPES    = ["veg", "non-veg", "egg", "drink", "halal", "other"];
const KITCHEN_TYPES = ["default_kitchen", "veg_kitchen", "non_veg_kitchen"];
const emptyForm = { name: "", categoryId: "", price: "", description: "", status: "active", imageUrl: "", itemType: "veg", prepTime: "", kitchenType: "default_kitchen" };

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse">
          <div className="aspect-[5/3] bg-zinc-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
            <div className="h-4 w-1/2 rounded bg-zinc-800" />
            <div className="h-10 rounded-xl bg-zinc-800" />
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
  const [search, setSearch]         = useState("");
  const [viewMode, setViewMode]     = useState("grid"); // grid | list
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const { showToast, ToastUI }          = useToast();

  /* ── Fetch items + categories ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories"),
      ]);
      const [itemsData, catsData] = await Promise.all([itemsRes.json(), catsRes.json()]);
      if (itemsData.success)  setItems(itemsData.items);
      if (catsData.success)   setCategories(catsData.categories);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) ||
             (item.categoryName ?? "").toLowerCase().includes(q) ||
             String(item.price).includes(q);
    });
  }, [items, activeCategory, search]);

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
    });
    setFormError("");
    setModalOpen(true);
  };

  const save = async () => {
    const price = parseFloat(form.price);
    if (!form.name.trim() || !form.categoryId || Number.isNaN(price)) {
      setFormError("Name, category and price are required.");
      return;
    }
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
    };

    try {
      if (editingId) {
        const res  = await fetch(`/api/menu/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to update."); return; }
        setItems((prev) => prev.map((m) => m.id === editingId ? { ...m, ...body } : m));
        showToast("Item updated successfully.");
      } else {
        const res  = await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to create."); return; }
        setItems((prev) => [data.item, ...prev]);
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
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-zinc-800" />
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <UtensilsCrossed className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">Menu Items</h1>
            <p className="mt-1 text-sm text-zinc-500">Full catalog · filter, search, and update.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchAll}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className="size-4" />
          </button>
          <button type="button" onClick={openCreate}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98]">
            <Plus className="size-4" strokeWidth={2.5} /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "text-zinc-100",    bg: "bg-zinc-900/60",   border: "border-zinc-800"       },
          { label: "Active",   value: stats.active,   color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
          { label: "Inactive", value: stats.inactive, color: "text-zinc-500",    bg: "bg-zinc-900/40",   border: "border-zinc-800"       },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${bg} ${border}`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Category tabs + search + view toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Category pills */}
        <div className="flex-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          <div className="flex min-w-max gap-2">
            {[{ id: "all", name: "All" }, ...categories].map((cat) => (
              <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                    : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-48 rounded-xl border border-zinc-800 bg-zinc-900/70 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-zinc-800 p-0.5">
            <button type="button" onClick={() => setViewMode("grid")}
              className={`cursor-pointer flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === "grid" ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-300"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button type="button" onClick={() => setViewMode("list")}
              className={`cursor-pointer flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === "list" ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-300"}`}>
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No items found"
          description={search ? "Try a different search." : "Add your first menu item."}
          action={<button type="button" onClick={openCreate} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">Add Item</button>}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MenuCard key={item.id} variant="menu" item={item} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-medium text-zinc-100">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{item.categoryName}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">${Number(item.price).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize text-zinc-500 text-xs">{item.itemType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                      item.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                        : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"
                    }`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(item)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(item)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Menu Item" : "Add Menu Item"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500">Item Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Grilled Chicken"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Category *</label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Price *</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Item Type</label>
              <select value={form.itemType}
                onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value, kitchenType: DEFAULT_KITCHEN_FOR_TYPE[e.target.value] ?? "default_kitchen" }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Prep Time (min)</label>
              <input type="number" min="0" max="120" value={form.prepTime}
                onChange={(e) => setForm((f) => ({ ...f, prepTime: e.target.value }))}
                placeholder="e.g. 10"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Kitchen</label>
              <select value={form.kitchenType} onChange={(e) => setForm((f) => ({ ...f, kitchenType: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                {KITCHEN_TYPES.map((k) => <option key={k} value={k}>{KITCHEN_TYPE_LABELS[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description…"
                className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500">Image URL (optional)</label>
              <input type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://…"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
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
