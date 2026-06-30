"use client";

import CouponFormModal, { couponToForm, EMPTY_COUPON_FORM } from "@/components/coupons/CouponFormModal";
import CouponStatsCards from "@/components/coupons/CouponStatsCards";
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
import { COUPON_STATUS_STYLES, couponStatusLabel } from "@/lib/couponSchema";
import { raFilterSelectCls, raPagePrimaryBtnCls, raPageRefreshBtnCls, raSpinnerCls } from "@/config/restaurantAdminTheme";
import { Copy, Download, Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function channelLabel(channels = []) {
  if (channels.includes("online") && channels.includes("pos")) return "Online + POS";
  if (channels.includes("pos")) return "POS only";
  return "Online only";
}

function emptyPayload(form) {
  return {
    ...form,
    maxDiscount: form.maxDiscount === "" ? null : form.maxDiscount,
    minSubtotal: form.minSubtotal === "" ? null : form.minSubtotal,
    maxSubtotal: form.maxSubtotal === "" ? null : form.maxSubtotal,
    minQty: form.minQty === "" ? null : form.minQty,
    usageLimit: form.usageLimit === "" ? null : form.usageLimit,
    dailyLimit: form.dailyLimit === "" ? null : form.dailyLimit,
    monthlyLimit: form.monthlyLimit === "" ? null : form.monthlyLimit,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
  };
}

export default function CouponsPage() {
  const { user } = useApp();
  const canDelete = user?.role === "admin";
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
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
  const { showToast, ToastUI } = useToast();

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch("/api/coupons", { cache: "no-store" }),
        fetch("/api/coupons/stats", { cache: "no-store" }),
      ]);
      const listData = await listRes.json();
      const statsData = await statsRes.json();
      if (listRes.ok && listData?.success) setCoupons(listData.coupons ?? []);
      else showToast(listData?.error ?? "Could not load coupons.", "error");
      if (statsRes.ok && statsData?.success) setStats(statsData.stats);
    } catch {
      showToast("Could not load coupons.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return coupons;
    return coupons.filter((c) => couponStatusLabel(c) === statusFilter);
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
    searchKeys: ["code", "label", "description"],
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
      setFormError("Code and name are required.");
      return;
    }
    if (form.type !== "free_delivery" && (!form.value || Number(form.value) <= 0)) {
      setFormError("Value must be greater than 0.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(editingId ? `/api/coupons/${editingId}` : "/api/coupons", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyPayload(form)),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setFormError(data?.error ?? "Could not save coupon.");
        return;
      }
      showToast(editingId ? "Coupon updated." : "Coupon created.");
      setModalOpen(false);
      fetchAll(true);
    } catch {
      setFormError("Could not save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    const res = await fetch(`/api/coupons/${coupon.id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: coupon.active === false }),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      showToast(data?.error ?? "Could not update coupon.", "error");
      return;
    }
    showToast(data.coupon.active ? "Coupon activated." : "Coupon deactivated.");
    fetchAll(true);
  };

  const duplicateCoupon = async (coupon) => {
    const res = await fetch(`/api/coupons/${coupon.id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      showToast(data?.error ?? "Could not duplicate coupon.", "error");
      return;
    }
    showToast(`Duplicated as ${data.coupon.code}.`);
    fetchAll(true);
  };

  const exportCsv = () => {
    window.open("/api/coupons/export", "_blank");
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
      fetchAll(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-poppins text-2xl font-bold admin-shell-text">Coupon management</h1>
          <p className="mt-1 text-sm admin-surface-muted">
            Create promo codes for POS and online orders. Active online coupons appear on the customer menu and checkout.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={exportCsv} className={raPageRefreshBtnCls}>
            <Download className="size-4" /> Export CSV
          </button>
          <button type="button" onClick={() => fetchAll(true)} className={raPageRefreshBtnCls}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button type="button" onClick={openCreate} className={raPagePrimaryBtnCls}>
            <Plus className="size-4" /> New coupon
          </button>
        </div>
      </div>

      <CouponStatsCards stats={stats} />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name, description…"
        filterSlot={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={raFilterSelectCls}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="exhausted">Exhausted</option>
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
                <button type="button" onClick={openCreate} className="rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950">
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
                  <AdminTableTh>Code</AdminTableTh>
                  <AdminTableTh>Offer</AdminTableTh>
                  <AdminTableTh>Channels</AdminTableTh>
                  <AdminTableTh>Usage</AdminTableTh>
                  <AdminTableTh>Status</AdminTableTh>
                  <AdminTableThActions />
                </AdminTableHeadRow>
              </AdminTableHead>
              <AdminTableBody>
                {pageRows.map((coupon) => {
                  const status = couponStatusLabel(coupon);
                  return (
                    <AdminTableRow key={coupon.id}>
                      <AdminTableTd className="font-mono font-semibold text-ra-primary">{coupon.code}</AdminTableTd>
                      <AdminTableTd>
                        <p className="font-medium admin-shell-text">{coupon.label}</p>
                        <p className="text-xs admin-surface-muted">
                          {coupon.type === "percent"
                            ? `${coupon.value}%${coupon.maxDiscount ? ` · max ${coupon.maxDiscount}` : ""}`
                            : coupon.type === "free_delivery"
                              ? "Free delivery"
                              : `Flat ${coupon.value}`}
                          {coupon.minSubtotal ? ` · min ${coupon.minSubtotal}` : ""}
                        </p>
                      </AdminTableTd>
                      <AdminTableTd>{channelLabel(coupon.channels)}</AdminTableTd>
                      <AdminTableTd>
                        {coupon.usedCount}
                        {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}
                      </AdminTableTd>
                      <AdminTableTd>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${COUPON_STATUS_STYLES[status] ?? COUPON_STATUS_STYLES.inactive}`}>
                          {status}
                        </span>
                      </AdminTableTd>
                      <AdminTableActionsCell>
                        <AdminTableIconButton aria-label="Edit" onClick={() => openEdit(coupon)}>
                          <Pencil className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton aria-label="Duplicate" onClick={() => duplicateCoupon(coupon)}>
                          <Copy className="size-4" />
                        </AdminTableIconButton>
                        <AdminTableIconButton aria-label={coupon.active ? "Deactivate" : "Activate"} onClick={() => toggleActive(coupon)}>
                          <Power className="size-4" />
                        </AdminTableIconButton>
                        {canDelete ? (
                          <AdminTableIconButton variant="danger" aria-label="Delete" onClick={() => setDeleteTarget(coupon)}>
                            <Trash2 className="size-4" />
                          </AdminTableIconButton>
                        ) : null}
                      </AdminTableActionsCell>
                    </AdminTableRow>
                  );
                })}
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
