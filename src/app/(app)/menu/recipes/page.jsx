"use client";

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
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import { getRecipeFormFieldErrors } from "@/lib/formValidation";
import { BookOpen, Eye, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    menuItemId: "",
    ingredients: [""],
    steps: "",
  });
  const { showToast, ToastUI } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const [recipesRes, menuRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/menu"),
      ]);
      const [recipesData, menuData] = await Promise.all([
        recipesRes.json(),
        menuRes.json(),
      ]);
      if (!recipesRes.ok || !menuRes.ok) {
        setFetchError(
          recipesData?.error ?? menuData?.error ?? "Could not load recipes."
        );
        return;
      }
      if (recipesData.success) setRecipes(recipesData.recipes ?? []);
      if (menuData.success) setMenuItems(menuData.items ?? []);
      if (!recipesData.success || !menuData.success) {
        setFetchError("Could not load recipes.");
      }
    } catch {
      setFetchError("Could not load recipes. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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

  const saveRecipe = async () => {
    const validation = getRecipeFormFieldErrors(form);
    if (!validation.valid) {
      showToast(validation.message ?? "Recipe name and menu item are required.", "error");
      return;
    }
    const mi = menuItems.find((m) => m.id === form.menuItemId);
    if (!mi) {
      showToast("Select a valid menu item.", "error");
      return;
    }
    const ing = form.ingredients.map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: form.name.trim(),
      menuItemId: mi.id,
      menuItemName: mi.name,
      ingredients: ing,
      steps: form.steps.trim(),
    };

    setSaving(true);
    try {
      const url = editingId ? `/api/recipes/${editingId}` : "/api/recipes";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data?.error ?? "Failed to save recipe.", "error");
        return;
      }
      await fetchAll();
      showToast(editingId ? "Recipe updated." : "Recipe added.");
      setModalOpen(false);
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg admin-progress-track animate-pulse" />
        <TableSkeleton rows={7} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fetchError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title text-2xl font-semibold tracking-tight">
            Recipes
          </h1>
          <p className="admin-page-desc mt-1 text-sm">
            Linked to menu items for kitchen consistency.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAll}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:admin-shell-text transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={activeMenuItems.length === 0}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40"
          >
            <Plus className="size-4" />
            Add recipe
          </button>
        </div>
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
              className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
            >
              Add recipe
            </button>
          }
        />
      ) : (
        <DataTableShell>
          <AdminTable>
            <AdminTableHead>
              <AdminTableHeadRow>
                <AdminTableTh>Recipe</AdminTableTh>
                <AdminTableTh>Menu item</AdminTableTh>
                <AdminTableTh>Ingredients</AdminTableTh>
                <AdminTableThActions />
              </AdminTableHeadRow>
            </AdminTableHead>
            <AdminTableBody>
              {pageRows.map((row) => (
                <AdminTableRow key={row.id}>
                  <AdminTableTd className="font-medium admin-shell-text">{row.name}</AdminTableTd>
                  <AdminTableTd className="admin-surface-muted">{row.menuItemName}</AdminTableTd>
                  <AdminTableTd className="max-w-xs truncate admin-surface-muted">{row.ingredientsPreview}</AdminTableTd>
                  <AdminTableActionsCell>
                    <AdminTableIconButton variant="sky" onClick={() => setDetailRecipe(row)} aria-label="View">
                      <Eye className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="size-4" />
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
              className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveRecipe}
              disabled={saving}
              className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs admin-surface-muted">Recipe name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2 text-sm admin-shell-text"
            />
          </div>
          <div>
            <label className="text-xs admin-surface-muted">Linked menu item</label>
            <select
              value={form.menuItemId}
              onChange={(e) =>
                setForm((f) => ({ ...f, menuItemId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border admin-shell-border admin-surface-card px-3 py-2 text-sm admin-shell-text"
            >
              {activeMenuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · ₹{m.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs admin-surface-muted">Ingredients</label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="cursor-pointer text-xs font-medium text-ra-primary hover:text-ra-primary-muted"
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
                    className="min-w-0 flex-1 rounded-xl border admin-shell-border admin-surface-card px-3 py-2 text-sm admin-shell-text"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-[var(--admin-hover)] hover:text-red-400"
                    aria-label="Remove line"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs admin-surface-muted">Steps</label>
            <textarea
              rows={5}
              value={form.steps}
              onChange={(e) =>
                setForm((f) => ({ ...f, steps: e.target.value }))
              }
              placeholder="Prep and plating stepsâ€¦"
              className="mt-1 w-full resize-none rounded-xl border admin-shell-border admin-surface-card px-3 py-2 text-sm admin-shell-text"
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
              <BookOpen className="size-5 text-ra-primary" />
              {detailRecipe.name}
            </span>
          ) : null
        }
        footer={
          <button
            type="button"
            onClick={() => setDetailRecipe(null)}
            className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body"
          >
            Close
          </button>
        }
      >
        {detailRecipe ? (
          <div className="space-y-4 text-sm">
            <p className="text-zinc-500">
              Menu item:{" "}
              <span className="font-medium admin-shell-text">
                {detailRecipe.menuItemName}
              </span>
            </p>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Ingredients
              </h4>
              <ul className="mt-2 list-inside list-disc space-y-1 admin-surface-body">
                {detailRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Steps
              </h4>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed admin-surface-body">
                {detailRecipe.steps || "â€”"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
      {ToastUI}
    </div>
  );
}

