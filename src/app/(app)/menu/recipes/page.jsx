"use client";

import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
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
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
        <TableSkeleton rows={7} cols={5} />
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
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <BookOpen className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight">
              Recipes
            </h1>
            <p className="admin-page-desc mt-1 text-sm">
              Linked to menu items for kitchen consistency.
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={fetchAll}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
            <span className="sm:hidden">Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={activeMenuItems.length === 0}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 sm:w-auto"
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
                    <p className="mt-1 text-xs admin-surface-muted">
                      Menu item: <span className="break-words admin-surface-body">{row.menuItemName}</span>
                    </p>
                    {row.ingredientsPreview ? (
                      <p className="mt-1 line-clamp-2 text-xs admin-surface-faint">{row.ingredientsPreview}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <AdminTableIconButton variant="sky" onClick={() => setDetailRecipe(row)} aria-label="View">
                      <Eye className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </AdminTableIconButton>
                  </div>
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
                    <AdminTableTh>Recipe</AdminTableTh>
                    <AdminTableTh>Menu item</AdminTableTh>
                    <AdminTableTh>Ingredients</AdminTableTh>
                    <AdminTableThActions />
                  </AdminTableHeadRow>
                </AdminTableHead>
                <AdminTableBody>
                  {pageRows.map((row) => (
                    <AdminTableRow key={row.id}>
                      <AdminTableTd className="max-w-[10rem] font-medium admin-shell-text sm:max-w-none">
                        <span className="block truncate">{row.name}</span>
                      </AdminTableTd>
                      <AdminTableTd className="max-w-[10rem] admin-surface-muted sm:max-w-none">
                        <span className="block truncate">{row.menuItemName}</span>
                      </AdminTableTd>
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
                  hideWhenSinglePage
                />
              </div>
            </DataTableShell>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit recipe" : "Add recipe"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveRecipe}
              disabled={saving}
              className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 sm:w-auto"
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
            <div className="flex flex-wrap items-center justify-between gap-2">
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
              placeholder="Prep and plating steps…"
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
            <span className="flex min-w-0 items-start gap-2 break-words">
              <BookOpen className="mt-0.5 size-5 shrink-0 text-ra-primary" />
              {detailRecipe.name}
            </span>
          ) : null
        }
        footer={
          <button
            type="button"
            onClick={() => setDetailRecipe(null)}
            className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body sm:ml-auto sm:w-auto"
          >
            Close
          </button>
        }
      >
        {detailRecipe ? (
          <div className="min-w-0 space-y-4 text-sm">
            <p className="break-words text-zinc-500">
              Menu item:{" "}
              <span className="font-medium admin-shell-text">
                {detailRecipe.menuItemName}
              </span>
            </p>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Ingredients
              </h4>
              <ul className="mt-2 list-inside list-disc space-y-1 break-words admin-surface-body">
                {detailRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Steps
              </h4>
              <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed admin-surface-body">
                {detailRecipe.steps || "—"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
      {ToastUI}
    </div>
  );
}

