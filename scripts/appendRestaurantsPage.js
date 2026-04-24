const fs = require("fs");
const existing = fs.readFileSync("src/app/super-admin/restaurants/page.jsx", "utf8");

const mainComponent = `
/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function RestaurantsPage() {
  const [restaurants, setRestaurants]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter]     = useState("all");
  const [page, setPage]                 = useState(1);
  const [togglingId, setTogglingId]     = useState(null);

  // Create modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(emptyForm);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating]       = useState(false);
  const [showPw, setShowPw]           = useState(false);

  // Edit modal
  const [editTarget, setEditTarget]   = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [editError, setEditError]     = useState("");
  const [saving, setSaving]           = useState(false);

  // Preview modal
  const [previewTarget, setPreviewTarget] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const { showToast, ToastUI } = useToast();

  /* Fetch */
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (planFilter   !== "all") params.set("plan",   planFilter);
      const res  = await fetch("/api/super-admin/restaurants?" + params);
      const data = await res.json();
      if (data.success) { setRestaurants(data.restaurants); setPage(1); }
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, [search, statusFilter, planFilter]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  /* Paginated slice */
  const totalPages = Math.max(1, Math.ceil(restaurants.length / PAGE_SIZE));
  const paginated  = restaurants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    } catch { showToast("Network error.", "error"); }
    finally { setTogglingId(null); }
  };

  /* Create */
  const handleCreate = async () => {
    if (!createForm.name.trim())       { setCreateError("Restaurant name is required."); return; }
    if (!createForm.ownerEmail.trim()) { setCreateError("Owner email is required."); return; }
    if (!createForm.ownerPassword)     { setCreateError("Password is required."); return; }
    if (createForm.ownerPassword.length < 6) { setCreateError("Password must be at least 6 characters."); return; }
    setCreating(true); setCreateError("");
    try {
      const res  = await fetch("/api/super-admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!data.success) { setCreateError(data.error ?? "Failed to create."); return; }
      setRestaurants((prev) => [data.restaurant, ...prev]);
      showToast(createForm.name + " created successfully.");
      setCreateOpen(false); setCreateForm(emptyForm);
    } catch { setCreateError("Network error."); }
    finally { setCreating(false); }
  };

  /* Open edit */
  const openEdit = (r) => {
    setEditTarget(r);
    setEditForm({ name: r.name, plan: r.plan, phone: r.phone !== "—" ? r.phone : "", address: r.address ?? "" });
    setEditError("");
  };

  /* Save edit */
  const handleEdit = async () => {
    if (!editForm.name?.trim()) { setEditError("Restaurant name is required."); return; }
    setSaving(true); setEditError("");
    try {
      const res  = await fetch("/api/super-admin/restaurants/" + editTarget.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!data.success) { setEditError(data.error ?? "Failed to save."); return; }
      setRestaurants((prev) => prev.map((r) =>
        r.id === editTarget.id ? { ...r, ...editForm } : r
      ));
      showToast(editForm.name + " updated.");
      setEditTarget(null);
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
      setRestaurants((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      showToast(deleteTarget.name + " deleted.");
      setDeleteTarget(null);
    } catch { showToast("Network error.", "error"); }
    finally { setDeleting(false); }
  };

  const stats = useMemo(() => ({
    total:     restaurants.length,
    active:    restaurants.filter((r) => r.status === "active").length,
    inactive:  restaurants.filter((r) => r.status === "inactive").length,
    suspended: restaurants.filter((r) => r.status === "suspended").length,
  }), [restaurants]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Restaurants</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage all registered tenants and their admin accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchRestaurants}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className={"size-4 " + (loading ? "animate-spin" : "")} />
          </button>
          <button type="button" onClick={() => { setCreateForm(emptyForm); setCreateError(""); setShowPw(false); setCreateOpen(true); }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
            <Plus className="size-4" /> Add Restaurant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,     color: "text-zinc-100"    },
          { label: "Active",    value: stats.active,    color: "text-emerald-400" },
          { label: "Inactive",  value: stats.inactive,  color: "text-zinc-500"    },
          { label: "Suspended", value: stats.suspended, color: "text-red-400"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className={"text-xl font-bold " + color}>{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="size-4" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40">
          <option value="all">All plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <Building2 className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No restaurants found.</p>
          <button type="button" onClick={() => { setCreateForm(emptyForm); setCreateOpen(true); }}
            className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            Add First Restaurant
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="hidden px-4 py-3 md:table-cell">Owner</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Phone</th>
                  <th className="hidden px-4 py-3 md:table-cell">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginated.map((r) => (
                  <tr key={r.id} className={"transition-colors hover:bg-zinc-800/20 " + (r.status !== "active" ? "opacity-70" : "")}>

                    {/* Restaurant name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                          {r.name?.[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-100">{r.name}</p>
                          <p className="truncate text-xs text-zinc-600 md:hidden">{r.ownerEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center gap-2 min-w-0">
                        <Crown className="size-3 shrink-0 text-amber-500/60" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-200">{r.ownerName}</p>
                          <p className="truncate text-xs text-zinc-500">{r.ownerEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs text-zinc-400">{r.phone !== "—" ? r.phone : <span className="text-zinc-700">—</span>}</span>
                    </td>

                    {/* Plan */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 " + (PLAN_BADGE[r.plan] ?? PLAN_BADGE.free)}>
                        <span className={"size-1.5 rounded-full " + (PLAN_DOT[r.plan] ?? "bg-zinc-500")} />
                        {r.plan}
                      </span>
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={r.status === "active"}
                          onChange={() => toggleStatus(r)}
                          disabled={togglingId === r.id}
                        />
                        <span className={"text-xs font-medium " + (r.status === "active" ? "text-emerald-400" : "text-zinc-500")}>
                          {r.status === "active" ? "Active" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="hidden px-4 py-3 text-xs text-zinc-600 lg:table-cell">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview */}
                        <button type="button" onClick={() => setPreviewTarget(r)}
                          title="View details"
                          className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-sky-500/15 hover:text-sky-400 transition-colors">
                          <Eye className="size-4" />
                        </button>
                        {/* Edit */}
                        <button type="button" onClick={() => openEdit(r)}
                          title="Edit restaurant"
                          className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-100 transition-colors">
                          <Pencil className="size-4" />
                        </button>
                        {/* Delete */}
                        <button type="button" onClick={() => setDeleteTarget(r)}
                          title="Delete restaurant"
                          className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
            <p className="text-xs text-zinc-600">
              {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}
              {totalPages > 1 && " · page " + page + " of " + totalPages}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)}
                    className={"cursor-pointer flex size-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors " + (n === page ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Restaurant"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} disabled={creating}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">
              {creating ? "Creating…" : "Create Restaurant"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {createError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{createError}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Restaurant Name" required>
                <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. The Grand Kitchen" className={inputCls} />
              </Field>
            </div>
            <Field label="Owner Name">
              <input value={createForm.ownerName} onChange={(e) => setCreateForm((f) => ({ ...f, ownerName: e.target.value }))}
                placeholder="Full name" className={inputCls} />
            </Field>
            <Field label="Owner Email" required>
              <input type="email" value={createForm.ownerEmail} onChange={(e) => setCreateForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                placeholder="owner@restaurant.com" className={inputCls} />
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={createForm.ownerPassword}
                  onChange={(e) => setCreateForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                  placeholder="Min 6 characters" autoComplete="new-password"
                  className={inputCls + " pr-10"} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Field label="Phone">
              <input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555 000 0000" className={inputCls} />
            </Field>
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
            <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">Status</p>
                <p className="text-xs text-zinc-500">Restaurant will be {createForm.status === "active" ? "active" : "inactive"} immediately</p>
              </div>
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={createForm.status === "active"}
                  onChange={(v) => setCreateForm((f) => ({ ...f, status: v ? "active" : "inactive" }))}
                />
                <span className={"text-xs font-medium " + (createForm.status === "active" ? "text-emerald-400" : "text-zinc-500")}>
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
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleEdit} disabled={saving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {editError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{editError}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Restaurant Name" required>
                <input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls} />
              </Field>
            </div>
            <Field label="Phone">
              <input value={editForm.phone ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555 000 0000" className={inputCls} />
            </Field>
            <Field label="Plan">
              <select value={editForm.plan ?? "free"} onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                className={"cursor-pointer " + inputCls}>
                {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input value={editForm.address ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St, City, Country" className={inputCls} />
              </Field>
            </div>
          </div>
          {editTarget && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">
              Owner: <span className="text-zinc-300">{editTarget.ownerName}</span>
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
        message={deleteTarget ? "\\"" + deleteTarget.name + "\\" and all its users will be permanently deleted." : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {ToastUI}
    </div>
  );
}
`;

fs.appendFileSync("src/app/super-admin/restaurants/page.jsx", mainComponent, "utf8");
console.log("Appended main component. Total:", fs.readFileSync("src/app/super-admin/restaurants/page.jsx","utf8").length, "bytes");
