"use client";

import { raFilterSelectCls, raIconBadgeCls, raInputCls, raSpinnerCls, raPageRefreshBtnCls, raPagePrimaryBtnCls } from "@/config/restaurantAdminTheme";
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
import { useUser } from "@/context/AuthContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useToast } from "@/hooks/useToast";
import {
  EMPTY_STAFF_FORM_ERRORS,
  getStaffFormFieldErrors,
} from "@/lib/formValidation";
import PasswordInput from "@/components/ui/PasswordInput";
import PhoneInput from "@/components/ui/PhoneInput";
import { Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STAFF_ROLES = ["manager", "waiter", "chef"];
const ROLE_LABEL  = { manager: "Manager", waiter: "Waiter", chef: "Chef" };

const emptyForm = { name: "", role: "waiter", phone: "", email: "", password: "", status: "active" };

function StaffPageSkeleton() {
  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded-lg admin-progress-track" />
          <div className="h-4 w-44 max-w-full animate-pulse rounded admin-progress-track" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-24" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-32" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl admin-surface-card" />
        <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-36" />
      </div>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3">
            <div className="flex gap-3">
              <div className="size-8 shrink-0 rounded-full admin-progress-track" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded admin-progress-track" />
                <div className="h-5 w-24 rounded-full admin-progress-track" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <TableSkeleton rows={8} cols={5} />
      </div>
    </div>
  );
}

export default function StaffModulePage() {
  const { user } = useUser();
  const { staffRows, setStaffRows } = useModuleData();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_STAFF_FORM_ERRORS);
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast, ToastUI } = useToast();

  /* â”€â”€ Fetch staff from DB â”€â”€ */
  const fetchStaff = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    }
    try {
      const res  = await fetch("/api/users/staff", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.staff)) {
        setStaffRows(data.staff);
      } else if (!silent) {
        setFetchError(data?.error ?? "Could not load staff.");
      }
    } catch {
      if (!silent) setFetchError("Network error while loading staff.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setStaffRows]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const refreshStaff = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      await fetchStaff(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStaff]);

  const filterFn = useCallback(
    (row) => roleFilter === "all" ? true : row.role === roleFilter,
    [roleFilter]
  );

  const { search, setSearch, page, setPage, pageRows, total, totalPages, pageSize } =
    usePaginatedList(staffRows, {
      searchKeys: ["name", "email", "phone"],
      pageSize: 8,
      filter: filterFn,
      resetKey: roleFilter,
    });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors(EMPTY_STAFF_FORM_ERRORS);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, role: row.role, phone: row.phone, email: row.email, password: "", status: row.status });
    setFormError("");
    setFieldErrors(EMPTY_STAFF_FORM_ERRORS);
    setModalOpen(true);
  };

  const saveStaff = async () => {
    setFormError("");
    const validation = getStaffFormFieldErrors(form, { editing: Boolean(editingId) });
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setFormError(validation.message ?? "Fix the highlighted fields.");
      return;
    }

    setSaving(true);

    if (!editingId) {
      /* â”€â”€ CREATE via API â†’ saves to DB â”€â”€ */
      try {
        const res  = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            phone: form.phone,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error ?? "Failed to create staff.");
          setSaving(false);
          return;
        }
        setStaffRows((prev) => [data.staff, ...prev]);
        showToast("Staff member added.");
        setModalOpen(false);
      } catch {
        setFormError("Network error. Please try again.");
      }
    } else {
      /* â”€â”€ EDIT via API â”€â”€ */
      try {
        const res  = await fetch(`/api/staff/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, role: form.role, phone: form.phone, status: form.status }),
        });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to update."); setSaving(false); return; }
        setStaffRows((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? { ...s, name: form.name, email: form.email, role: form.role, phone: form.phone, status: form.status }
              : s
          )
        );
        showToast("Staff member updated.");
        setModalOpen(false);
      } catch { setFormError("Network error."); }
    }

    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === user?.id) {
      showToast("You cannot remove your own account.", "error");
      return;
    }
    setDeleting(true);
    try {
      const res  = await fetch(`/api/staff/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setStaffRows((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showToast(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <StaffPageSkeleton />
      </div>
    );
  }

  const roleBadgeCls = (role) =>
    role === "manager"
      ? "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25"
      : role === "chef"
        ? "bg-amber-500/15 text-amber-300 ring-amber-500/25"
        : "bg-sky-500/15 text-sky-300 ring-sky-500/25";

  const statusBadgeCls = (status) =>
    status === "active"
      ? "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25"
      : "bg-amber-500/15 text-amber-200 ring-amber-500/25";

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">

      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Staff</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">Team roster · {total} member{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <button
            type="button"
            onClick={refreshStaff}
            disabled={refreshing}
            className={raPageRefreshBtnCls}
          >
            <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
            Refresh
          </button>
          {isAdmin && (
            <button type="button" onClick={openCreate}
              className={raPagePrimaryBtnCls}>
              <Plus className="size-4" /> Add Staff
            </button>
          )}
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      ) : null}

      {/* Toolbar */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone…"
        filterSlot={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`${raFilterSelectCls} w-full sm:w-auto`}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        }
      />

      {/* Table */}
      {total === 0 ? (
        <EmptyState
          title="No staff members"
          description="Add your team to manage shifts and access."
          action={isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
            >
              Add Staff
            </button>
          )}
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
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full admin-rank-badge text-xs font-bold admin-surface-body ring-1 ring-zinc-700">
                      {row.name?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-medium admin-shell-text">{row.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${roleBadgeCls(row.role)}`}>
                          {ROLE_LABEL[row.role] ?? row.role}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusBadgeCls(row.status)}`}>
                          {row.status?.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-1">
                      <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </AdminTableIconButton>
                      <AdminTableIconButton
                        variant="danger"
                        onClick={() => setDeleteTarget(row)}
                        disabled={row.id === user?.id}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </AdminTableIconButton>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs admin-surface-muted">
                  <p className="break-all">{row.email}</p>
                  <p className="tabular-nums">{row.phone || "—"}</p>
                </div>
              </div>
            ))}
            <div className="px-1 pb-1">
              <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} hideWhenSinglePage />
            </div>
          </div>

          <div className="hidden md:block">
        <DataTableShell>
          <AdminTable>
            <AdminTableHead>
              <AdminTableHeadRow>
                <AdminTableTh>Name</AdminTableTh>
                <AdminTableTh>Role</AdminTableTh>
                <AdminTableTh hidden="md">Email</AdminTableTh>
                <AdminTableTh hidden="md">Phone</AdminTableTh>
                <AdminTableTh>Status</AdminTableTh>
                {isAdmin && <AdminTableThActions />}
              </AdminTableHeadRow>
            </AdminTableHead>
            <AdminTableBody>
              {pageRows.map((row) => (
                <AdminTableRow key={row.id}>
                  <AdminTableTd className="min-w-0 max-w-[12rem] sm:max-w-none">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full admin-rank-badge text-xs font-bold admin-surface-body ring-1 ring-zinc-700">
                        {row.name?.[0]?.toUpperCase()}
                      </span>
                      <span className="min-w-0 truncate font-medium admin-shell-text">{row.name}</span>
                    </div>
                  </AdminTableTd>
                  <AdminTableTd>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${roleBadgeCls(row.role)}`}>
                      {ROLE_LABEL[row.role] ?? row.role}
                    </span>
                  </AdminTableTd>
                  <AdminTableTd hidden="md" className="max-w-[14rem] min-w-0 break-all admin-surface-muted">{row.email}</AdminTableTd>
                  <AdminTableTd hidden="md" className="tabular-nums admin-surface-muted">{row.phone || "—"}</AdminTableTd>
                  <AdminTableTd>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusBadgeCls(row.status)}`}>
                      {row.status?.replace("-", " ")}
                    </span>
                  </AdminTableTd>
                  {isAdmin && (
                    <AdminTableActionsCell>
                      <AdminTableIconButton onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </AdminTableIconButton>
                      <AdminTableIconButton
                        variant="danger"
                        onClick={() => setDeleteTarget(row)}
                        disabled={row.id === user?.id}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </AdminTableIconButton>
                    </AdminTableActionsCell>
                  )}
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
          <div className="px-4 pb-4">
            <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} hideWhenSinglePage />
          </div>
        </DataTableShell>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Staff Member" : "Add Staff Member"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setModalOpen(false)}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" onClick={saveStaff} disabled={saving}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 sm:w-auto">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="min-w-0 space-y-4">
          {formError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium admin-surface-muted">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="Alex Rivera"
                aria-invalid={fieldErrors.name ? true : undefined}
                className={`mt-1 ${raInputCls} ${
                  fieldErrors.name ? "border-red-500/50" : ""
                }`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="alex@restaurant.com"
                aria-invalid={fieldErrors.email ? true : undefined}
                className={`mt-1 ${raInputCls} ${
                  fieldErrors.email ? "border-red-500/50" : ""
                }`}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="text-xs font-medium admin-surface-muted">Role *</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={`cursor-pointer mt-1 ${raInputCls}`}>
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <PhoneInput
              id="staff-phone"
              label="Phone"
              value={form.phone}
              onChange={(digits) => {
                setForm((f) => ({ ...f, phone: digits }));
                if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
              }}
              error={fieldErrors.phone || undefined}
            />
            {!editingId && (
              <div className="sm:col-span-2">
                <PasswordInput
                  id="staff-password"
                  label="Password (min 6 chars)"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, password: v }));
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="••••••••"
                  labelClassName="text-xs font-medium admin-surface-muted"
                  inputClassName={`${raInputCls} pr-11 ${
                    fieldErrors.password ? "border-red-500/50" : ""
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>
            )}
            {editingId && (
              <div>
                <label className="text-xs font-medium admin-surface-muted">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={`cursor-pointer mt-1 ${raInputCls}`}>
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove staff member?"
        message={deleteTarget ? `${deleteTarget.name} will be removed from the roster.` : ""}
        confirmLabel={deleting ? "Removing…" : "Remove"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}

