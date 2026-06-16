"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
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
import { raFilterSelectCls, raIconBadgeCls, raInputCls, raSpinnerCls, raTextareaCls, raPageRefreshBtnCls, raPagePrimaryBtnCls } from "@/config/restaurantAdminTheme";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import RoleCard from "@/components/rms/RoleCard";
import { useApp } from "@/context/AppProviders";
import { useModuleData } from "@/context/ModuleDataContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import {
  EMPTY_CUSTOMER_FORM_ERRORS,
  getCustomerFormFieldErrors,
} from "@/lib/formValidation";
import PhoneInput from "@/components/ui/PhoneInput";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { Eye, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function normalizeCustomer(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    notes: row.notes ?? "",
    visits: Number(row.visits ?? 0),
    lastVisit: row.lastVisit ?? "-",
    orderHistory: Array.isArray(row.orderHistory) ? row.orderHistory : [],
  };
}

function CustomersPageSkeleton() {
  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-lg admin-progress-track" />
          <div className="h-4 w-56 max-w-full animate-pulse rounded admin-progress-track" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-24" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-36" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl admin-surface-card" />
        <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-40" />
      </div>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3">
            <div className="h-4 w-2/3 rounded admin-progress-track" />
            <div className="mt-2 h-3 w-1/2 rounded admin-progress-track" />
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <TableSkeleton rows={8} cols={5} />
      </div>
    </div>
  );
}

export default function CustomersModulePage() {
  const { user } = useApp();
  const { hydrated, customerRows, setCustomerRows } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [visitFilter, setVisitFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_CUSTOMER_FORM_ERRORS);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const limited = user?.role === "waiter";
  const canDelete = user?.role === "admin" || user?.role === "manager";
  const { showToast, ToastUI } = useToast();

  const loadCustomers = useCallback(async (silent = false) => {
    if (!hydrated) return;
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    }
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.customers)) {
        setCustomerRows(data.customers.map(normalizeCustomer));
      } else if (!silent) {
        setFetchError(data?.error ?? "Could not load customers.");
      }
    } catch {
      if (!silent) setFetchError("Network error while loading customers.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hydrated, setCustomerRows]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const refreshCustomers = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      await loadCustomers(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadCustomers]);

  const filterFn = useCallback(
    (row) => {
      if (visitFilter === "all") return true;
      const v = row.visits;
      if (visitFilter === "1-5") return v <= 5;
      if (visitFilter === "6-15") return v >= 6 && v <= 15;
      if (visitFilter === "16+") return v >= 16;
      return true;
    },
    [visitFilter]
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    pageRows,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList(customerRows, {
    searchKeys: ["name", "phone", "email"],
    pageSize: 8,
    filter: filterFn,
    resetKey: visitFilter,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", notes: "" });
    setFieldErrors(EMPTY_CUSTOMER_FORM_ERRORS);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes ?? "",
    });
    setFieldErrors(EMPTY_CUSTOMER_FORM_ERRORS);
    setModalOpen(true);
  };

  const saveCustomer = async () => {
    if (saving) return;
    const validation = getCustomerFormFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      showToast(validation.message ?? "Fix the highlighted fields.", "error");
      return;
    }
    const phoneStored = extractIndianMobileDigits(form.phone);
    const payload = {
      name: form.name.trim(),
      phone: phoneStored,
      email: form.email.trim(),
      notes: form.notes.trim(),
    };

    const duplicate = customerRows.find(
      (c) =>
        extractIndianMobileDigits(c.phone) === phoneStored &&
        c.id !== editingId
    );
    if (duplicate) {
      const msg = "A customer with this phone number already exists.";
      setFieldErrors((p) => ({ ...p, phone: msg }));
      showToast(msg, "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/customers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409) {
            setFieldErrors((p) => ({
              ...p,
              phone: data?.error ?? "Another customer uses this phone number.",
            }));
          }
          showToast(data?.error ?? "Customer update failed.", "error");
          return;
        }
        setCustomerRows((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c))
        );
        showToast("Customer updated.");
      } else {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data?.id) {
          if (res.status === 409) {
            setFieldErrors((p) => ({
              ...p,
              phone: data?.error ?? "Customer with this phone already exists.",
            }));
          }
          showToast(data?.error ?? "Customer creation failed.", "error");
          return;
        }
        setCustomerRows((prev) => [
          ...prev,
          normalizeCustomer({
            id: data.id,
            ...payload,
            visits: 0,
            lastVisit: "-",
            orderHistory: [],
          }),
        ]);
        showToast("Customer added.");
      }
      setModalOpen(false);
    } catch {
      showToast("Network error while saving customer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      showToast("Only admin or manager can delete customers.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showToast("Delete failed. Permission or server error.", "error");
        return;
      }
      setCustomerRows((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Customer deleted.");
    } catch {
      showToast("Network error while deleting customer.", "error");
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <CustomersPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      {limited ? (
        <RoleCard
          variant="limited"
          title="Waiter access"
          description="View and light edits for service. Segments and exports are limited."
        />
      ) : null}

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <Users className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">
              Customers
            </h1>
            <p className="admin-page-desc mt-1 break-words text-sm">
              CRM list with visit history on profile.
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <button
            type="button"
            onClick={refreshCustomers}
            disabled={refreshing}
            className={raPageRefreshBtnCls}
          >
            <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className={raPagePrimaryBtnCls}
          >
            <Plus className="size-4" />
            Add customer
          </button>
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, phone, email…"
        filterSlot={
          <select
            value={visitFilter}
            onChange={(e) => setVisitFilter(e.target.value)}
            className={`${raFilterSelectCls} w-full sm:w-auto`}
            aria-label="Filter by visits"
          >
            <option value="all">All visits</option>
            <option value="1-5">1–5 visits</option>
            <option value="6-15">6–15 visits</option>
            <option value="16+">16+ visits</option>
          </select>
        }
      />

      {total === 0 ? (
        <EmptyState
          title="No customers"
          description="Import or add guests to track visits."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
            >
              Add customer
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
                    <p className="mt-1 tabular-nums text-xs admin-surface-muted">{row.phone}</p>
                    {row.email ? (
                      <p className="mt-0.5 break-all text-xs admin-surface-muted">{row.email}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/customers/${row.id}`}
                      className="admin-table-icon-btn cursor-pointer rounded-lg p-2 admin-surface-muted transition-colors admin-icon-hover-view"
                      aria-label="View"
                    >
                      <Eye className="size-4" />
                    </Link>
                    <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton
                      variant="danger"
                      onClick={() => setDeleteTarget(row)}
                      disabled={!canDelete}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </AdminTableIconButton>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs admin-surface-muted">
                  <span>
                    Visits: <span className="font-semibold tabular-nums admin-surface-body">{row.visits}</span>
                  </span>
                  <span>
                    Last: <span className="admin-surface-body">{row.lastVisit}</span>
                  </span>
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
                <AdminTableTh>Name</AdminTableTh>
                <AdminTableTh>Phone</AdminTableTh>
                <AdminTableTh>Visits</AdminTableTh>
                <AdminTableTh>Last visit</AdminTableTh>
                <AdminTableThActions />
              </AdminTableHeadRow>
            </AdminTableHead>
            <AdminTableBody>
              {pageRows.map((row) => (
                <AdminTableRow key={row.id}>
                  <AdminTableTd className="max-w-[10rem] min-w-0 font-medium admin-shell-text sm:max-w-none">
                    <span className="block truncate">{row.name}</span>
                  </AdminTableTd>
                  <AdminTableTd className="tabular-nums admin-surface-muted">{row.phone}</AdminTableTd>
                  <AdminTableTd className="tabular-nums admin-surface-body">{row.visits}</AdminTableTd>
                  <AdminTableTd className="admin-surface-muted">{row.lastVisit}</AdminTableTd>
                  <AdminTableActionsCell>
                    <Link
                      href={`/customers/${row.id}`}
                      className="admin-table-icon-btn cursor-pointer rounded-lg p-2 admin-surface-muted transition-colors admin-icon-hover-view"
                      aria-label="View"
                    >
                      <Eye className="size-4" />
                    </Link>
                    <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </AdminTableIconButton>
                    <AdminTableIconButton
                      variant="danger"
                      onClick={() => setDeleteTarget(row)}
                      disabled={!canDelete}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
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
        title={editingId ? "Edit customer" : "Add customer"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCustomer}
              disabled={saving}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="min-w-0 space-y-4">
          <div>
            <label className="text-xs admin-surface-muted">Name</label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              aria-invalid={fieldErrors.name ? true : undefined}
              className={`mt-1 ${raInputCls} ${fieldErrors.name ? "border-red-500/50" : ""}`}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <PhoneInput
            id="customer-phone"
            label="Phone"
            required
            value={form.phone}
            onChange={(digits) => {
              setForm((f) => ({ ...f, phone: digits }));
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
            }}
            error={fieldErrors.phone || undefined}
          />
          <div>
            <label className="text-xs admin-surface-muted">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              aria-invalid={fieldErrors.email ? true : undefined}
              className={`mt-1 ${raInputCls} ${fieldErrors.email ? "border-red-500/50" : ""}`}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="text-xs admin-surface-muted">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className={`mt-1 ${raTextareaCls}`}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete customer?"
        message={
          deleteTarget
            ? `${deleteTarget.name} and local history will be removed.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}

