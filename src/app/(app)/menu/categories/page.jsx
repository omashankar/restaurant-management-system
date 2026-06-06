"use client";

import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
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
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { useToast } from "@/hooks/useToast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { FolderTree, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  EMPTY_MENU_CATEGORY_ERRORS,
  getMenuCategoryFieldErrors,
} from "@/lib/formValidation";
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
  const [fieldErrors, setFieldErrors] = useState(EMPTY_MENU_CATEGORY_ERRORS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const { refreshMenu } = useModuleData();
  const { showToast, ToastUI } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res  = await fetch("/api/categories");
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFetchError(data?.error ?? "Could not load categories.");
        return;
      }
      setCategories(data.categories);
    } catch {
      setFetchError("Could not load categories. Check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const { search, setSearch, page, setPage, pageRows, total, totalPages, pageSize } =
    usePaginatedList(categories, { searchKeys: ["name", "description"], pageSize: 8 });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setFormError("");
    setFieldErrors(EMPTY_MENU_CATEGORY_ERRORS);
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, description: row.description ?? "" });
    setFormError("");
    setFieldErrors(EMPTY_MENU_CATEGORY_ERRORS);
    setModalOpen(true);
  };

  const save = async () => {
    const validation = getMenuCategoryFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setFormError(validation.message ?? "Category name is required.");
      return;
    }
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
      await Promise.all([refreshMenu(), fetchCategories()]);
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
      await Promise.all([refreshMenu(), fetchCategories()]);
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="h-8 w-56 animate-pulse rounded-lg admin-progress-track" />
        <TableSkeleton rows={6} cols={4} />
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
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}><FolderTree className="size-5" /></span>
          <div className="min-w-0">
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="admin-page-desc mt-1 text-sm">Group menu items for POS and printing.</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={fetchCategories}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto"
          >
            <RefreshCw className="size-4" />
            <span className="sm:hidden">Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
          >
            <Plus className="size-4" /> Add Category
          </button>
        </div>
      </div>

      <ListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search categories…" />

      {total === 0 ? (
        <EmptyState title="No categories" description="Create categories like Starters, Main Course, Drinks."
          action={<button type="button" onClick={openCreate} className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110">Add Category</button>} />
      ) : (
        <div className="min-w-0 overflow-hidden admin-surface-card">
          <div className="space-y-2 p-3 md:hidden">
            {pageRows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium admin-shell-text">{row.name}</p>
                    {row.description ? (
                      <p className="mt-1 line-clamp-2 text-xs admin-surface-muted">{row.description}</p>
                    ) : (
                      <p className="mt-1 text-xs admin-surface-faint">No description</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton variant="danger" onClick={() => setDeleteTarget(row)} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </AdminTableIconButton>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold tabular-nums admin-surface-body">
                    {row.itemCount ?? 0} item{(row.itemCount ?? 0) === 1 ? "" : "s"}
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
                    <AdminTableTh>Category</AdminTableTh>
                    <AdminTableTh>Description</AdminTableTh>
                    <AdminTableTh>Items</AdminTableTh>
                    <AdminTableThActions />
                  </AdminTableHeadRow>
                </AdminTableHead>
                <AdminTableBody>
                  {pageRows.map((row) => (
                    <AdminTableRow key={row.id}>
                      <AdminTableTd className="max-w-[10rem] font-medium admin-shell-text sm:max-w-none">
                        <span className="block truncate">{row.name}</span>
                      </AdminTableTd>
                      <AdminTableTd className="max-w-[14rem] text-xs admin-surface-muted sm:max-w-none">
                        <span className="line-clamp-2">{row.description || "—"}</span>
                      </AdminTableTd>
                      <AdminTableTd>
                        <span className="inline-flex rounded-full bg-[var(--admin-hover-strong)] px-2.5 py-0.5 text-xs font-semibold tabular-nums admin-surface-body">
                          {row.itemCount ?? 0}
                        </span>
                      </AdminTableTd>
                      <AdminTableActionsCell>
                        <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton variant="danger" onClick={() => setDeleteTarget(row)} aria-label="Delete">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Category" : "Add Category"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body hover:border-zinc-500 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 sm:w-auto"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div>
            <label className="text-xs font-medium admin-surface-muted">Category Name *</label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="e.g. Starters, Main Course, Drinks"
              aria-invalid={fieldErrors.name ? true : undefined}
              className={`mt-1 w-full rounded-xl border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary placeholder:admin-surface-faint ${
                fieldErrors.name ? "border-red-500/50" : "border-zinc-700"
              }`}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div><label className="text-xs font-medium admin-surface-muted">Description (optional)</label><textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" className="mt-1 w-full resize-none rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary placeholder:admin-surface-faint" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete category?"
        message={deleteTarget ? `"${deleteTarget.name}" will be removed. Its menu items will be uncategorized.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      {ToastUI}
    </div>
  );
}

