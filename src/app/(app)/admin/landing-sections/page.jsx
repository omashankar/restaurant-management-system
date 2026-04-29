"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import IconPicker from "@/components/ui/IconPicker";
import { getIcon } from "@/lib/iconMap";
import { CheckCircle2, Loader2, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

function LandingSectionsManager() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "Star",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    try {
      const res = await fetch("/api/landing-sections");
      const data = await res.json();
      if (data.success) {
        setSections(data.sections);
      }
    } catch {
      showToast("error", "Failed to load sections.");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setForm({ title: "", description: "", icon: "Star", order: 0, isActive: true });
    setEditingId(null);
  }

  function editSection(section) {
    setForm({
      title: section.title,
      description: section.description,
      icon: section.icon,
      order: section.order,
      isActive: true,
    });
    setEditingId(section.id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.description || !form.icon) {
      showToast("error", "All fields are required.");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/landing-sections/${editingId}`
        : "/api/landing-sections";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", editingId ? "Section updated!" : "Section created!");
        resetForm();
        loadSections();
      } else {
        showToast("error", data.error || "Failed to save section.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSection(id) {
    if (!confirm("Delete this section?")) return;

    try {
      const res = await fetch(`/api/landing-sections/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Section deleted.");
        loadSections();
      } else {
        showToast("error", data.error || "Failed to delete section.");
      }
    } catch {
      showToast("error", "Network error.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Landing Sections Manager
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage dynamic sections displayed on the public landing page.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-200">
          {editingId ? "Edit Section" : "Add New Section"}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. POS System"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Order
            </label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Brief description of this feature"
            />
          </div>

          <div className="md:col-span-2">
            <IconPicker
              label="Icon"
              value={form.icon}
              onChange={(icon) => setForm({ ...form, icon })}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {isSaving ? "Saving..." : editingId ? "Update Section" : "Add Section"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Sections List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-200">Existing Sections</h2>

        {sections.length === 0 && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
            No sections yet. Add your first one above.
          </p>
        )}

        {sections.map((section) => {
          const Icon = getIcon(section.icon);
          return (
            <div
              key={section.id}
              className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
            >
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <Icon className="size-6" />
              </span>

              <div className="flex-1">
                <h3 className="text-base font-semibold text-zinc-200">{section.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Icon: <span className="text-zinc-400">{section.icon}</span> · Order:{" "}
                  <span className="text-zinc-400">{section.order}</span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => editSection(section)}
                  className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
                  title="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-red-500 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-2xl shadow-black/40 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-zinc-900 text-emerald-300"
              : "border-red-500/30 bg-zinc-900 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function LandingSectionsPage() {
  return (
    <ProtectedRoute roles={["super_admin"]}>
      <LandingSectionsManager />
    </ProtectedRoute>
  );
}
