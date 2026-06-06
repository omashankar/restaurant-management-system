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
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
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

export default function CustomersModulePage() {
  const { user } = useApp();
  const { hydrated, customerRows, setCustomerRows } = useModuleData();
  const [loading, setLoading] = useState(true);
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
  const limited = user?.role === "waiter";
  const canDelete = user?.role === "admin" || user?.role === "manager";
  const { showToast, ToastUI } = useToast();

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    async function loadCustomers() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/customers", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (res.ok && data?.success && Array.isArray(data.customers)) {
          setCustomerRows(data.customers.map(normalizeCustomer));
        } else {
          setFetchError(data?.error ?? "Could not load customers.");
        }
      } catch {
        if (alive) setFetchError("Network error while loading customers.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadCustomers();
    return () => {
      alive = false;
    };
  }, [hydrated, setCustomerRows]);

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
    const validation = getCustomerFormFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      showToast(validation.message ?? "Fix the highlighted fields.", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/customers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
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
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
        <TableSkeleton rows={8} cols={6} />
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
        <div className="min-w-0">
          <h1 className="admin-page-title text-2xl font-semibold tracking-tight">
            Customers
          </h1>
          <p className="admin-page-desc mt-1 text-sm">
            CRM list with visit history on profile.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
        >
          <Plus className="size-4" />
          Add customer
        </button>
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
            className="w-full admin-surface-card px-3 py-2 text-sm admin-shell-text sm:w-auto"
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
              className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950"
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
                      className="admin-table-icon-btn rounded-lg p-2 admin-surface-muted transition-colors hover:bg-[var(--admin-hover)] hover:text-sky-600"
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
                  <AdminTableTd className="max-w-[10rem] font-medium admin-shell-text sm:max-w-none">
                    <span className="block truncate">{row.name}</span>
                  </AdminTableTd>
                  <AdminTableTd className="tabular-nums admin-surface-muted">{row.phone}</AdminTableTd>
                  <AdminTableTd className="tabular-nums admin-surface-body">{row.visits}</AdminTableTd>
                  <AdminTableTd className="admin-surface-muted">{row.lastVisit}</AdminTableTd>
                  <AdminTableActionsCell>
                    <Link
                      href={`/customers/${row.id}`}
                      className="admin-table-icon-btn rounded-lg p-2 admin-surface-muted transition-colors hover:bg-[var(--admin-hover)] hover:text-sky-600"
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
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs admin-surface-muted">Name</label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              aria-invalid={fieldErrors.name ? true : undefined}
              className={`mt-1 w-full rounded-xl border admin-surface-card px-3 py-2 text-sm admin-shell-text ${
                fieldErrors.name ? "border-red-500/50" : "border-zinc-700"
              }`}
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
              className={`mt-1 w-full rounded-xl border admin-surface-card px-3 py-2 text-sm admin-shell-text ${
                fieldErrors.email ? "border-red-500/50" : "border-zinc-700"
              }`}
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
              className="mt-1 w-full resize-none rounded-xl border admin-shell-border admin-surface-card px-3 py-2 text-sm admin-shell-text"
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

