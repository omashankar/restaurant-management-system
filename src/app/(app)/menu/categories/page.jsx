"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const { hydrated, categories, setCategories, setMenuItems } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [hydrated]);

  const {
    search,
    setSearch,
    page,
    setPage,
    pageRows,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList(categories, {
    searchKeys: ["name", "description"],
    pageSize: 8,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, description: row.description ?? "" });
    setModalOpen(true);
  };

  const saveCategory = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      const prevName = categories.find((c) => c.id === editingId)?.name;
      setCategories((cats) =>
        cats.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: form.name.trim(),
                description: form.description.trim(),
              }
            : c
        )
      );
      if (prevName !== form.name.trim()) {
        setMenuItems((items) =>
          items.map((m) =>
            m.categoryId === editingId
              ? { ...m, categoryName: form.name.trim() }
              : m
          )
        );
      }
    } else {
      const id = `cat-${Date.now()}`;
      setCategories((cats) => [
        ...cats,
        {
          id,
          name: form.name.trim(),
          description: form.description.trim(),
          itemCount: 0,
        },
      ]);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setMenuItems((items) => items.filter((m) => m.categoryId !== id));
    setCategories((cats) => cats.filter((c) => c.id !== id));
    setDeleteTarget(null);
  };

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 rounded-lg bg-zinc-800 animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Categories
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Group menu items for POS and printing.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="size-4" />
          Add category
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories…"
      />

      {total === 0 ? (
        <EmptyState
          title="No categories"
          description="Create a category to organize your menu."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Add category
            </button>
          }
        />
      ) : (
        <DataTableShell>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Category name</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-100">{row.name}</p>
                    {row.description ? (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {row.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">
                    {row.itemCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </DataTableShell>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit category" : "Add category"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCategory}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Category name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category?"
        message={
          deleteTarget
            ? `Removes “${deleteTarget.name}” and unlinks its menu items.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
