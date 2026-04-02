"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import PaginationBar from "@/components/ui/PaginationBar";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STAFF_ROLES = ["Manager", "Waiter", "Chef"];

export default function StaffModulePage() {
  const { hydrated, staffRows, setStaffRows } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    role: "Waiter",
    phone: "",
    email: "",
    password: "",
    status: "active",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [hydrated]);

  const filterFn = useCallback(
    (row) => (roleFilter === "all" ? true : row.role === roleFilter),
    [roleFilter]
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
  } = usePaginatedList(staffRows, {
    searchKeys: ["name", "email", "phone"],
    pageSize: 8,
    filter: filterFn,
    resetKey: roleFilter,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      role: "Waiter",
      phone: "",
      email: "",
      password: "",
      status: "active",
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      role: row.role,
      phone: row.phone,
      email: row.email,
      password: "",
      status: row.status,
    });
    setModalOpen(true);
  };

  const saveStaff = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const payload = {
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status,
    };
    if (editingId) {
      setStaffRows((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, ...payload, id: editingId } : s
        )
      );
    } else {
      setStaffRows((prev) => [
        ...prev,
        { ...payload, id: `st-${Date.now()}` },
      ]);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setStaffRows((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-28 rounded-lg bg-zinc-800 animate-pulse" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Staff
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Team roster and contact details.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="size-4" />
          Add staff
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone…"
        filterSlot={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">All roles</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        }
      />

      {total === 0 ? (
        <EmptyState
          title="No staff"
          description="Add your team to manage shifts and access."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Add staff
            </button>
          }
        />
      ) : (
        <DataTableShell>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{row.role}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-500">
                    {row.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                        row.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                          : "bg-amber-500/15 text-amber-200 ring-amber-500/25"
                      }`}
                    >
                      {row.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </DataTableShell>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit staff" : "Add staff"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveStaff}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Role</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Phone</label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="UI only — not stored"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-zinc-600">Demo field only.</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="active">Active</option>
              <option value="on-leave">On leave</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove staff member?"
        message={
          deleteTarget ? `${deleteTarget.name} will be removed.` : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
