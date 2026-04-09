"use client";

import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { BookOpen, Eye, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function RecipesPage() {
  const { hydrated, recipes, setRecipes, menuItems } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    menuItemId: "",
    ingredients: [""],
    steps: "",
  });

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 420);
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
  } = usePaginatedList(recipes, {
    searchKeys: ["name", "menuItemName", "ingredientsPreview"],
    pageSize: 8,
  });

  const activeMenuItems = menuItems.filter((m) => m.status === "active");

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      menuItemId: activeMenuItems[0]?.id ?? "",
      ingredients: [""],
      steps: "",
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      menuItemId: row.menuItemId,
      ingredients:
        row.ingredients?.length > 0 ? [...row.ingredients] : [""],
      steps: row.steps ?? "",
    });
    setModalOpen(true);
  };

  const saveRecipe = () => {
    const mi = menuItems.find((m) => m.id === form.menuItemId);
    if (!mi || !form.name.trim()) return;
    const ing = form.ingredients.map((s) => s.trim()).filter(Boolean);
    const preview =
      ing.slice(0, 2).join(", ") + (ing.length > 2 ? "…" : "");

    const payload = {
      name: form.name.trim(),
      menuItemId: mi.id,
      menuItemName: mi.name,
      ingredientsPreview: preview || "—",
      ingredients: ing,
      steps: form.steps.trim(),
    };

    if (editingId) {
      setRecipes((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload, id: editingId } : r))
      );
    } else {
      setRecipes((prev) => [...prev, { ...payload, id: `r-${Date.now()}` }]);
    }
    setModalOpen(false);
  };

  const addIngredientRow = () =>
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ""] }));

  const setIngredient = (i, v) =>
    setForm((f) => {
      const next = [...f.ingredients];
      next[i] = v;
      return { ...f, ingredients: next };
    });

  const removeIngredient = (i) =>
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, idx) => idx !== i),
    }));

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-zinc-800 animate-pulse" />
        <TableSkeleton rows={7} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Recipes
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Linked to menu items for kitchen consistency.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={activeMenuItems.length === 0}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          <Plus className="size-4" />
          Add recipe
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search recipes or linked item…"
      />

      {total === 0 ? (
        <EmptyState
          title="No recipes"
          description="Add active menu items first, then attach recipes."
          action={
            <button
              type="button"
              onClick={openCreate}
              disabled={activeMenuItems.length === 0}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
            >
              Add recipe
            </button>
          }
        />
      ) : (
        <DataTableShell>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Recipe</th>
                <th className="px-4 py-3">Menu item</th>
                <th className="px-4 py-3">Ingredients</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {row.menuItemName}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                    {row.ingredientsPreview}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailRecipe(row)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-sky-400"
                        aria-label="View"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
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
        title={editingId ? "Edit recipe" : "Add recipe"}
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
              onClick={saveRecipe}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Recipe name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Linked menu item</label>
            <select
              value={form.menuItemId}
              onChange={(e) =>
                setForm((f) => ({ ...f, menuItemId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            >
              {activeMenuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · ${m.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-500">Ingredients</label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="cursor-pointer text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                + Add line
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {form.ingredients.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={line}
                    onChange={(e) => setIngredient(i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                    aria-label="Remove line"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Steps</label>
            <textarea
              rows={5}
              value={form.steps}
              onChange={(e) =>
                setForm((f) => ({ ...f, steps: e.target.value }))
              }
              placeholder="Prep and plating steps…"
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!detailRecipe}
        onClose={() => setDetailRecipe(null)}
        title={
          detailRecipe ? (
            <span className="flex items-center gap-2">
              <BookOpen className="size-5 text-emerald-400" />
              {detailRecipe.name}
            </span>
          ) : null
        }
        footer={
          <button
            type="button"
            onClick={() => setDetailRecipe(null)}
            className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Close
          </button>
        }
      >
        {detailRecipe ? (
          <div className="space-y-4 text-sm">
            <p className="text-zinc-500">
              Menu item:{" "}
              <span className="font-medium text-zinc-200">
                {detailRecipe.menuItemName}
              </span>
            </p>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Ingredients
              </h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-300">
                {detailRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Steps
              </h4>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-300">
                {detailRecipe.steps || "—"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
