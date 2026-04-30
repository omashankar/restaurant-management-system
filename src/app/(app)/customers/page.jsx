"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTableShell from "@/components/ui/DataTableShell";
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
  const [visitFilter, setVisitFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
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
      try {
        const res = await fetch("/api/customers", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (res.ok && data?.success && Array.isArray(data.customers)) {
          setCustomerRows(data.customers.map(normalizeCustomer));
        }
      } catch {
        // Keep existing fallback rows if API is temporarily unavailable.
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
    setModalOpen(true);
  };

  const saveCustomer = async () => {
    if (!form.name.trim()) return;
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
        if (!res.ok) {
          showToast("Customer update failed.", "error");
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
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-zinc-800 animate-pulse" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {limited ? (
        <RoleCard
          variant="limited"
          title="Waiter access"
          description="View and light edits for service. Segments and exports are limited."
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Customers
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            CRM list with visit history on profile.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="size-4" />
          Add customer
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, phone, emailâ€¦"
        filterSlot={
          <select
            value={visitFilter}
            onChange={(e) => setVisitFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">All visits</option>
            <option value="1-5">1â€“5 visits</option>
            <option value="6-15">6â€“15 visits</option>
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
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Add customer
            </button>
          }
        />
      ) : (
        <DataTableShell>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Visits</th>
                <th className="px-4 py-3">Last visit</th>
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
                  <td className="px-4 py-3 tabular-nums text-zinc-500">
                    {row.phone}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">
                    {row.visits}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{row.lastVisit}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/customers/${row.id}`}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-sky-400"
                        aria-label="View"
                      >
                        <Eye className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        disabled={!canDelete}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
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
        title={editingId ? "Edit customer" : "Add customer"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCustomer}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
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
            <label className="text-xs text-zinc-500">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
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

