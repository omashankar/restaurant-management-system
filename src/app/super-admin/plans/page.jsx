"use client";

import { raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saInputCls, saSpinnerCls, saTextareaCls } from "@/config/superAdminTheme";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import {
  buildAssignPlanSubmitBody,
  buildPlanSubmitBody,
  EMPTY_ASSIGN_PLAN_ERRORS,
  EMPTY_PLAN_FORM_ERRORS,
  getAssignPlanFieldErrors,
  getPlanFormFieldErrors,
} from "@/lib/formValidation";
import { decimalInputProps, intInputProps } from "@/lib/formInputTypes";
import { formatSaMoney } from "@/lib/formatSaMoney";
import {
  Check, CreditCard, Pencil, Plus,
  RefreshCw, Sparkles, Trash2, Users, X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────────────────────
   STATIC PRICING TABLE DATA
───────────────────────────────────────── */
const PRICING_PLANS = [
  {
    slug: "free", name: "Free", price: 0,
    description: "Perfect for getting started.",
    recommended: false,
    accent: {
      gradient: "sa-pricing-card sa-pricing-card--free",
      border:   "border-zinc-500/25",
      ring:     "ring-zinc-500/15",
      badge:    "bg-[var(--admin-hover-strong)] admin-surface-muted",
      btn:      "admin-surface-btn-ghost",
      price:    "admin-shell-text",
      dot:      "bg-zinc-500",
      divider:  "sa-pricing-divider--free",
    },
    features: [
      { label: "1 Restaurant",         included: true  },
      { label: "Basic POS",            included: true  },
      { label: "Basic Analytics",      included: true  },
      { label: "Reservations",         included: false },
      { label: "Inventory Management", included: false },
      { label: "Advanced Analytics",   included: false },
      { label: "Multi-location",       included: false },
      { label: "Support",              included: false },
    ],
  },
  {
    slug: "starter", name: "Starter", price: 29,
    description: "For small restaurants growing fast.",
    recommended: false,
    accent: {
      gradient: "sa-pricing-card sa-pricing-card--starter",
      border:   "border-sky-500/30",
      ring:     "ring-sky-500/20",
      badge:    "bg-sky-500/15 text-sky-400",
      btn:      "border border-sky-500/50 text-sky-700 hover:bg-sky-500/10 hover:border-sky-500",
      price:    "text-sky-700",
      dot:      "bg-sky-500",
      divider:  "sa-pricing-divider--starter",
    },
    features: [
      { label: "1 Restaurant",         included: true  },
      { label: "Full POS",             included: true  },
      { label: "Basic Analytics",      included: true  },
      { label: "Reservations",         included: true  },
      { label: "Inventory Management", included: false },
      { label: "Advanced Analytics",   included: false },
      { label: "Multi-location",       included: false },
      { label: "Email Support",        included: true  },
    ],
  },
  {
    slug: "pro", name: "Pro", price: 79,
    description: "For established restaurants.",
    recommended: true,
    accent: {
      gradient: "sa-pricing-card sa-pricing-card--pro",
      border:   "border-indigo-500/60",
      ring:     "ring-indigo-500/30",
      badge:    "bg-indigo-500/20 text-indigo-400",
      btn:      "sa-btn-primary text-zinc-950 hover:brightness-110",
      price:    "text-indigo-700",
      dot:      "bg-indigo-500",
      divider:  "sa-pricing-divider--pro",
    },
    features: [
      { label: "3 Restaurants",        included: true  },
      { label: "Full POS",             included: true  },
      { label: "Basic Analytics",      included: true  },
      { label: "Reservations",         included: true  },
      { label: "Inventory Management", included: true  },
      { label: "Advanced Analytics",   included: true  },
      { label: "Multi-location",       included: false },
      { label: "Priority Support",     included: true  },
    ],
  },
  {
    slug: "enterprise", name: "Enterprise", price: 199,
    description: "For restaurant chains and franchises.",
    recommended: false,
    accent: {
      gradient: "sa-pricing-card sa-pricing-card--enterprise",
      border:   "border-amber-500/30",
      ring:     "ring-amber-500/20",
      badge:    "bg-amber-500/15 text-amber-600",
      btn:      "border border-amber-500/50 text-amber-800 hover:bg-amber-500/10 hover:border-amber-500",
      price:    "text-amber-800",
      dot:      "bg-amber-500",
      divider:  "sa-pricing-divider--enterprise",
    },
    features: [
      { label: "Unlimited Restaurants",  included: true },
      { label: "Full POS",               included: true },
      { label: "Basic Analytics",        included: true },
      { label: "Reservations",           included: true },
      { label: "Inventory Management",   included: true },
      { label: "Advanced Analytics",     included: true },
      { label: "Multi-location Support", included: true },
      { label: "Dedicated Support",      included: true },
    ],
  },
];

/* ─────────────────────────────────────────
   PLAN CARD COMPONENT
───────────────────────────────────────── */
function PricingCard({ plan, onAssign, pricingView }) {
  const { accent } = plan;
  const subscribers = plan?.subscribers ?? 0;

  return (
    <div className={`relative flex min-w-0 flex-col rounded-2xl border p-5 ring-1 transition-all duration-300 sm:p-6 ${plan.recommended ? "pt-8 sm:pt-6" : ""} hover:-translate-y-0.5 ${accent.gradient} ${accent.border} ${accent.ring}`}>

      {/* Recommended badge */}
      {plan.recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sa-primary px-3 py-1 text-[11px] font-bold text-zinc-950">
            <Sparkles className="size-3" />
            Recommended
          </span>
        </div>
      )}

      {/* Plan name + badge */}
      <div className="flex min-w-0 items-center justify-between gap-2">
          <span className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${accent.badge}`}>
          <span className={`size-1.5 shrink-0 rounded-full ${accent.dot}`} />
          <span className="truncate">{plan.name}</span>
        </span>
        {subscribers > 0 && (
          <span className="flex items-center gap-1 text-[10px] admin-surface-faint">
            <Users className="size-3" />{subscribers}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-end gap-1">
          <span className={`text-2xl font-extrabold tabular-nums tracking-tight break-words sm:text-3xl lg:text-4xl ${accent.price}`}>
            {(() => {
              const value = pricingView === "yearly" ? Number(plan.yearlyPrice ?? 0) : Number(plan.monthlyPrice ?? 0);
              return value === 0 ? "Free" : `₹${value}`;
            })()}
          </span>
          {(pricingView === "yearly" ? Number(plan.yearlyPrice ?? 0) : Number(plan.monthlyPrice ?? 0)) > 0 && (
            <span className="mb-1 text-sm admin-surface-muted">/{pricingView === "yearly" ? "year" : "month"}</span>
          )}
        </div>
        <p className="mt-1.5 break-words text-sm leading-relaxed admin-surface-muted">{plan.description}</p>
      </div>

      {/* Divider */}
      <div className={`my-5 sa-pricing-divider ${accent.divider ?? ""}`} />

      {/* Feature list */}
      <ul className="flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-center gap-2.5">
            {f.included ? (
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-sa-primary-15">
                <Check className="size-3 text-sa-primary" strokeWidth={3} />
              </span>
            ) : (
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[var(--admin-hover-strong)]">
                <X className="size-3 admin-surface-faint" strokeWidth={3} />
              </span>
            )}
            <span className={`break-words text-sm ${f.included ? "admin-surface-body" : "admin-surface-faint line-through"}`}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onAssign(plan.slug)}
        className={`cursor-pointer mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${accent.btn}`}
      >
        Assign Plan
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   MANAGEMENT CARD (DB plans)
───────────────────────────────────────── */
const PLAN_COLORS = {
  free: {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    divider: "border-zinc-500/15",
    btnBorder: "border-zinc-500/25 hover:border-zinc-500/40",
    badge: "bg-zinc-500/15 text-zinc-500 ring-zinc-500/20",
    icon: "text-zinc-600",
  },
  starter: {
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
    divider: "border-sky-500/20",
    btnBorder: "border-sky-500/30 hover:border-sky-500/50",
    badge: "bg-sky-500/15 text-sky-600 ring-sky-500/20",
    icon: "text-sky-600",
  },
  pro: {
    bg: "bg-indigo-500/5",
    border: "border-indigo-500/20",
    divider: "border-indigo-500/20",
    btnBorder: "border-indigo-500/30 hover:border-indigo-500/50",
    badge: "bg-indigo-500/15 text-indigo-600 ring-indigo-500/20",
    icon: "text-indigo-600",
  },
  enterprise: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    divider: "border-amber-500/20",
    btnBorder: "border-amber-500/30 hover:border-amber-500/50",
    badge: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
    icon: "text-amber-700",
  },
};
const DEFAULT_COLOR = {
  bg: "bg-sa-primary-5",
  border: "border-sa-primary-20",
  divider: "border-sa-primary-20",
  btnBorder: "border-sa-primary-30 hover:border-sa-primary-40",
  badge: "bg-sa-primary-15 text-sa-primary ring-sa-primary-25",
  icon: "text-sa-primary",
};
const BILLING_CYCLES = ["monthly", "yearly"];
const emptyForm = { name: "", monthlyPrice: "", yearlyPrice: "", billingCycle: "monthly", description: "", features: "", limits: { staff: "", tables: "", menuItems: "", orders: "" } };
const emptyAssignForm = { restaurantId: "", planSlug: "", startDate: "", endDate: "", trialDays: "0" };

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function PlansPage() {
  const [plans, setPlans]         = useState([]);
  const [pricingView, setPricingView] = useState("monthly");
  const [activeTab, setActiveTab] = useState("preview");
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_PLAN_FORM_ERRORS);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRestaurants, setAssignRestaurants] = useState([]);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignFieldErrors, setAssignFieldErrors] = useState(EMPTY_ASSIGN_PLAN_ERRORS);
  const [assignError, setAssignError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const { showToast, ToastUI }    = useToast();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch("/api/super-admin/plans");
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data?.error ?? "Failed to load plans.";
        setLoadError(msg);
        showToast(msg, "error");
        return;
      }
      setPlans(data.plans);
    } catch {
      const msg = "Could not load plans.";
      setLoadError(msg);
      showToast(msg, "error");
    }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors(EMPTY_PLAN_FORM_ERRORS);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      monthlyPrice: String(p.monthlyPrice ?? p.price ?? ""),
      yearlyPrice: String(p.yearlyPrice ?? ((p.price ?? 0) * 12)),
      billingCycle: p.billingCycle ?? "monthly",
      description: p.description ?? "",
      features: (p.features ?? []).join(", "),
      limits: {
        staff:     p.limits?.staff     != null ? String(p.limits.staff)     : "",
        tables:    p.limits?.tables    != null ? String(p.limits.tables)    : "",
        menuItems: p.limits?.menuItems != null ? String(p.limits.menuItems) : "",
        orders:    p.limits?.orders    != null ? String(p.limits.orders)    : "",
      },
    });
    setFormError("");
    setFieldErrors(EMPTY_PLAN_FORM_ERRORS);
    setModalOpen(true);
  };

  const clearFieldError = (key) => {
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const save = async () => {
    const errors = getPlanFormFieldErrors(form);
    setFieldErrors(errors);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setFormError(firstError);
      return;
    }
    setSaving(true);
    setFormError("");
    const body = buildPlanSubmitBody(form);
    try {
      const url    = editingId ? `/api/super-admin/plans/${editingId}` : "/api/super-admin/plans";
      const method = editingId ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!data.success) { setFormError(data.error ?? "Failed to save."); return; }
      showToast(editingId ? "Plan updated." : `"${form.name}" plan created.`);
      setModalOpen(false); fetchPlans();
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/super-admin/plans/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted.`); setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  const openAssign = async (planSlug = "") => {
    setAssignForm({ ...emptyAssignForm, planSlug });
    setAssignFieldErrors(EMPTY_ASSIGN_PLAN_ERRORS);
    setAssignError("");
    setAssignOpen(true);
    try {
      const res = await fetch("/api/super-admin/restaurants");
      const data = await res.json();
      if (data.success) setAssignRestaurants(data.restaurants);
    } catch { /* keep */ }
  };

  const clearAssignFieldError = (key) => {
    if (assignFieldErrors[key]) setAssignFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const assignPlan = async () => {
    const errors = getAssignPlanFieldErrors(assignForm);
    setAssignFieldErrors(errors);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setAssignError(firstError);
      return;
    }
    setAssigning(true);
    setAssignError("");
    try {
      const res = await fetch("/api/super-admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAssignPlanSubmitBody(assignForm)),
      });
      const data = await res.json();
      if (!data.success) {
        setAssignError(data.error ?? "Failed.");
        return;
      }
      showToast("Plan assigned successfully.");
      setAssignOpen(false);
      setAssignForm(emptyAssignForm);
      setAssignFieldErrors(EMPTY_ASSIGN_PLAN_ERRORS);
      fetchPlans();
    } catch {
      setAssignError("Network error.");
    } finally {
      setAssigning(false);
    }
  };

  /* Use DB plans as source of truth for both sections */
  const previewPlans = plans.map((p) => {
    const staticMeta = PRICING_PLANS.find((sp) => sp.slug === p.slug);
    const safeFeatures = (p.features ?? []).map((feature) => ({ label: feature, included: true }));
    return {
      ...p,
      description: p.description || staticMeta?.description || "No description available.",
      accent: staticMeta?.accent ?? PRICING_PLANS[2].accent,
      recommended: staticMeta?.recommended ?? p.slug === "pro",
      features: safeFeatures.length ? safeFeatures : (staticMeta?.features ?? []),
    };
  });

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-10">

      {/* ── Page header ── */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 flex shrink-0 items-center justify-center ${saIconBadgeCls}`}>
            <CreditCard className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Plans & Pricing</h1>
            <p className="admin-page-desc mt-1 text-sm">
              Define subscription tiers for your SaaS. Assign plans to restaurants.
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <div className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm ${
                activeTab === "preview"
                  ? "admin-surface-segment-btn-active admin-shell-text"
                  : "admin-surface-segment-btn hover:admin-surface-body"
              }`}
            >
              Pricing Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm ${
                activeTab === "manage"
                  ? "admin-surface-segment-btn-active admin-shell-text"
                  : "admin-surface-segment-btn hover:admin-surface-body"
              }`}
            >
              Manage Plans
            </button>
          </div>
          <button
            type="button"
            onClick={fetchPlans}
              aria-label="Refresh plans"
              className={raPageRefreshBtnCls}
            >
              <RefreshCw className={`size-4 ${loading ? saSpinnerCls : ""}`} />
              <span className="sm:hidden">Refresh</span>
            </button>
            <button type="button" onClick={openCreate}
              className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sa-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 sm:w-auto">
              <Plus className="size-4" /> New Plan
            </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PRICING TABLE
      ══════════════════════════════════════════ */}
      {loadError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}
      {activeTab === "preview" && (
      <section className="min-w-0">
        <div className="mb-6 px-1 text-center sm:mb-8">
          <h2 className="admin-surface-heading text-lg font-bold tracking-tight sm:text-xl">Choose the right plan</h2>
          <p className="mt-2 text-sm admin-surface-muted">
            Live preview based on your database plans.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="admin-surface-segment-track inline-flex w-full max-w-xs rounded-xl border p-1 sm:w-auto sm:max-w-none">
              <button
                type="button"
                onClick={() => setPricingView("monthly")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                  pricingView === "monthly" ? "bg-sa-primary text-zinc-950" : "admin-surface-muted hover:bg-[var(--admin-hover)]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setPricingView("yearly")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                  pricingView === "yearly" ? "bg-sa-primary text-zinc-950" : "admin-surface-muted hover:bg-[var(--admin-hover)]"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <SuperAdminPageSkeleton
            cards={4}
            cardClassName="h-72"
            cardCols="grid min-w-0 grid-cols-1 gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-4"
            rows={0}
          />
        ) : previewPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-16 text-center">
            <CreditCard className="size-10 text-zinc-700" />
            <p className="text-sm admin-surface-muted">No plans to preview yet.</p>
            <button
              type="button"
              onClick={openCreate}
              className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110"
            >
              Create First Plan
            </button>
          </div>
        ) : (
        <div className="grid min-w-0 grid-cols-1 gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          {previewPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              pricingView={pricingView}
              onAssign={openAssign}
            />
          ))}
        </div>
        )}
      </section>
      )}

      {/* ══════════════════════════════════════════
          DB PLAN MANAGEMENT (CRUD)
      ══════════════════════════════════════════ */}
      {activeTab === "manage" && (
      <section className="min-w-0">
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold admin-shell-text">Manage Plans</h2>
            <p className="mt-0.5 text-xs admin-surface-muted">Create, edit, or delete plans stored in the database.</p>
          </div>
          <div className="admin-surface-segment-track inline-flex w-full max-w-xs rounded-xl border p-1 sm:w-auto sm:max-w-none">
            <button
              type="button"
              onClick={() => setPricingView("monthly")}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                pricingView === "monthly" ? "bg-sa-primary text-zinc-950" : "admin-surface-muted hover:bg-[var(--admin-hover)]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPricingView("yearly")}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                pricingView === "yearly" ? "bg-sa-primary text-zinc-950" : "admin-surface-muted hover:bg-[var(--admin-hover)]"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {loading ? (
          <SuperAdminPageSkeleton
            cards={4}
            cardClassName="h-48"
            cardCols="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            rows={0}
          />
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-16 text-center">
            <CreditCard className="size-10 text-zinc-700" />
            <p className="text-sm admin-surface-muted">No plans in database yet.</p>
            <button type="button" onClick={openCreate}
              className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110">
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => {
              const c = PLAN_COLORS[p.slug] ?? DEFAULT_COLOR;
              return (
                <div key={p.id} className={`relative flex min-w-0 flex-col rounded-2xl border p-5 ${c.bg} ${c.border} transition-colors`}>
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className={`inline-flex min-w-0 max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1 ${c.badge}`}>
                      {p.name}
                    </span>
                    {!p.isActive && (
                      <span className="rounded-full bg-[var(--admin-hover-strong)] px-2 py-0.5 text-[10px] font-semibold text-zinc-500">Inactive</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className={`text-xl font-bold break-words sm:text-2xl ${c.icon}`}>
                      {(() => {
                        const value = pricingView === "yearly"
                          ? Number(p.yearlyPrice ?? ((p.monthlyPrice ?? p.price ?? 0) * 12))
                          : Number(p.monthlyPrice ?? p.price ?? 0);
                        return value === 0 ? "Free" : `₹${value}`;
                      })()}
                    </span>
                    {((pricingView === "yearly"
                      ? Number(p.yearlyPrice ?? ((p.monthlyPrice ?? p.price ?? 0) * 12))
                      : Number(p.monthlyPrice ?? p.price ?? 0)) > 0) && (
                      <span className="ml-1 text-xs admin-surface-muted">/{pricingView}</span>
                    )}
                  </div>
                  {p.description && <p className="mt-1.5 break-words text-xs admin-surface-muted">{p.description}</p>}
                  <ul className="mt-3 flex-1 space-y-1">
                    {(p.features ?? []).slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs admin-surface-muted">
                        <Check className="mt-0.5 size-3 shrink-0 text-sa-accent" />
                        <span className="min-w-0 break-words">{f}</span>
                      </li>
                    ))}
                    {(p.features ?? []).length > 4 && (
                      <li className="text-xs admin-surface-faint">+{p.features.length - 4} more</li>
                    )}
                  </ul>
                  <div className="mt-4 flex items-center gap-1.5 text-xs admin-surface-faint">
                    <Users className="size-3" />
                    {p.subscribers} restaurant{p.subscribers !== 1 ? "s" : ""}
                  </div>
                  <div className={`mt-3 flex gap-1.5 border-t pt-3 ${c.divider}`}>
                    <button type="button" onClick={() => openAssign(p.slug)}
                      className={`cursor-pointer flex flex-1 items-center justify-center gap-1 rounded-lg border bg-[var(--admin-surface)] py-1.5 text-xs font-medium admin-surface-body transition-colors hover:bg-[var(--admin-hover)] ${c.btnBorder}`}>
                      Assign
                    </button>
                    <button type="button" onClick={() => openEdit(p)}
                      className={`cursor-pointer flex items-center justify-center rounded-lg border bg-[var(--admin-surface)] p-1.5 admin-surface-muted transition-colors hover:bg-[var(--admin-hover)] hover:admin-shell-text ${c.btnBorder}`}>
                      <Pencil className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(p)}
                      className={`cursor-pointer flex items-center justify-center rounded-lg border bg-[var(--admin-surface)] p-1.5 admin-surface-muted transition-colors hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 ${c.btnBorder}`}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Plan" : "Create Plan"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setModalOpen(false)}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body transition-colors hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="w-full cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-40 sm:w-auto">
              {saving ? "Saving…" : "Save Plan"}
            </button>
          </div>
        }>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium admin-surface-muted">Plan Name *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  clearFieldError("name");
                }}
                placeholder="e.g. Pro"
                aria-invalid={fieldErrors.name ? true : undefined}
                className={`mt-1 ${saInputCls}`}
              />
              <FieldError message={fieldErrors.name} />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Monthly Price (USD) *</label>
              <input
                {...decimalInputProps({ min: 0, step: "0.01" })}
                value={form.monthlyPrice}
                onChange={(e) => {
                  setForm((f) => ({ ...f, monthlyPrice: e.target.value }));
                  clearFieldError("monthlyPrice");
                }}
                placeholder="29"
                aria-invalid={fieldErrors.monthlyPrice ? true : undefined}
                className={`mt-1 ${saInputCls}`}
              />
              <FieldError message={fieldErrors.monthlyPrice} />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Yearly Price (USD) *</label>
              <input
                {...decimalInputProps({ min: 0, step: "0.01" })}
                value={form.yearlyPrice}
                onChange={(e) => {
                  setForm((f) => ({ ...f, yearlyPrice: e.target.value }));
                  clearFieldError("yearlyPrice");
                }}
                placeholder="299"
                aria-invalid={fieldErrors.yearlyPrice ? true : undefined}
                className={`mt-1 ${saInputCls}`}
              />
              <FieldError message={fieldErrors.yearlyPrice} />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Default Billing Cycle</label>
              <select
                value={form.billingCycle}
                onChange={(e) => {
                  setForm((f) => ({ ...f, billingCycle: e.target.value }));
                  clearFieldError("billingCycle");
                }}
                className={`cursor-pointer mt-1 ${saInputCls}`}
              >
                {BILLING_CYCLES.map((b) => <option key={b} value={b} className="capitalize">{b}</option>)}
              </select>
              <FieldError message={fieldErrors.billingCycle} />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                maxLength={500}
                className={`mt-1 ${saInputCls}`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Features <span className="text-zinc-600">(comma-separated)</span></label>
            <textarea
              rows={2}
              value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              placeholder="Full POS, Inventory, Analytics, Priority support"
              className={`mt-1 ${saTextareaCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Limits <span className="text-zinc-600">(-1 = unlimited)</span></label>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { key: "staff", label: "staff", errKey: "limitsStaff" },
                { key: "tables", label: "tables", errKey: "limitsTables" },
                { key: "menuItems", label: "menuItems", errKey: "limitsMenuItems" },
                { key: "orders", label: "orders", errKey: "limitsOrders" },
              ].map(({ key, label, errKey }) => (
                <div key={key}>
                  <label className="text-[10px] capitalize text-zinc-600">{label}</label>
                  <input
                    {...intInputProps({ min: -1, step: 1 })}
                    value={form.limits[key]}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d-]/g, "");
                      setForm((f) => ({ ...f, limits: { ...f.limits, [key]: v } }));
                      clearFieldError(errKey);
                    }}
                    placeholder="-1"
                    aria-invalid={fieldErrors[errKey] ? true : undefined}
                    className={`mt-0.5 ${saInputCls}`}
                  />
                  <FieldError message={fieldErrors[errKey]} />
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Assign Plan Modal ── */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Plan to Restaurant"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setAssignOpen(false)}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body transition-colors hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={assignPlan} disabled={assigning}
              className="w-full cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-40 sm:w-auto">
              {assigning ? "Assigning…" : "Assign Plan"}
            </button>
          </div>
        }>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            assignPlan();
          }}
        >
          {assignError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{assignError}</p>
          )}
          <div>
            <label className="text-xs font-medium admin-surface-muted">Restaurant *</label>
            <select
              value={assignForm.restaurantId}
              onChange={(e) => {
                setAssignForm((f) => ({ ...f, restaurantId: e.target.value }));
                clearAssignFieldError("restaurantId");
              }}
              aria-invalid={assignFieldErrors.restaurantId ? true : undefined}
              className={`cursor-pointer mt-1 ${saInputCls}`}
            >
              <option value="">— Select restaurant —</option>
              {assignRestaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.ownerEmail ?? ""}</option>
              ))}
            </select>
            <FieldError message={assignFieldErrors.restaurantId} />
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Plan *</label>
            <select
              value={assignForm.planSlug}
              onChange={(e) => {
                setAssignForm((f) => ({ ...f, planSlug: e.target.value }));
                clearAssignFieldError("planSlug");
              }}
              aria-invalid={assignFieldErrors.planSlug ? true : undefined}
              className={`cursor-pointer mt-1 ${saInputCls}`}
            >
              <option value="">— Select plan —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} — {p.price === 0 ? "Free" : `${formatSaMoney(p.price)}/${p.billingCycle}`}
                </option>
              ))}
            </select>
            <FieldError message={assignFieldErrors.planSlug} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium admin-surface-muted">Start Date</label>
              <input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => {
                  setAssignForm((f) => ({ ...f, startDate: e.target.value }));
                  clearAssignFieldError("startDate");
                  clearAssignFieldError("endDate");
                }}
                aria-invalid={assignFieldErrors.startDate ? true : undefined}
                className={`mt-1 ${saInputCls}`}
              />
              <FieldError message={assignFieldErrors.startDate} />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">End Date</label>
              <input
                type="date"
                value={assignForm.endDate}
                min={assignForm.startDate || undefined}
                onChange={(e) => {
                  setAssignForm((f) => ({ ...f, endDate: e.target.value }));
                  clearAssignFieldError("endDate");
                  clearAssignFieldError("startDate");
                }}
                aria-invalid={assignFieldErrors.endDate ? true : undefined}
                className={`mt-1 ${saInputCls}`}
              />
              <FieldError message={assignFieldErrors.endDate} />
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Trial Days</label>
              <input
                {...intInputProps({ min: 0, max: 90, step: 1 })}
                value={assignForm.trialDays}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setAssignForm((f) => ({ ...f, trialDays: v }));
                  clearAssignFieldError("trialDays");
                }}
                placeholder="0"
                aria-invalid={assignFieldErrors.trialDays ? true : undefined}
                className={`mt-1 ${saInputCls}`}
              />
              <FieldError message={assignFieldErrors.trialDays} />
            </div>
          </div>
          <p className="text-[11px] text-zinc-600">Leave Start/End blank to use today + 1 billing cycle automatically.</p>
        </form>
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
