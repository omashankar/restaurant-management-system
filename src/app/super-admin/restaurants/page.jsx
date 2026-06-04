"use client";


import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchField from "@/components/ui/SearchField";
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
import Modal from "@/components/ui/Modal";
import PasswordInput from "@/components/ui/PasswordInput";
import PhoneInput from "@/components/ui/PhoneInput";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_SIGNUP_PASSWORD_SECURITY,
  EMPTY_RESTAURANT_EDIT_ERRORS,
  getRestaurantCreateFieldErrors,
  getRestaurantEditFieldErrors,
} from "@/lib/formValidation";
import {
  Building2, Calendar, ChevronLeft, ChevronRight,
  Crown, Eye, Mail, MapPin,
  Pencil, Phone, Plus, RefreshCw, ShieldCheck, ShieldOff,
  Search, Trash2, X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PLANS    = ["free", "starter", "pro", "enterprise"];
const STATUSES = ["active", "inactive", "suspended"];
const OWNER_STATUSES = ["active", "inactive", "blocked"];
const PAGE_SIZE = 10;

const PLAN_BADGE = {
  free:       "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  starter:    "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  pro:        "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",
  enterprise: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
};

const PLAN_DOT = {
  free: "bg-zinc-500", starter: "bg-sky-500",
  pro: "bg-indigo-500", enterprise: "bg-amber-500",
};

const emptyForm = {
  name: "", slug: "", ownerName: "", ownerEmail: "", ownerPassword: "",
  phone: "", address: "", plan: "free", status: "active",
};

const inputCls = "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm outline-none focus-sa-primary placeholder:admin-surface-faint transition-colors";
const fieldErrorCls = "mt-1 text-xs text-red-400";

const EMPTY_CREATE_FIELD_ERRORS = {
  name: "",
  slug: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  phone: "",
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className={fieldErrorCls} role="alert">{message}</p>;
}

/* ─────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40 ${
        checked ? "bg-sa-primary" : "bg-[var(--admin-border)]"
      }`}
    >
      <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? "translate-x-4" : "translate-x-0.5"
      }`} />
    </button>
  );
}

/* ─────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   PREVIEW MODAL
───────────────────────────────────────── */
function PreviewModal({ restaurant, onClose }) {
  if (!restaurant) return null;
  return (
    <Modal open={!!restaurant} onClose={onClose} title="Restaurant Details"
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose}
            className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body hover:border-zinc-500 transition-colors">
            Close
          </button>
        </div>
      }>
      <div className="space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sa-accent-10 text-2xl font-bold text-sa-accent ring-1 ring-sa-accent-25">
            {restaurant.name?.[0]?.toUpperCase()}
          </span>
          <div>
            <h3 className="admin-surface-title text-lg font-semibold">{restaurant.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${PLAN_BADGE[restaurant.plan] ?? PLAN_BADGE.free}`}>
                <span className={`size-1.5 rounded-full ${PLAN_DOT[restaurant.plan] ?? "bg-zinc-500"}`} />
                {restaurant.plan}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                restaurant.status === "active"
                  ? "sa-status-badge"
                  : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"
              }`}>
                {restaurant.status}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t admin-shell-border" />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Admin", value: restaurant.roleCounts?.admin ?? 0, tone: "text-sa-accent" },
            { label: "Manager", value: restaurant.roleCounts?.manager ?? 0, tone: "text-indigo-400" },
            { label: "Waiter", value: restaurant.roleCounts?.waiter ?? 0, tone: "text-sky-400" },
            { label: "Chef", value: restaurant.roleCounts?.chef ?? 0, tone: "text-amber-400" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border admin-shell-border admin-surface-card px-3 py-2">
              <p className={"text-lg font-semibold " + item.tone}>{item.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Crown,    label: "Owner",   value: restaurant.ownerName },
            { icon: Mail,     label: "Email",   value: restaurant.ownerEmail },
            { icon: Phone,    label: "Phone",   value: restaurant.phone !== "—" ? restaurant.phone : "Not provided" },
            { icon: Calendar, label: "Created", value: restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5">
              <Icon className="mt-0.5 size-4 shrink-0 text-zinc-500" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
                <p className="mt-0.5 truncate text-sm admin-shell-text">{value || "—"}</p>
              </div>
            </div>
          ))}
          {restaurant.address && (
            <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border admin-shell-border admin-surface-card px-3 py-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-500" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Address</p>
                <p className="mt-0.5 text-sm admin-shell-text">{restaurant.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function RestaurantsPage() {
  const [restaurants, setRestaurants]   = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [listStats, setListStats]       = useState({
    total: 0, active: 0, inactive: 0, suspended: 0,
  });
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter]     = useState("all");
  const [ownerStatusFilter, setOwnerStatusFilter] = useState("all");
  const [page, setPage]                 = useState(1);
  const [togglingId, setTogglingId]     = useState(null);
  const [ownerTogglingId, setOwnerTogglingId] = useState(null);

  // Create modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(emptyForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState(EMPTY_CREATE_FIELD_ERRORS);
  const [creating, setCreating]       = useState(false);

  // Edit modal
  const [editTarget, setEditTarget]   = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [editError, setEditError]     = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState(EMPTY_RESTAURANT_EDIT_ERRORS);
  const [saving, setSaving]           = useState(false);

  // Preview modal
  const [previewTarget, setPreviewTarget] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const { showToast, ToastUI } = useToast();

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, planFilter, ownerStatusFilter]);

  /* Fetch — server-side page + ownerStatus (billing still calls API without `page`) */
  const fetchRestaurants = useCallback(async (pageOverride) => {
    const effectivePage = typeof pageOverride === "number" ? pageOverride : page;
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (planFilter   !== "all") params.set("plan",   planFilter);
      if (ownerStatusFilter !== "all") params.set("ownerStatus", ownerStatusFilter);
      params.set("page", String(effectivePage));
      params.set("pageSize", String(PAGE_SIZE));
      const res  = await fetch("/api/super-admin/restaurants?" + params);
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data?.error ?? "Failed to load restaurants.";
        setLoadError(msg);
        showToast(msg, "error");
        return;
      }
      const rows = data.restaurants ?? [];
      if (rows.length === 0 && effectivePage > 1) {
        setPage((p) => Math.max(1, p - 1));
        return;
      }
      setRestaurants(rows);
      if (typeof data.total === "number") {
        setTotalCount(data.total);
        if (data.stats) setListStats(data.stats);
      } else {
        setTotalCount(rows.length);
        setListStats({
          total:     rows.length,
          active:    rows.filter((r) => r.status === "active").length,
          inactive:  rows.filter((r) => r.status === "inactive").length,
          suspended: rows.filter((r) => r.status === "suspended").length,
        });
      }
    } catch {
      const msg = "Could not load restaurants.";
      setLoadError(msg);
      showToast(msg, "error");
    }
    finally { setLoading(false); }
  }, [search, statusFilter, planFilter, ownerStatusFilter, page, showToast]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* Toggle status */
  const toggleStatus = async (r) => {
    const newStatus = r.status === "active" ? "inactive" : "active";
    setTogglingId(r.id);
    try {
      const res  = await fetch("/api/super-admin/restaurants/" + r.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed.", "error"); return; }
      setRestaurants((prev) => prev.map((x) => x.id === r.id ? { ...x, status: newStatus } : x));
      showToast(r.name + " " + (newStatus === "active" ? "activated." : "deactivated."));
      fetchRestaurants();
    } catch { showToast("Network error.", "error"); }
    finally { setTogglingId(null); }
  };

  const toggleOwnerStatus = async (r) => {
    if (!r.ownerId) {
      showToast("Owner admin not linked.", "error");
      return;
    }
    const next = r.ownerStatus === "blocked" ? "active" : "blocked";
    setOwnerTogglingId(r.id);
    try {
      const res = await fetch("/api/super-admin/users/" + r.ownerId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed.", "error"); return; }
      setRestaurants((prev) => prev.map((x) => x.id === r.id ? { ...x, ownerStatus: next } : x));
      showToast(next === "blocked" ? "Owner admin blocked." : "Owner admin unblocked.");
      fetchRestaurants();
    } catch {
      showToast("Network error.", "error");
    } finally {
      setOwnerTogglingId(null);
    }
  };

  /* Create */
  const clearCreateFieldError = (key) => {
    if (createFieldErrors[key]) {
      setCreateFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const openCreateModal = () => {
    setCreateForm(emptyForm);
    setSlugManuallyEdited(false);
    setCreateError("");
    setCreateFieldErrors(EMPTY_CREATE_FIELD_ERRORS);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const errors = getRestaurantCreateFieldErrors(createForm);
    setCreateFieldErrors(errors);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setCreateError(firstError);
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/super-admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          ownerEmail: createForm.ownerEmail.trim(),
          name: createForm.name.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setCreateError(data.error ?? "Failed to create.");
        return;
      }
      showToast(createForm.name + " created successfully.");
      setCreateOpen(false);
      setCreateForm(emptyForm);
      setSlugManuallyEdited(false);
      setCreateFieldErrors(EMPTY_CREATE_FIELD_ERRORS);
      setPage(1);
      await fetchRestaurants(1);
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreating(false);
    }
  };

  const clearEditFieldError = (key) => {
    if (editFieldErrors[key]) {
      setEditFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  /* Open edit */
  const openEdit = (r) => {
    setEditTarget(r);
    setEditForm({
      name: r.name,
      slug: r.slug ?? "",
      plan: r.plan,
      phone: r.phone && r.phone !== "—" ? r.phone : "",
      address: r.address ?? "",
    });
    setEditError("");
    setEditFieldErrors(EMPTY_RESTAURANT_EDIT_ERRORS);
  };

  /* Save edit */
  const handleEdit = async () => {
    const errors = getRestaurantEditFieldErrors(editForm);
    setEditFieldErrors(errors);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setEditError(firstError);
      return;
    }

    setSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/super-admin/restaurants/" + editTarget.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          slug: editForm.slug,
          plan: editForm.plan,
          phone: editForm.phone,
          address: editForm.address?.trim() ?? "",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.error ?? "Failed to save.");
        return;
      }
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                name: editForm.name.trim(),
                slug: editForm.slug,
                plan: editForm.plan,
                phone: editForm.phone || "—",
                address: editForm.address ?? "",
              }
            : r,
        ),
      );
      showToast(editForm.name + " updated.");
      setEditTarget(null);
      fetchRestaurants();
    } catch { setEditError("Network error."); }
    finally { setSaving(false); }
  };

  /* Delete */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch("/api/super-admin/restaurants/" + deleteTarget.id, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      showToast(deleteTarget.name + " deleted.");
      await fetchRestaurants();
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  const stats = listStats;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`mt-1 ${saIconBadgeCls}`}>
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Restaurants</h1>
            <p className="mt-1 text-sm admin-surface-muted">Manage all registered tenants and their admin accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchRestaurants}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:admin-shell-text transition-colors">
            <RefreshCw className={"size-4 " + (loading ? saSpinnerCls : "")} />
          </button>
          <button type="button" onClick={openCreateModal}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-sa-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 transition-colors">
            <Plus className="size-4" /> Add Restaurant
          </button>
        </div>
      </div>

      {/* Stats */}
      {loadError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,     color: "admin-shell-text"    },
          { label: "Active",    value: stats.active,    color: "text-sa-accent" },
          { label: "Inactive",  value: stats.inactive,  color: "text-zinc-500"    },
          { label: "Suspended", value: stats.suspended, color: "text-red-400"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-surface-card px-4 py-3">
            <p className={"text-xl font-bold " + color}>{value}</p>
            <p className="mt-0.5 admin-surface-faint">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          className="min-w-[200px] max-w-sm flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          clearable
          inputClassName="focus-sa-primary"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border admin-shell-border admin-surface-input px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="cursor-pointer rounded-xl border admin-shell-border admin-surface-input px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary">
          <option value="all">All plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select value={ownerStatusFilter} onChange={(e) => { setOwnerStatusFilter(e.target.value); setPage(1); }}
          className="cursor-pointer rounded-xl border admin-shell-border admin-surface-input px-3 py-2.5 text-sm admin-shell-text outline-none focus-sa-primary">
          <option value="all">All owner statuses</option>
          {OWNER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SuperAdminPageSkeleton rows={6} rowClassName="h-16" />
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-20 text-center">
          <Building2 className="size-10 text-zinc-700" />
          <p className="text-sm admin-surface-muted">No restaurants found for selected filters.</p>
          <button type="button" onClick={openCreateModal}
            className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110">
            Add First Restaurant
          </button>
        </div>
      ) : (
        <DataTableShell>
            <AdminTable>
              <AdminTableHead>
                <AdminTableHeadRow>
                  <AdminTableTh>Restaurant</AdminTableTh>
                  <AdminTableTh hidden="md">Owner Admin</AdminTableTh>
                  <AdminTableTh hidden="lg">Phone</AdminTableTh>
                  <AdminTableTh hidden="md">Plan</AdminTableTh>
                  <AdminTableTh>Status</AdminTableTh>
                  <AdminTableTh hidden="lg">Created</AdminTableTh>
                  <AdminTableThActions />
                </AdminTableHeadRow>
              </AdminTableHead>
              <AdminTableBody>
                {restaurants.map((r) => (
                  <AdminTableRow key={r.id} className={r.status !== "active" ? "opacity-70" : ""}>
                    <AdminTableTd>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sa-accent-10 text-sm font-bold text-sa-accent ring-1 ring-sa-accent-25">
                          {r.name?.[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold admin-shell-text">{r.name}</p>
                          {r.slug ? (
                            <a
                              href={`/r/${r.slug}/home`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-xs text-sa-primary hover-sa-primary hover:underline"
                            >
                              /r/{r.slug}
                            </a>
                          ) : (
                            <p className="truncate text-xs admin-surface-faint md:hidden">{r.ownerEmail}</p>
                          )}
                        </div>
                      </div>
                    </AdminTableTd>

                    <AdminTableTd hidden="md">
                      <div className="flex items-center gap-2 min-w-0">
                        <Crown className="size-3 shrink-0 text-amber-500/60" />
                        <div className="min-w-0">
                          <p className="truncate text-sm admin-shell-text">{r.ownerName}</p>
                          <p className="truncate admin-surface-faint">{r.ownerEmail}</p>
                          <p className="mt-0.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                              r.ownerStatus === "active"
                                ? "sa-status-badge"
                                : r.ownerStatus === "blocked"
                                  ? "bg-red-500/15 text-red-400 ring-red-500/25"
                                  : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"
                            }`}>
                              {r.ownerStatus}
                            </span>
                          </p>
                        </div>
                      </div>
                    </AdminTableTd>

                    <AdminTableTd hidden="lg">
                      <span className="text-xs text-zinc-400">{r.phone !== "—" ? r.phone : <span className="text-zinc-700">—</span>}</span>
                    </AdminTableTd>

                    <AdminTableTd hidden="md">
                      <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[r.plan] ?? PLAN_BADGE.free)}>
                        <span className={"size-1.5 rounded-full " + (PLAN_DOT[r.plan] ?? "bg-zinc-500")} />
                        {r.plan}
                      </span>
                      <p className="mt-1 text-[10px] admin-surface-faint">
                        A:{r.roleCounts?.admin ?? 0} · M:{r.roleCounts?.manager ?? 0} · W:{r.roleCounts?.waiter ?? 0} · C:{r.roleCounts?.chef ?? 0}
                      </p>
                    </AdminTableTd>

                    <AdminTableTd>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={r.status === "active"}
                          onChange={() => toggleStatus(r)}
                          disabled={togglingId === r.id}
                        />
                        <span className={"text-xs font-medium " + (r.status === "active" ? "text-sa-accent" : "text-zinc-500")}>
                          {r.status === "active" ? "Active" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </div>
                    </AdminTableTd>

                    <AdminTableTd hidden="lg" className="text-xs admin-surface-faint">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </AdminTableTd>

                    <AdminTableActionsCell>
                        <AdminTableIconButton variant="sky" onClick={() => setPreviewTarget(r)} title="View details" aria-label="View details">
                          <Eye className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton onClick={() => openEdit(r)} title="Edit restaurant" aria-label="Edit restaurant">
                          <Pencil className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton variant="danger" onClick={() => setDeleteTarget(r)} title="Delete restaurant" aria-label="Delete restaurant">
                          <Trash2 className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton
                          onClick={() => toggleOwnerStatus(r)}
                          disabled={ownerTogglingId === r.id}
                          title={r.ownerStatus === "blocked" ? "Unblock owner admin" : "Block owner admin"}
                          aria-label={r.ownerStatus === "blocked" ? "Unblock owner admin" : "Block owner admin"}
                          className={r.ownerStatus === "blocked" ? "hover:text-sa-primary" : "hover:text-amber-500"}
                        >
                          {r.ownerStatus === "blocked" ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
                        </AdminTableIconButton>
                    </AdminTableActionsCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t admin-shell-border px-4 py-3">
            <p className="text-xs admin-surface-faint">
              {totalCount} restaurant{totalCount !== 1 ? "s" : ""}
              {totalPages > 1 && " · page " + page + " of " + totalPages}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border admin-shell-border text-zinc-400 hover:border-zinc-600 hover:admin-shell-text disabled:opacity-30 transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)}
                    className={"cursor-pointer flex size-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors " + (n === page ? "border-sa-primary-40 bg-sa-primary-10 text-sa-primary" : "admin-shell-border text-zinc-500 hover:border-zinc-600 hover:admin-surface-body")}>
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border admin-shell-border text-zinc-400 hover:border-zinc-600 hover:admin-shell-text disabled:opacity-30 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </DataTableShell>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Restaurant"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)}
              className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} disabled={creating}
              className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 transition-colors">
              {creating ? "Creating…" : "Create Restaurant"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {createError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400" role="alert">
              {createError}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Restaurant Name" required>
                <input
                  value={createForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setCreateForm((f) => ({
                      ...f,
                      name,
                      slug: slugManuallyEdited ? f.slug : autoSlug,
                    }));
                    clearCreateFieldError("name");
                    if (!slugManuallyEdited) clearCreateFieldError("slug");
                  }}
                  placeholder="e.g. The Grand Kitchen"
                  className={inputCls}
                  aria-invalid={createFieldErrors.name ? true : undefined}
                />
                <FieldError message={createFieldErrors.name} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="URL Slug (Customer Site Address)" required>
                <div className="flex items-center gap-0 overflow-hidden rounded-xl border admin-shell-border admin-surface-input focus-within-sa-primary">
                  <span className="shrink-0 border-r admin-shell-border bg-[var(--admin-hover-strong)] px-3 py-2.5 admin-surface-faint whitespace-nowrap">
                    yoursite.com/r/
                  </span>
                  <input
                    value={createForm.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setCreateForm((f) => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      }));
                      clearCreateFieldError("slug");
                    }}
                    placeholder="pizza-palace"
                    className="w-full bg-transparent px-3 py-2.5 text-sm admin-shell-text outline-none placeholder:admin-surface-faint"
                    aria-invalid={createFieldErrors.slug ? true : undefined}
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Sirf lowercase letters, numbers aur hyphens. e.g.{" "}
                  <span className="text-zinc-400">pizza-palace</span>
                </p>
                <FieldError message={createFieldErrors.slug} />
              </Field>
            </div>
            <Field label="Owner Name">
              <input
                value={createForm.ownerName}
                onChange={(e) => {
                  setCreateForm((f) => ({ ...f, ownerName: e.target.value }));
                  clearCreateFieldError("ownerName");
                }}
                placeholder="Full name"
                className={inputCls}
                aria-invalid={createFieldErrors.ownerName ? true : undefined}
              />
              <FieldError message={createFieldErrors.ownerName} />
            </Field>
            <Field label="Owner Email" required>
              <input
                type="email"
                autoComplete="email"
                value={createForm.ownerEmail}
                onChange={(e) => {
                  setCreateForm((f) => ({ ...f, ownerEmail: e.target.value }));
                  clearCreateFieldError("ownerEmail");
                }}
                placeholder="owner@restaurant.com"
                className={inputCls}
                aria-invalid={createFieldErrors.ownerEmail ? true : undefined}
              />
              <FieldError message={createFieldErrors.ownerEmail} />
            </Field>
            <div className="sm:col-span-2">
              <PasswordInput
                id="create-owner-password"
                label="Password"
                required
                autoComplete="new-password"
                value={createForm.ownerPassword}
                onChange={(v) => {
                  setCreateForm((f) => ({ ...f, ownerPassword: v }));
                  clearCreateFieldError("ownerPassword");
                }}
                placeholder="Min 8 characters"
                labelClassName="block text-xs font-medium text-zinc-400 mb-1"
                inputClassName={`${inputCls} pr-11`}
                hint={`At least ${DEFAULT_SIGNUP_PASSWORD_SECURITY.minPasswordLength} characters, with a number and special character.`}
                error={createFieldErrors.ownerPassword || undefined}
              />
            </div>
            <PhoneInput
              id="create-restaurant-phone"
              label="Phone"
              labelClassName="block text-xs font-medium text-zinc-400 mb-1"
              value={createForm.phone}
              onChange={(digits) => {
                setCreateForm((f) => ({ ...f, phone: digits }));
                clearCreateFieldError("phone");
              }}
              error={createFieldErrors.phone || undefined}
              className="sm:col-span-1"
            />
            <Field label="Plan">
              <select value={createForm.plan} onChange={(e) => setCreateForm((f) => ({ ...f, plan: e.target.value }))}
                className={"cursor-pointer " + inputCls}>
                {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input value={createForm.address} onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St, City, Country (optional)" className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-xl border admin-shell-border admin-surface-card px-4 py-3">
              <div>
                <p className="text-sm font-medium admin-shell-text">Status</p>
                <p className="admin-surface-faint">Restaurant will be {createForm.status === "active" ? "active" : "inactive"} immediately</p>
              </div>
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={createForm.status === "active"}
                  onChange={(v) => setCreateForm((f) => ({ ...f, status: v ? "active" : "inactive" }))}
                />
                <span className={"text-xs font-medium " + (createForm.status === "active" ? "text-sa-accent" : "text-zinc-500")}>
                  {createForm.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-600">
            An admin account will be created automatically and linked to this restaurant.
          </p>
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)}
        title={editTarget ? "Edit — " + editTarget.name : "Edit Restaurant"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditTarget(null)}
              className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleEdit} disabled={saving}
              className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {editError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400" role="alert">
              {editError}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Restaurant Name" required>
                <input
                  value={editForm.name ?? ""}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, name: e.target.value }));
                    clearEditFieldError("name");
                  }}
                  className={inputCls}
                  aria-invalid={editFieldErrors.name ? true : undefined}
                />
                <FieldError message={editFieldErrors.name} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="URL Slug (Customer Site Address)" required>
                <div className="flex items-center gap-0 overflow-hidden rounded-xl border admin-shell-border admin-surface-input focus-within-sa-primary">
                  <span className="shrink-0 border-r admin-shell-border bg-[var(--admin-hover-strong)] px-3 py-2.5 admin-surface-faint whitespace-nowrap">
                    yoursite.com/r/
                  </span>
                  <input
                    value={editForm.slug ?? ""}
                    onChange={(e) => {
                      setEditForm((f) => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      }));
                      clearEditFieldError("slug");
                    }}
                    placeholder="pizza-palace"
                    className="w-full bg-transparent px-3 py-2.5 text-sm admin-shell-text outline-none placeholder:admin-surface-faint"
                    aria-invalid={editFieldErrors.slug ? true : undefined}
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Slug change karne se purane QR codes kaam karna band kar denge.
                </p>
                <FieldError message={editFieldErrors.slug} />
              </Field>
            </div>
            <PhoneInput
              id="edit-restaurant-phone"
              label="Phone"
              labelClassName="block text-xs font-medium text-zinc-400 mb-1"
              value={editForm.phone ?? ""}
              onChange={(digits) => {
                setEditForm((f) => ({ ...f, phone: digits }));
                clearEditFieldError("phone");
              }}
              error={editFieldErrors.phone || undefined}
            />
            <Field label="Plan">
              <select
                value={editForm.plan ?? "free"}
                onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                className={"cursor-pointer " + inputCls}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input
                  value={editForm.address ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St, City, Country (optional)"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
          {editTarget && (
            <div className="rounded-xl border admin-shell-border admin-surface-card px-4 py-3 admin-surface-faint">
              Owner: <span className="admin-surface-body">{editTarget.ownerName}</span>
              {" · "}<span className="text-zinc-400">{editTarget.ownerEmail}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Preview modal */}
      <PreviewModal restaurant={previewTarget} onClose={() => setPreviewTarget(null)} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete restaurant?"
        message={deleteTarget ? "\"" + deleteTarget.name + "\" and all its users will be permanently deleted." : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {ToastUI}
    </div>
  );
}
