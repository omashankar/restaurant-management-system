"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import {
  Building2, CheckCircle2, Eye, EyeOff,
  Pencil, Plus, RefreshCw, Search,
  Trash2, XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PLANS    = ["free", "starter", "pro", "enterprise"];
const STATUSES = ["active", "inactive", "suspended"];

const PLAN_BADGE = {
  free:       "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  starter:    "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  pro:        "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",
  enterprise: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
};

const STATUS_BADGE = {
  active:    "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  inactive:  "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  suspended: "bg-red-500/15 text-red-400 ring-red-500/25",
};

const emptyForm = { name: "", ownerEmail: "", ownerName: "", ownerPassword: "", plan: "free" };

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter]   = useState("all");
  const [modalOpen, setModalOpen]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [formError, setFormError]     = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const { showToast, ToastUI }        = useToast();

  /* ── Fetch ── */
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                    params.set("search", search);
      if (statusFilter !== "all")    params.set("status", statusFilter);
      if (planFilter   !== "all")    params.set("plan",   planFilter);
      const res  = await fetch(`/api/super-admin/restaurants?${params}`);
      const data = await res.json();
      if (data.success) setRestaurants(data.restaurants);
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, [search, statusFilter, planFilter]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  /* ── Create ── */
  const save = async () => {
    if (!form.name.trim())       { setFormError("Restaurant name is required."); return; }
    if (!form.ownerEmail.trim()) { setFormError("Owner email is required."); return; }
    if (!form.ownerPassword)     { setFormError("Owner password is required."); return; }
    setSaving(true); setFormError("");
    try {
      const res  = await fetch("/api/super-admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.error ?? "Failed to create."); return; }
      setRestaurants((prev) => [data.restaurant, ...prev]);
      showToast(`"${form.name}" created successfully.`);
      setModalOpen(false);
      setForm(emptyForm);
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  /* ── Toggle status ── */
  const toggleStatus = async (r) => {
    const newStatus = r.status === "active" ? "inactive" : "active";
    try {
      const res  = await fetch(`/api/super-admin/restaurants/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to update.", "error"); return; }
      setRestaurants((prev) => prev.map((x) => x.id === r.id ? { ...x, status: newStatus } : x));
      showToast(`"${r.name}" ${newStatus === "active" ? "enabled" : "disabled"}.`);
    } catch { showToast("Network error.", "error"); }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/super-admin/restaurants/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setRestaurants((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  const stats = useMemo(() => ({
    total:    restaurants.length,
    active:   restaurants.filter((r) => r.status === "active").length,
    inactive: restaurants.filter((r) => r.status !== "active").length,
  }), [restaurants]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Restaurants</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage all registered tenants.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchRestaurants}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={() => { setForm(emptyForm); setFormError(""); setModalOpen(true); }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" /> Add Restaurant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "text-zinc-100"    },
          { label: "Active",   value: stats.active,   color: "text-emerald-400" },
          { label: "Inactive", value: stats.inactive, color: "text-zinc-500"    },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All plans</option>
          {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <Building2 className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No restaurants found.</p>
          <button type="button" onClick={() => { setForm(emptyForm); setModalOpen(true); }}
            className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            Add First Restaurant
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Restaurant</th>
                <th className="hidden px-4 py-3 md:table-cell">Owner</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {restaurants.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300 ring-1 ring-zinc-700">
                        {r.name?.[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-100">{r.name}</p>
                        <p className="text-xs text-zinc-600">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-zinc-300">{r.ownerName}</p>
                    <p className="text-xs text-zinc-500">{r.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${PLAN_BADGE[r.plan] ?? PLAN_BADGE.free}`}>
                      {r.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${STATUS_BADGE[r.status] ?? STATUS_BADGE.inactive}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => toggleStatus(r)}
                        title={r.status === "active" ? "Disable" : "Enable"}
                        className={`cursor-pointer rounded-lg p-2 transition-colors ${
                          r.status === "active"
                            ? "text-zinc-400 hover:bg-amber-500/15 hover:text-amber-400"
                            : "text-zinc-400 hover:bg-emerald-500/15 hover:text-emerald-400"
                        }`}>
                        {r.status === "active" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(r)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Restaurant"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              {saving ? "Creating…" : "Create Restaurant"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>
          )}
          <div>
            <label className="text-xs font-medium text-zinc-500">Restaurant Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. The Grand Kitchen"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-500">Owner Name</label>
              <input value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                placeholder="Full name"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Owner Email *</label>
              <input type="email" value={form.ownerEmail} onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                placeholder="owner@restaurant.com"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Owner Password *</label>
              <div className="relative mt-1">
                <input type={showPw ? "text" : "password"} value={form.ownerPassword}
                  onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                  placeholder="Min 6 characters" autoComplete="new-password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 pr-10 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Plan</label>
              <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">
            ℹ️ An admin account will be created for the owner with the provided email and password.
            The restaurant will be assigned a unique <span className="text-zinc-300">tenantId</span>.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete restaurant?"
        message={deleteTarget ? `"${deleteTarget.name}" and all its users will be permanently deleted.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}
