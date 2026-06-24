"use client";

import { raDashedBoxCls, raIconBadgeCls, raInputCls, raSpinnerCls, raPageRefreshBtnCls, raPagePrimaryBtnCls } from "@/config/restaurantAdminTheme";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { CATEGORY_COLORS, getCategoryActive, getCategoryBadge, getCategoryHover } from "@/lib/tableCategoryColors";
import { useToast } from "@/hooks/useToast";
import { ImagePlus, LayoutGrid, Pencil, Plus, RefreshCw, Table2, Trash2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { uploadImageWithCompression } from "@/lib/clientImageUpload";
import {
  EMPTY_TABLE_AREA_ERRORS,
  getTableAreaFieldErrors,
} from "@/lib/formValidation";
import { validateImageFileType } from "@/lib/uploadImageShared";
import PaginationBar from "@/components/ui/PaginationBar";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useCallback, useEffect, useState } from "react";

const EMPTY_FORM = { name: "", description: "", color: "emerald", imageUrl: "" };

export default function TableAreasPage() {
  const [areas, setAreas]           = useState([]);
  const [tableCounts, setTableCounts] = useState({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_TABLE_AREA_ERRORS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imagePhase, setImagePhase] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const { showToast, ToastUI } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const resetImageState = () => {
    setImageFile(null);
    setPreviewUrl("");
    setRemoveCurrentImage(false);
  };

  /* ── Fetch areas + table counts ── */
  const fetchAreas = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError("");
    }
    try {
      const [areasRes, tablesRes] = await Promise.all([
        fetch("/api/table-areas"),
        fetch("/api/tables"),
      ]);
      const [areasData, tablesData] = await Promise.all([areasRes.json(), tablesRes.json()]);

      if (!areasRes.ok || !tablesRes.ok) {
        setFetchError(
          areasData?.error ?? tablesData?.error ?? "Could not load table areas.",
        );
        return;
      }
      if (areasData.success)  setAreas(areasData.areas);
      if (tablesData.success) {
        const counts = {};
        tablesData.tables.forEach((t) => {
          if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
        });
        setTableCounts(counts);
      }
      if (!areasData.success || !tablesData.success) {
        setFetchError("Could not load table areas.");
      }
    } catch {
      if (!silent) setFetchError("Could not load table areas. Check your connection and try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  const refreshAreas = useCallback(async () => {
    setRefreshing(true);
    setFetchError("");
    try {
      await fetchAreas(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAreas]);
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const { page, setPage, pageRows, total, totalPages, pageSize } = usePaginatedList(areas, {
    searchKeys: ["name", "description"],
    pageSize: 9,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    resetImageState();
    setFormError("");
    setFieldErrors(EMPTY_TABLE_AREA_ERRORS);
    setModalOpen(true);
  };
  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      description: a.description ?? "",
      color: a.color ?? "emerald",
      imageUrl: a.imageUrl ?? "",
    });
    resetImageState();
    setFormError("");
    setModalOpen(true);
  };

  const onImagePicked = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const typeCheck = validateImageFileType(file);
    if (!typeCheck.ok) {
      setFormError(typeCheck.error);
      event.target.value = "";
      return;
    }
    if (typeCheck.mime === "image/webp") {
      setFormError("Only JPG and PNG images are allowed.");
      event.target.value = "";
      return;
    }
    setFormError("");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveCurrentImage(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    setRemoveCurrentImage(true);
  };

  const save = async () => {
    const validation = getTableAreaFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) return;
    let imageUrl = removeCurrentImage ? "" : form.imageUrl;

    setSaving(true); setFormError("");
    try {
      if (imageFile) {
        const uploadData = await uploadImageWithCompression(imageFile, {
          url: "/api/uploads/table-area-image",
          preset: "tableArea",
          onPhase: setImagePhase,
        });
        setImagePhase(null);
        if (!uploadData.success) {
          setFormError(uploadData.error ?? "Image upload failed.");
          return;
        }
        imageUrl = uploadData.imageUrl;
      }

      const url    = editingId ? `/api/table-areas/${editingId}` : "/api/table-areas";
      const method = editingId ? "PATCH" : "POST";
      const payload = { ...form, imageUrl };
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!data.success) { setFormError(data.error ?? "Failed to save."); return; }

      if (editingId) {
        setAreas((prev) => prev.map((a) => a.id === editingId ? { ...a, ...payload } : a));
        showToast("Area updated.");
      } else {
        setAreas((prev) => [...prev, data.area]);
        showToast("Area created.");
      }
      setModalOpen(false);
    } catch { setFormError("Network error."); }
    finally {
      setImagePhase(null);
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/table-areas/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setAreas((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-28" />
            <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-28" />
          </div>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse admin-surface-card" />
          ))}
        </div>
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
            <LayoutGrid className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Table Areas</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">Seating areas — assign to tables for filtering.</p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <Link href="/tables"
            className={raPageRefreshBtnCls}>
            <Table2 className="size-4" /> Tables
          </Link>
          <button
            type="button"
            onClick={refreshAreas}
            disabled={refreshing}
            className={raPageRefreshBtnCls}
          >
            <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
            Refresh
          </button>
          <button type="button" onClick={openCreate}
            className={raPagePrimaryBtnCls}>
            <Plus className="size-4" /> Add Area
          </button>
        </div>
      </div>

      {/* Grid */}
      {total === 0 ? (
        <EmptyState
          title="No areas yet"
          description="Create seating areas like Indoor, Outdoor, VIP to organize your tables."
          action={
            <button type="button" onClick={openCreate}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto">
              Add Area
            </button>
          }
        />
      ) : (
        <>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageRows.map((area) => {
            const badgeClass = getCategoryBadge(area.color);
            const count = tableCounts[area.id] ?? 0;
            return (
              <div key={area.id}
                className="min-w-0 admin-surface-card p-5 transition-colors hover:border-ra-primary-30">
                {area.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-xl admin-surface-card">
                    <Image
                      src={area.imageUrl}
                      alt={`${area.name} area`}
                      width={480}
                      height={224}
                      className="h-28 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex max-w-full break-words rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeClass}`}>
                        {area.name}
                      </span>
                      <span className="text-xs admin-surface-faint">{count} table{count !== 1 ? "s" : ""}</span>
                    </div>
                    {area.description && (
                      <p className="mt-2 break-words text-xs leading-relaxed text-zinc-500">{area.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-1.5 admin-surface-divider-t pt-3">
                  <button type="button" onClick={() => openEdit(area)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg border admin-shell-border py-2 text-xs font-medium admin-surface-muted transition-colors hover-border-brand-40 hover-bg-brand-10 hover-brand-text">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(area)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg border admin-shell-border py-2 text-xs font-medium admin-surface-muted transition-colors hover-border-red-40 hover-bg-red-10 hover-red-danger">
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="min-w-0">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          hideWhenSinglePage
        />
        </div>
        </>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Area" : "Add Area"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setModalOpen(false)}
              className="w-full cursor-pointer rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-4 py-2 text-sm admin-surface-body transition-colors hover:bg-[var(--admin-hover)] sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving || imagePhase}
              className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 sm:w-auto">
              {imagePhase === "compressing"
                ? "Compressing image…"
                : imagePhase === "uploading"
                  ? "Uploading image…"
                  : saving
                    ? "Saving…"
                    : "Save"}
            </button>
          </div>
        }>
        <div className="min-w-0 space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div>
            <label className="text-xs font-medium admin-surface-muted">Area Name *</label>
            <input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="e.g. Indoor, Rooftop, VIP"
              aria-invalid={fieldErrors.name ? true : undefined}
              className={`mt-1 ${raInputCls} ${fieldErrors.name ? "border-red-500/50" : ""}`}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Description (optional)</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Short description"
              className={`mt-1 ${raInputCls}`} />
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Area Image (JPG, PNG)</label>
            <div className="mt-2 space-y-3">
              <label className={`flex cursor-pointer flex-wrap items-center justify-center gap-2 text-center ${raDashedBoxCls} px-4 py-3 text-sm transition-colors hover:border-ra-primary-40 hover:text-ra-primary`}>
                <ImagePlus className="size-4" />
                <span>{imageFile ? "Change selected image" : "Choose image"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={onImagePicked}
                />
              </label>

              {(previewUrl || (!removeCurrentImage && form.imageUrl)) ? (
                <div className="overflow-hidden rounded-xl admin-surface-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl || form.imageUrl}
                    alt="Area preview"
                    className="h-36 w-full object-cover"
                  />
                  <div className="flex flex-col gap-2 admin-surface-divider-t px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs admin-surface-muted">
                      {imageFile ? "New image selected (preview)" : "Current saved image"}
                    </p>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-2.5 py-1 text-xs admin-surface-body transition-colors hover-border-red-40 hover-bg-red-5 hover-text-red-500 sm:w-auto"
                    >
                      <X className="size-3.5" />
                      Delete image
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs admin-surface-faint">No image selected.</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Color</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => set("color", c.id)}
                  className={`cursor-pointer box-border flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-[background-color,color,border-color] sm:justify-start sm:py-1.5 ${
                    form.color === c.id
                      ? getCategoryActive(c.id)
                      : `border-[var(--admin-border-subtle)] admin-surface-muted ${getCategoryHover(c.id)}`
                  }`}>
                  <span className={`size-2.5 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          {form.name && (
            <div className="rounded-xl admin-surface-card px-4 py-3">
              <p className="mb-2 text-xs admin-surface-faint">Preview</p>
              <span className={`inline-flex max-w-full break-words rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${getCategoryBadge(form.color)}`}>
                {form.name}
              </span>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete area?"
        message={deleteTarget ? `"${deleteTarget.name}" will be removed. Tables in this area will lose their category.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}
