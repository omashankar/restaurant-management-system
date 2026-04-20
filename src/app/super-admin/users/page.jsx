"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import {
  Building2, Crown, RefreshCw, Search,
  ShieldOff, ShieldCheck, Trash2, Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* Super Admin manages ONLY restaurant admins (role === "admin").
   Staff (manager / waiter / chef) are managed by their own restaurant admin. */

const STATUSES = ["active", "inactive", "blocked"];

const STATUS_BADGE = {
  active:   "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  inactive: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  blocked:  "bg-red-500/15 text-red-400 ring-red-500/25",
};

export default function UsersPage() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const { showToast, ToastUI }          = useToast();

  /* ── Fetch admin users only ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res  = await fetch(`/api/super-admin/users?${params}`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Block / Unblock ── */
  const toggleBlock = async (u) => {
    const newStatus = u.status === "blocked" ? "active" : "blocked";
    try {
      const res  = await fetch(`/api/super-admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed.", "error"); return; }
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: newStatus } : x));
      showToast(`${u.name} ${newStatus === "blocked" ? "blocked" : "unblocked"}.`);
    } catch { showToast("Network error.", "error"); }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/super-admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to delete.", "error"); return; }
      setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      showToast(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  const stats = useMemo(() => ({
    total:   users.length,
    active:  users.filter((u) => u.status === "active").length,
    blocked: users.filter((u) => u.status === "blocked").length,
  }), [users]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
            <Crown className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Restaurant Admins</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage restaurant owner accounts.
              <span className="ml-1.5 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                role: admin only
              </span>
            </p>
          </div>
        </div>
        <button type="button" onClick={fetchUsers}
          className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* RBAC notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Crown className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <p className="text-xs text-amber-300/80">
          <span className="font-semibold text-amber-300">Super Admin scope:</span>{" "}
          You can only view and manage restaurant admin accounts here.
          Staff members (manager, waiter, chef) are managed by their restaurant admin.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Admins", value: stats.total,   color: "text-zinc-100"    },
          { label: "Active",       value: stats.active,  color: "text-emerald-400" },
          { label: "Blocked",      value: stats.blocked, color: "text-red-400"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters — no role filter since only "admin" is shown */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <Users className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No restaurant admins found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="hidden px-4 py-3 lg:table-cell">Restaurant</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u) => (
                <tr key={u.id} className={`transition-colors hover:bg-zinc-800/30 ${u.status === "blocked" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-300 ring-1 ring-amber-500/20">
                        {u.name?.[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-100">{u.name}</p>
                        <p className="truncate text-xs text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/25">
                      <Crown className="size-3" /> Admin
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                      {u.restaurantName !== "—" && <Building2 className="size-3 text-zinc-600" />}
                      {u.restaurantName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${STATUS_BADGE[u.status] ?? STATUS_BADGE.inactive}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-600 md:table-cell">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {/* Block / Unblock */}
                      <button type="button" onClick={() => toggleBlock(u)}
                        title={u.status === "blocked" ? "Unblock admin" : "Block admin"}
                        className={`cursor-pointer rounded-lg p-2 transition-colors ${
                          u.status === "blocked"
                            ? "text-zinc-400 hover:bg-emerald-500/15 hover:text-emerald-400"
                            : "text-zinc-400 hover:bg-amber-500/15 hover:text-amber-400"
                        }`}>
                        {u.status === "blocked"
                          ? <ShieldCheck className="size-4" />
                          : <ShieldOff className="size-4" />}
                      </button>
                      {/* Delete */}
                      <button type="button" onClick={() => setDeleteTarget(u)}
                        className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-600">
            {users.length} admin{users.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete admin account?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" (${deleteTarget.email}) will be permanently deleted. Their restaurant data will remain.`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {ToastUI}
    </div>
  );
}
