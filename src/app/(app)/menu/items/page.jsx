"use client";

import CategoryTabs from "@/components/menu/CategoryTabs";
import MenuItemsSearch from "@/components/menu/MenuItemsSearch";
import MenuProductCard from "@/components/menu/MenuProductCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  status: "active",
  imageUrl: "",
};

function MenuGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse"
        >
          <div className="aspect-[5/3] bg-zinc-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-[75%] rounded bg-zinc-800" />
            <div className="h-4 w-1/2 rounded bg-zinc-800" />
            <div className="h-10 rounded-xl bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MenuItemsPage() {
  const { hydrated, categories, menuItems, setMenuItems } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFileLabel, setImageFileLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [hydrated]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        String(item.price).includes(q)
      );
    });
  }, [menuItems, activeCategory, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
      status: "active",
    });
    setImageFileLabel("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      categoryId: row.categoryId,
      price: String(row.price),
      description: row.description ?? "",
      status: row.status,
      imageUrl: typeof row.image === "string" ? row.image : "",
    });
    setImageFileLabel("");
    setModalOpen(true);
  };

  const resolveImage = () => {
    const url = form.imageUrl.trim();
    if (url) return url;
    if (imageFileLabel) {
      const short = imageFileLabel.replace(/\.[^.]+$/, "").slice(0, 14);
      return `https://placehold.co/600x360/18181b/10b981?text=${encodeURIComponent(short || "New")}`;
    }
    return null;
  };

  const saveItem = () => {
    const cat = categories.find((c) => c.id === form.categoryId);
    const price = parseFloat(form.price);
    if (!form.name.trim() || !cat || Number.isNaN(price)) return;

    const payload = {
      name: form.name.trim(),
      categoryId: cat.id,
      categoryName: cat.name,
      price,
      description: form.description.trim(),
      status: form.status,
      badge: null,
      image: resolveImage(),
    };

    if (editingId) {
      setMenuItems((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, ...payload, id: editingId } : m
        )
      );
    } else {
      const id = `mi-${Date.now()}`;
      setMenuItems((prev) => [...prev, { ...payload, id }]);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setMenuItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (!hydrated || loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 rounded-lg bg-zinc-800 animate-pulse" />
        <MenuGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
            Menu Items
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            POS-style catalog · filter, search, and update in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-400 hover:shadow-emerald-400/25 active:scale-[0.98]"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Add Item
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategory}
            onChange={setActiveCategory}
          />
        </div>
        <MenuItemsSearch
          value={search}
          onChange={setSearch}
          placeholder="Search name, category, price…"
        />
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No items found"
          description={
            search
              ? "Try another search or pick a different category."
              : "Add your first item or pick “All” to see the catalog."
          }
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Add Item
            </button>
          }
        />
      ) : (
        <div
          key={activeCategory}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [animation:menu-grid-in_0.4s_ease-out_both]"
        >
          {filteredItems.map((item) => (
            <MenuProductCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit menu item" : "Add menu item"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveItem}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Item name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Image upload (UI only)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImageFileLabel(e.target.files?.[0]?.name ?? "")
              }
              className="mt-1 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:font-medium file:text-zinc-200"
            />
            <p className="mt-1 text-xs text-zinc-600">
              File picks a placeholder tile unless URL above is set.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete menu item?"
        message={
          deleteTarget
            ? `Remove “${deleteTarget.name}” from the catalog?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
