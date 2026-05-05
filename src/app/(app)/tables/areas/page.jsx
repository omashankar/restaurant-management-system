"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { CATEGORY_COLORS, getCategoryBadge } from "@/lib/tableCategoryColors";
import { useToast } from "@/hooks/useToast";
import { ImagePlus, LayoutGrid, Pencil, Plus, RefreshCw, Table2, Trash2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const EMPTY_FORM = { name: "", description: "", color: "emerald", imageUrl: "" };
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function TableAreasPage() {
  const [areas, setAreas]           = useState([]);
  const [tableCounts, setTableCounts] = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const { showToast, ToastUI } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const resetImageState = () => {
    setImageFile(null);
    setPreviewUrl("");
    setRemoveCurrentImage(false);
  };

  /* ── Fetch areas + table counts ── */
  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const [areasRes, tablesRes] = await Promise.all([
        fetch("/api/tables/areas"),
        fetch("/api/tables"),
      ]);
      const [areasData, tablesData] = await Promise.all([areasRes.json(), tablesRes.json()]);

      if (areasData.success)  setAreas(areasData.areas);
      if (tablesData.success) {
        const counts = {};
        tablesData.tables.forEach((t) => {
          if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
        });
        setTableCounts(counts);
      }
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    resetImageState();
    setFormError("");
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
    if (!ALLOWED_TYPES.includes(file.type)) {
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
    if (!form.name.trim()) { setFormError("Area name is required."); return; }
    let imageUrl = removeCurrentImage ? "" : form.imageUrl;

    setSaving(true); setFormError("");
    try {
      if (imageFile) {
        setUploadingImage(true);
        const fd = new FormData();
        fd.append("image", imageFile);
        const uploadRes = await fetch("/api/uploads/table-area-image", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          setFormError(uploadData.error ?? "Image upload failed.");
          return;
        }
        imageUrl = uploadData.imageUrl;
      }

      const url    = editingId ? `/api/tables/areas/${editingId}` : "/api/tables/areas";
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
      setUploadingImage(false);
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/tables/areas/${deleteTarget.id}`, { method: "DELETE" });
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
            <p className="mt-1 text-sm text-zinc-500">Seating areas — assign to tables for filtering.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tables"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500">
            <Table2 className="size-4" /> Tables
          </Link>
          <button type="button" onClick={fetchAreas}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className="size-4" />
          </button>
          <button type="button" onClick={openCreate}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" /> Add Area
          </button>
        </div>
      </div>

      {/* Grid */}
      {areas.length === 0 ? (
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
          {areas.map((area) => {
            const badgeClass = getCategoryBadge(area.color);
            const count = tableCounts[area.id] ?? 0;
            return (
              <div key={area.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm transition-all duration-200 hover:border-zinc-700 hover:shadow-md">
                {area.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeClass}`}>
                        {area.name}
                      </span>
                      <span className="text-xs text-zinc-600">{count} table{count !== 1 ? "s" : ""}</span>
                    </div>
                    {area.description && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{area.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-1.5 border-t border-zinc-800/80 pt-3">
                  <button type="button" onClick={() => openEdit(area)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(area)}
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Area" : "Add Area"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving || uploadingImage || !form.name.trim()}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              {uploadingImage ? "Uploading image…" : saving ? "Saving…" : "Save"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
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
            <label className="text-xs font-medium text-zinc-500">Area Image (JPG, PNG)</label>
            <div className="mt-2 space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200">
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
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl || form.imageUrl}
                    alt="Area preview"
                    className="h-36 w-full object-cover"
                  />
                  <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
                    <p className="text-xs text-zinc-500">
                      {imageFile ? "New image selected (preview)" : "Current saved image"}
                    </p>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-red-500/40 hover:text-red-300"
                    >
                      <X className="size-3.5" />
                      Delete image
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">No image selected.</p>
              )}
            </div>
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
        message={deleteTarget ? `"${deleteTarget.name}" will be removed. Tables in this area will lose their category.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}
