"use client";



import CouponFormModal, {

  couponToForm,

  EMPTY_COUPON_FORM,

  formToPayload,

} from "@/components/coupons/CouponFormModal";

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

import ConfirmDialog from "@/components/ui/ConfirmDialog";

import DataTableShell from "@/components/ui/DataTableShell";

import EmptyState from "@/components/ui/EmptyState";

import ListToolbar from "@/components/ui/ListToolbar";

import PaginationBar from "@/components/ui/PaginationBar";

import { useApp } from "@/context/AppProviders";

import { usePaginatedList } from "@/hooks/usePaginatedList";

import { useToast } from "@/hooks/useToast";

import { formatAdminMoney } from "@/lib/adminCurrency";

import { raFilterSelectCls, raIconBadgeCls, raPagePrimaryBtnCls, raPageRefreshBtnCls, raSpinnerCls, raToggleOnCls } from "@/config/restaurantAdminTheme";

import { Pencil, Plus, RefreshCw, Tag, Trash2 } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";



function formatDiscount(coupon, currency = "INR") {

  if (coupon.type === "percent") return `${coupon.value}%`;

  if (coupon.type === "free_delivery") return "Free delivery";

  return formatAdminMoney(coupon.value, currency, { decimals: 0 });

}



function formatValidity(coupon) {

  const from = coupon.startsAt

    ? new Date(coupon.startsAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

    : null;

  const to = coupon.expiresAt

    ? new Date(coupon.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

    : null;

  if (from && to) return `${from} – ${to}`;

  if (from) return `From ${from}`;

  if (to) return `Until ${to}`;

  return "No date limit";

}

function CouponStatusToggle({ active, loading, onToggle }) {
  const handleToggle = (e) => {
    e.stopPropagation();
    if (loading) return;
    onToggle();
  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? "Deactivate coupon" : "Activate coupon"}
        aria-busy={loading}
        disabled={loading}
        onClick={handleToggle}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-[background-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ra-primary/50 disabled:cursor-wait ${
          active ? raToggleOnCls : "bg-[var(--admin-border)]"
        } ${loading ? "opacity-70" : ""}`}
      >
        <span
          aria-hidden
          className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-200 ease-out ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        className={`cursor-pointer text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
          active ? "text-ra-primary" : "admin-surface-muted"
        }`}
      >
        {loading ? "Updating…" : active ? "Active" : "Inactive"}
      </button>
    </div>
  );
}

export default function CouponsPage() {

  const { user } = useApp();

  const canDelete = user?.role === "admin";

  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_COUPON_FORM);

  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");

  const [togglingId, setTogglingId] = useState(null);

  const { showToast, ToastUI } = useToast();



  const fetchCoupons = useCallback(async (silent = false) => {

    if (!silent) setLoading(true);

    else setRefreshing(true);

    try {

      const res = await fetch("/api/coupons", { cache: "no-store" });

      const data = await res.json();

      if (res.ok && data?.success) setCoupons(data.coupons ?? []);

      else showToast(data?.error ?? "Could not load coupons.", "error");

    } catch {

      showToast("Could not load coupons.", "error");

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [showToast]);



  useEffect(() => {

    fetchCoupons();

  }, [fetchCoupons]);



  const statusFiltered = useMemo(() => {

    if (statusFilter === "all") return coupons;

    if (statusFilter === "active") return coupons.filter((c) => c.active !== false);

    return coupons.filter((c) => c.active === false);

  }, [coupons, statusFilter]);



  const {

    search,

    setSearch,

    page,

    setPage,

    pageRows,

    total,

    totalPages,

    pageSize,

  } = usePaginatedList(statusFiltered, {

    searchKeys: ["code", "label"],

    pageSize: 10,

    resetKey: statusFilter,

  });



  const openCreate = () => {

    setEditingId(null);

    setForm(EMPTY_COUPON_FORM);

    setFormError("");

    setModalOpen(true);

  };



  const openEdit = (coupon) => {

    setEditingId(coupon.id);

    setForm(couponToForm(coupon));

    setFormError("");

    setModalOpen(true);

  };



  const saveCoupon = async () => {

    if (!form.code.trim() || !form.label.trim()) {

      setFormError("Coupon name and code are required.");

      return;

    }

    if (!form.value || Number(form.value) <= 0) {

      setFormError("Discount value must be greater than 0.");

      return;

    }

    if (!form.startsAt || !form.expiresAt) {

      setFormError("Valid from and valid to dates are required.");

      return;

    }

    if (form.usageLimitMode === "limited" && (!form.usageLimit || Number(form.usageLimit) < 1)) {

      setFormError("Usage limit must be at least 1.");

      return;

    }

    if (form.orderTypeScope === "specific" && !form.orderTypes.length) {

      setFormError("Select at least one order type.");

      return;

    }



    setSaving(true);

    setFormError("");

    try {

      const res = await fetch(editingId ? `/api/coupons/${editingId}` : "/api/coupons", {

        method: editingId ? "PATCH" : "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(formToPayload(form)),

      });

      const data = await res.json();

      if (!res.ok || !data?.success) {

        setFormError(data?.error ?? "Could not save coupon.");

        return;

      }

      showToast(editingId ? "Coupon updated." : "Coupon created.");

      setModalOpen(false);

      fetchCoupons(true);

    } catch {

      setFormError("Could not save coupon.");

    } finally {

      setSaving(false);

    }

  };



  const toggleCouponActive = async (coupon) => {
    if (togglingId === coupon.id) return;
    const isActive = coupon.active !== false;
    const nextActive = !isActive;

    setTogglingId(coupon.id);
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, active: nextActive } : c)),
    );

    try {
      const res = await fetch(`/api/coupons/${coupon.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: isActive } : c)),
        );
        showToast(data?.error ?? "Could not update coupon status.", "error");
        return;
      }
      const confirmedActive =
        typeof data.active === "boolean" ? data.active : data.coupon?.active !== false;
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: confirmedActive } : c)),
      );
      showToast(confirmedActive ? "Coupon activated." : "Coupon deactivated.");
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: isActive } : c)),
      );
      showToast("Could not update coupon status.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {

    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {

      const res = await fetch(`/api/coupons/${deleteTarget.id}`, { method: "DELETE" });

      const data = await res.json();

      if (!res.ok || !data?.success) {

        showToast(data?.error ?? "Could not delete coupon.", "error");

        return;

      }

      showToast("Coupon deleted.");

      setDeleteTarget(null);

      fetchCoupons(true);

    } finally {

      setDeleting(false);

    }

  };



  return (

    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div className="flex min-w-0 items-start gap-3">

          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>

            <Tag className="size-5" aria-hidden />

          </span>

          <div className="min-w-0">

            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">

              Coupons

            </h1>

            <p className="admin-page-desc mt-1 break-words text-sm">

              Create simple promo codes for dine-in, takeaway, delivery, and online orders.

            </p>

          </div>

        </div>

        <div className="admin-page-header-actions">

          <button

            type="button"

            onClick={() => fetchCoupons(true)}

            disabled={refreshing}

            className={raPageRefreshBtnCls}

          >

            <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />

            Refresh

          </button>

          <button type="button" onClick={openCreate} className={raPagePrimaryBtnCls}>

            <Plus className="size-4" /> New coupon

          </button>

        </div>

      </div>



      <ListToolbar

        search={search}

        onSearchChange={setSearch}

        searchPlaceholder="Search by name or code…"

        filterSlot={

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={raFilterSelectCls}>

            <option value="all">All</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>

          </select>

        }

      />



      <DataTableShell>

        {loading ? (

          <div className="flex justify-center py-16">

            <span className={`${raSpinnerCls} size-8`} />

          </div>

        ) : total === 0 ? (

          <EmptyState

            title={coupons.length === 0 ? "No coupons yet" : "No matching coupons"}

            description={coupons.length === 0 ? "Create your first promo code." : "Try a different search or filter."}

            action={

              coupons.length === 0 ? (

                <button type="button" onClick={openCreate} className={raPagePrimaryBtnCls}>

                  New coupon

                </button>

              ) : null

            }

          />

        ) : (

          <>

            <AdminTable>

              <AdminTableHead>

                <AdminTableHeadRow>

                  <AdminTableTh>Name</AdminTableTh>

                  <AdminTableTh>Code</AdminTableTh>

                  <AdminTableTh>Discount</AdminTableTh>

                  <AdminTableTh>Validity</AdminTableTh>

                  <AdminTableTh>Usage</AdminTableTh>

                  <AdminTableTh>Status</AdminTableTh>

                  <AdminTableThActions />

                </AdminTableHeadRow>

              </AdminTableHead>

              <AdminTableBody>

                {pageRows.map((coupon) => (

                  <AdminTableRow key={coupon.id}>

                    <AdminTableTd>

                      <p className="font-medium admin-shell-text">{coupon.label}</p>

                    </AdminTableTd>

                    <AdminTableTd>

                      <span className="font-mono text-sm font-semibold text-ra-primary">{coupon.code}</span>

                    </AdminTableTd>

                    <AdminTableTd className="tabular-nums admin-shell-text">{formatDiscount(coupon)}</AdminTableTd>

                    <AdminTableTd className="text-sm admin-surface-muted">{formatValidity(coupon)}</AdminTableTd>

                    <AdminTableTd className="tabular-nums admin-surface-body">

                      {coupon.usedCount ?? 0}

                      {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}

                    </AdminTableTd>

                    <AdminTableTd>
                      <CouponStatusToggle
                        active={coupon.active !== false}
                        loading={togglingId === coupon.id}
                        onToggle={() => toggleCouponActive(coupon)}
                      />
                    </AdminTableTd>

                    <AdminTableActionsCell>

                      <AdminTableIconButton aria-label="Edit" onClick={() => openEdit(coupon)}>

                        <Pencil className="size-4" />

                      </AdminTableIconButton>

                      {canDelete ? (

                        <AdminTableIconButton variant="danger" aria-label="Delete" onClick={() => setDeleteTarget(coupon)}>

                          <Trash2 className="size-4" />

                        </AdminTableIconButton>

                      ) : null}

                    </AdminTableActionsCell>

                  </AdminTableRow>

                ))}

              </AdminTableBody>

            </AdminTable>

            <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

          </>

        )}

      </DataTableShell>



      <CouponFormModal

        open={modalOpen}

        editingId={editingId}

        form={form}

        setForm={setForm}

        formError={formError}

        saving={saving}

        onClose={() => setModalOpen(false)}

        onSave={saveCoupon}

      />



      <ConfirmDialog

        open={Boolean(deleteTarget)}

        title="Delete coupon?"

        message={`Remove ${deleteTarget?.code ?? "this coupon"} permanently.`}

        confirmLabel={deleting ? "Deleting…" : "Delete"}

        onConfirm={confirmDelete}

        onCancel={() => !deleting && setDeleteTarget(null)}

      />



      {ToastUI}

    </div>

  );

}

