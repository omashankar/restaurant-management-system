"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useToast } from "@/hooks/useToast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { FolderTree, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]         = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast, ToastUI } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const { search, setSearch, page, setPage, pageRows, total, totalPages, pageSize } =
    usePaginatedList(categories, { searchKeys: ["name", "description"], pageSize: 8 });

  const openCreate = () => { setEditingId(null); setForm({ name: "", description: "" }); setFormError(""); setModalOpen(true); };
  const openEdit   = (row) => { setEditingId(row.id); setForm({ name: row.name, description: row.description ?? "" }); setFormError(""); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { setFormError("Category name is required."); return; }
    setSaving(true); setFormError("");
    try {
      const url    = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!data.success) { setFormError(data.error ?? "Failed to save."); return; }
      if (editingId) {
        setCategories((prev) => prev.map((c) => c.id === editingId ? { ...c, ...form } : c));
        showToast("Category updated.");
      } else {
        setCategories((prev) => [...prev, { ...data.category, itemCount: 0 }]);
        showToast("Category created.");
      }
      setModalOpen(false);
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-800" /><TableSkeleton rows={6} cols={4} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"><FolderTree className="size-5" /></span>
          <div><h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Categories</h1><p className="mt-1 text-sm text-zinc-500">Group menu items for POS and printing.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchCategories} className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"><RefreshCw className="size-4" /></button>
          <button type="button" onClick={openCreate} className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"><Plus className="size-4" /> Add Category</button>
        </div>
      </div>

      <ListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search categoriesâ€¦" />

      {total === 0 ? (
        <EmptyState title="No categories" description="Create categories like Starters, Main Course, Drinks."
          action={<button type="button" onClick={openCreate} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">Add Category</button>} />
      ) : (
        <DataTableShell>
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Category</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Items</th><th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-800/80">
              {pageRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-medium text-zinc-100">{row.name}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{row.description || "â€”"}</td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">{row.itemCount ?? 0}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(row)} className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"><Pencil className="size-4" /></button>
                      <button type="button" onClick={() => setDeleteTarget(row)} className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4"><PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} /></div>
        </DataTableShell>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Category" : "Add Category"}
        footer={<div className="flex justify-end gap-2">
          <button type="button" onClick={() => setModalOpen(false)} className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">{saving ? "Savingâ€¦" : "Save"}</button>
        </div>}>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div><label className="text-xs font-medium text-zinc-500">Category Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Starters, Main Course, Drinks" className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" /></div>
          <div><label className="text-xs font-medium text-zinc-500">Description (optional)</label><textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete category?"
        message={deleteTarget ? `"${deleteTarget.name}" will be removed. Its menu items will be uncategorized.` : ""}
        confirmLabel={deleting ? "Deletingâ€¦" : "Delete"}
        onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      {ToastUI}
    </div>
  );
}

