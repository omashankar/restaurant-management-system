"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import {
  Check, CreditCard, Pencil, Plus,
  RefreshCw, Trash2, Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const BILLING_CYCLES = ["monthly", "yearly"];

const PLAN_COLORS = {
  free:       { bg: "bg-zinc-500/10",   border: "border-zinc-700",       badge: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",       icon: "text-zinc-400"    },
  starter:    { bg: "bg-sky-500/5",     border: "border-sky-500/20",     badge: "bg-sky-500/15 text-sky-400 ring-sky-500/25",           icon: "text-sky-400"     },
  pro:        { bg: "bg-indigo-500/5",  border: "border-indigo-500/20",  badge: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",  icon: "text-indigo-400"  },
  enterprise: { bg: "bg-amber-500/5",   border: "border-amber-500/20",   badge: "bg-amber-500/15 text-amber-400 ring-amber-500/25",     icon: "text-amber-400"   },
};

const DEFAULT_COLOR = { bg: "bg-emerald-500/5", border: "border-emerald-500/20", badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25", icon: "text-emerald-400" };

const emptyForm = {
  name: "", price: "", billingCycle: "monthly", description: "",
  features: "",
  limits: { staff: "", tables: "", menuItems: "", orders: "" },
};

export default function PlansPage() {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [assignOpen, setAssignOpen]       = useState(false);
  const [restaurants, setRestaurants]     = useState([]);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [assigning, setAssigning]         = useState(false);
  const { showToast, ToastUI }    = useToast();

  /* ── Fetch plans ── */
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/super-admin/plans");
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Open create/edit modal ── */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name:         p.name,
      price:        String(p.price),
      billingCycle: p.billingCycle ?? "monthly",
      description:  p.description ?? "",
      features:     (p.features ?? []).join(", "),
      limits: {
        staff:     p.limits?.staff     != null ? String(p.limits.staff)     : "",
        tables:    p.limits?.tables    != null ? String(p.limits.tables)    : "",
        menuItems: p.limits?.menuItems != null ? String(p.limits.menuItems) : "",
        orders:    p.limits?.orders    != null ? String(p.limits.orders)    : "",
      },
    });
    setFormError("");
    setModalOpen(true);
  };

  /* ── Save plan ── */
  const save = async () => {
    if (!form.name.trim()) { setFormError("Plan name is required."); return; }
    if (form.price === "" || isNaN(Number(form.price))) { setFormError("Valid price is required."); return; }
    setSaving(true); setFormError("");

    const body = {
      name:         form.name.trim(),
      price:        Number(form.price),
      billingCycle: form.billingCycle,
      description:  form.description.trim(),
      features:     form.features.split(",").map((f) => f.trim()).filter(Boolean),
      limits: {
        staff:     form.limits.staff     !== "" ? Number(form.limits.staff)     : -1,
        tables:    form.limits.tables    !== "" ? Number(form.limits.tables)    : -1,
        menuItems: form.limits.menuItems !== "" ? Number(form.limits.menuItems) : -1,
        orders:    form.limits.orders    !== "" ? Number(form.limits.orders)    : -1,
      },
    };

    try {
      const url    = editingId ? `/api/super-admin/plans/${editingId}` : "/api/super-admin/plans";
      const method = editingId ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!data.success) { setFormError(data.error ?? "Failed to save."); return; }
      showToast(editingId ? "Plan updated." : `"${form.name}" plan created.`);
      setModalOpen(false);
      fetchPlans();
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  /* ── Delete plan ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/super-admin/plans/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  /* ── Assign plan ── */
  const openAssign = async (planSlug) => {
    setSelectedPlanSlug(planSlug);
    setSelectedRestaurant("");
    setAssignOpen(true);
    try {
      const res  = await fetch("/api/super-admin/restaurants");
      const data = await res.json();
      if (data.success) setRestaurants(data.restaurants);
    } catch { /* keep */ }
  };

  const assignPlan = async () => {
    if (!selectedRestaurant) { showToast("Select a restaurant.", "error"); return; }
    setAssigning(true);
    try {
      const res  = await fetch(`/api/super-admin/restaurants/${selectedRestaurant}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlanSlug }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed.", "error"); return; }
      showToast("Plan assigned successfully.");
      setAssignOpen(false);
      fetchPlans();
    } catch { showToast("Network error.", "error"); }
    finally { setAssigning(false); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25">
            <CreditCard className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Plans</h1>
            <p className="mt-1 text-sm text-zinc-500">Subscription plans and pricing.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchPlans}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={openCreate}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Plan cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <CreditCard className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No plans yet.</p>
          <button type="button" onClick={openCreate}
            className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const c = PLAN_COLORS[p.slug] ?? DEFAULT_COLOR;
            return (
              <div key={p.id} className={`relative flex flex-col rounded-2xl border p-5 ${c.bg} ${c.border}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1 ${c.badge}`}>
                    {p.name}
                  </span>
                  {!p.isActive && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">Inactive</span>
                  )}
                </div>

                <div className="mt-4">
                  <span className={`text-3xl font-bold ${c.icon}`}>
                    {p.price === 0 ? "Free" : `$${p.price}`}
                  </span>
                  {p.price > 0 && <span className="ml-1 text-xs text-zinc-500">/{p.billingCycle}</span>}
                </div>

                {p.description && (
                  <p className="mt-2 text-xs text-zinc-500">{p.description}</p>
                )}

                <ul className="mt-4 flex-1 space-y-1.5">
                  {(p.features ?? []).slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>

                {p.limits && Object.keys(p.limits).length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-1.5 border-t border-zinc-800/60 pt-4">
                    {Object.entries(p.limits).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-zinc-900/60 px-2 py-1.5 text-center">
                        <p className={`text-sm font-bold ${c.icon}`}>{v === -1 ? "∞" : v}</p>
                        <p className="text-[9px] capitalize text-zinc-600">{k}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-600">
                  <Users className="size-3" />
                  {p.subscribers} restaurant{p.subscribers !== 1 ? "s" : ""}
                </div>

                <div className="mt-4 flex gap-1.5 border-t border-zinc-800/60 pt-3">
                  <button type="button" onClick={() => openAssign(p.slug)}
                    className="cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-700 py-1.5 text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
                    Assign
                  </button>
                  <button type="button" onClick={() => openEdit(p)}
                    className="cursor-pointer flex items-center justify-center rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(p)}
                    className="cursor-pointer flex items-center justify-center rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:border-red-500/40 hover:text-red-400 transition-colors">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Plan" : "Create Plan"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              {saving ? "Saving…" : "Save Plan"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-500">Plan Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pro"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Price (USD) *</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0 for free"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Billing Cycle</label>
              <select value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                {BILLING_CYCLES.map((b) => <option key={b} value={b} className="capitalize">{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Features <span className="text-zinc-600">(comma-separated)</span></label>
            <textarea rows={2} value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              placeholder="Full POS, Inventory, Analytics, Priority support"
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Limits <span className="text-zinc-600">(-1 = unlimited)</span></label>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["staff", "tables", "menuItems", "orders"].map((k) => (
                <div key={k}>
                  <label className="text-[10px] capitalize text-zinc-600">{k}</label>
                  <input type="number" min="-1" value={form.limits[k]}
                    onChange={(e) => setForm((f) => ({ ...f, limits: { ...f.limits, [k]: e.target.value } }))}
                    placeholder="-1"
                    className="mt-0.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Assign Plan Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Plan to Restaurant"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAssignOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={assignPlan} disabled={assigning || !selectedRestaurant}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              {assigning ? "Assigning…" : "Assign Plan"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-400">
            Assigning plan: <span className="font-semibold capitalize text-zinc-100">{selectedPlanSlug}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Select Restaurant</label>
            <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
              <option value="">— Select restaurant —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.plan}) — {r.ownerEmail}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan?"
        message={deleteTarget ? `"${deleteTarget.name}" plan will be permanently deleted.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}
