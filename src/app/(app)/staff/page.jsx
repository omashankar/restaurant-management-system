"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
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

export default function StaffModulePage() {
  const { user } = useUser();
  const { setStaffRows: setContextStaffRows } = useModuleData();
  const isAdmin = user?.role === "admin";

  const [staffRows, setStaffRows] = useState([]);
  const [loading, setLoading]     = useState(true);
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
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res  = await fetch("/api/users/staff", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.staff)) {
        setStaffRows(data.staff);
        setContextStaffRows(data.staff);
      } else {
        setFetchError(data?.error ?? "Could not load staff.");
      }
    } catch {
      setFetchError("Network error while loading staff.");
    } finally {
      setLoading(false);
    }
  }, [setContextStaffRows]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

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
        setStaffRows((prev) => {
          const next = [data.staff, ...prev];
          setContextStaffRows(next);
          return next;
        });
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
          body: JSON.stringify({ name: form.name, role: form.role, phone: form.phone, status: form.status }),
        });
        const data = await res.json();
        if (!data.success) { setFormError(data.error ?? "Failed to update."); setSaving(false); return; }
        setStaffRows((prev) => {
          const next = prev.map((s) => s.id === editingId
            ? { ...s, name: form.name, role: form.role, phone: form.phone, status: form.status }
            : s);
          setContextStaffRows(next);
          return next;
        });
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
      setStaffRows((prev) => {
        const next = prev.filter((s) => s.id !== deleteTarget.id);
        setContextStaffRows(next);
        return next;
      });
      showToast(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-800" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Staff</h1>
            <p className="mt-1 text-sm text-zinc-500">Team roster · {total} member{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchStaff}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          {isAdmin && (
            <button type="button" onClick={openCreate}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              <Plus className="size-4" /> Add Staff
            </button>
          )}
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      ) : null}

      {/* Toolbar */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone…"
        filterSlot={
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
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
            <button type="button" onClick={openCreate}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              Add Staff
            </button>
          )}
        />
      ) : (
        <DataTableShell>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="hidden px-4 py-3 md:table-cell">Email</th>
                <th className="hidden px-4 py-3 md:table-cell">Phone</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {pageRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 ring-1 ring-zinc-700">
                        {row.name?.[0]?.toUpperCase()}
                      </span>
                      <span className="font-medium text-zinc-100">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                      row.role === "manager" ? "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25"
                      : row.role === "chef"  ? "bg-amber-500/15 text-amber-300 ring-amber-500/25"
                      :                        "bg-sky-500/15 text-sky-300 ring-sky-500/25"
                    }`}>
                      {ROLE_LABEL[row.role] ?? row.role}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">{row.email}</td>
                  <td className="hidden px-4 py-3 tabular-nums text-zinc-500 md:table-cell">{row.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                      row.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                        : "bg-amber-500/15 text-amber-200 ring-amber-500/25"
                    }`}>
                      {row.status?.replace("-", " ")}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(row)}
                          className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400" aria-label="Edit">
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(row)}
                          className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400" aria-label="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </DataTableShell>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Staff Member" : "Add Staff Member"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Cancel
            </button>
            <button type="button" onClick={saveStaff} disabled={saving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-500">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="Alex Rivera"
                aria-invalid={fieldErrors.name ? true : undefined}
                className={`mt-1 w-full rounded-xl border bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 ${
                  fieldErrors.name ? "border-red-500/50" : "border-zinc-700"
                }`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="alex@restaurant.com"
                aria-invalid={fieldErrors.email ? true : undefined}
                className={`mt-1 w-full rounded-xl border bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 ${
                  fieldErrors.email ? "border-red-500/50" : "border-zinc-700"
                }`}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Role *</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
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
                  labelClassName="text-xs font-medium text-zinc-500"
                  inputClassName={`w-full rounded-xl border bg-zinc-950/60 px-3 py-2.5 pr-11 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 ${
                    fieldErrors.password ? "border-red-500/50" : "border-zinc-700"
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>
            )}
            {editingId && (
              <div>
                <label className="text-xs font-medium text-zinc-500">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
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

