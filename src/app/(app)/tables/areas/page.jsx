"use client";

import { CATEGORY_COLORS, getCategoryBadge } from "@/lib/tableCategoryColors";
import { useModuleData } from "@/context/ModuleDataContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_FORM = { name: "", description: "", color: "emerald" };

export default function TableAreasPage() {
  const { hydrated, tableCategories, setTableCategories, floorTables } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [hydrated]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description ?? "", color: cat.color ?? "emerald" });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setTableCategories((prev) =>
        prev.map((c) => c.id === editingId ? { ...c, name: form.name.trim(), description: form.description.trim(), color: form.color } : c)
      );
    } else {
      setTableCategories((prev) => [
        ...prev,
        { id: `tcat-${Date.now()}`, name: form.name.trim(), description: form.description.trim(), color: form.color },
      ]);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTableCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // Count tables per category
  const tableCounts = floorTables.reduce((acc, t) => {
    if (t.categoryId) acc[t.categoryId] = (acc[t.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  if (!hydrated || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
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
            <LayoutGrid className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Table Areas</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage seating areas — assign to tables for filtering.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="size-4" /> Add Area
        </button>
      </div>

      {/* Grid */}
      {tableCategories.length === 0 ? (
        <EmptyState
          title="No areas yet"
          description="Create seating areas like Indoor, Outdoor, VIP to organize your tables."
          action={
            <button type="button" onClick={openCreate}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              Add Area
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tableCategories.map((cat) => {
            const badgeClass = getCategoryBadge(cat.color);
            const count = tableCounts[cat.id] ?? 0;
            return (
              <div key={cat.id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm transition-all duration-200 hover:border-zinc-700 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeClass}`}>
                        {cat.name}
                      </span>
                      <span className="text-xs text-zinc-600">{count} table{count !== 1 ? "s" : ""}</span>
                    </div>
                    {cat.description && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-1.5 border-t border-zinc-800/80 pt-3">
                  <button type="button" onClick={() => openEdit(cat)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(cat)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-400">
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Area" : "Add Area"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={!form.name.trim()}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500">Area Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Indoor, Rooftop, VIP"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Description (optional)</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Short description"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => set("color", c.id)}
                  className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    form.color === c.id
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100 ring-1 ring-zinc-600"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  }`}>
                  <span className={`size-2.5 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          {form.name && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
              <p className="mb-2 text-xs text-zinc-600">Preview</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${getCategoryBadge(form.color)}`}>
                {form.name}
              </span>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete area?"
        message={deleteTarget ? `"${deleteTarget.name}" will be removed. Tables using this area will lose their category.` : ""}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
