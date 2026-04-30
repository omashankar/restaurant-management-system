"use client";

import Modal from "@/components/ui/Modal";
import { useModuleData } from "@/context/ModuleDataContext";
import { useCustomerSearch } from "@/hooks/useCustomerSearch";
import { TIME_SLOTS, formatTimeSlot } from "@/lib/reservationUtils";
import { getTableAvailability } from "@/lib/tableAvailability";
import { AlertCircle, Search, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const empty = {
  customerName: "",
  phone: "",
  date: "",
  time: "19:00",
  guests: "2",
  tableNumber: "",
  area: "",
  notes: "",
  status: "pending",
};

function buildPayload(editing, form) {
  const guests = parseInt(form.guests, 10);
  const now = new Date().toISOString();
  const fields = {
    customerName: form.customerName.trim(),
    phone: form.phone.trim(),
    date: form.date,
    time: form.time,
    guests,
    tableNumber: form.tableNumber,
    area: form.area,
    notes: form.notes.trim(),
    status: form.status,
  };
  if (!editing) {
    return {
      id: `res-${Date.now()}`,
      ...fields,
      createdAt: now,
      confirmedAt: form.status === "confirmed" ? now : null,
      completedAt: null,
      cancelledAt: form.status === "cancelled" ? now : null,
    };
  }
  const next = { ...editing, ...fields };
  if (form.status === "pending") { next.confirmedAt = null; next.cancelledAt = null; }
  else if (form.status === "confirmed") { if (!next.confirmedAt) next.confirmedAt = now; next.cancelledAt = null; }
  else if (form.status === "cancelled") { if (!next.cancelledAt) next.cancelledAt = now; }
  else if (form.status === "completed") { if (!next.completedAt) next.completedAt = now; }
  return next;
}

/* ── Inline customer search widget ── */
function CustomerSearchField({ onSelect, initialName = "", initialPhone = "" }) {
  const { query, setQuery, results, selected, setSelected, addCustomer, clearSelection } = useCustomerSearch();
  const [showDrop, setShowDrop]   = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [newForm, setNewForm]     = useState({ name: "", phone: "", email: "" });
  const [addError, setAddError] = useState("");
  const wrapRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* If editing an existing reservation, pre-select by phone */
  useEffect(() => {
    if (initialPhone && !selected) {
      // Try to find existing customer
      // We just show the filled state without forcing a customerRows match
    }
  }, [initialPhone, selected]);

  const handleSelect = (c) => {
    setSelected(c);
    setShowDrop(false);
    setShowAdd(false);
    setQuery("");
    onSelect({ name: c.name, phone: c.phone, customerId: c.id });
  };

  const handleAdd = async () => {
    if (!newForm.name.trim() || !newForm.phone.trim()) return;
    setAddError("");
    const c = await addCustomer(newForm);
    if (!c) {
      setAddError("Customer save failed. Try again.");
      return;
    }
    setShowAdd(false);
    setShowDrop(false);
    setQuery("");
    onSelect({ name: c.name, phone: c.phone, customerId: c.id });
  };

  const handleClear = () => {
    clearSelection();
    setShowAdd(false);
    onSelect({ name: "", phone: "", customerId: null });
  };

  /* ── Selected state ── */
  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-emerald-300">{selected.name}</p>
          <p className="text-xs text-zinc-500">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</p>
        </div>
        <button type="button" onClick={handleClear}
          className="cursor-pointer rounded-lg p-1 text-zinc-500 hover:text-zinc-200" aria-label="Clear">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="space-y-2">
      {/* Search input */}
      <div className="flex overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/60 focus-within:border-emerald-500/50">
        <span className="flex items-center pl-3 text-zinc-500">
          <Search className="size-4" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDrop(true); setShowAdd(false); }}
          onFocus={() => { if (query.trim()) setShowDrop(true); }}
          placeholder="Search by name or phone…"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <button type="button" onClick={() => { setShowAdd((v) => !v); setShowDrop(false); }}
          title="Add new customer"
          className="cursor-pointer flex items-center justify-center px-3 text-zinc-500 hover:text-emerald-400 transition-colors">
          <UserPlus className="size-4" />
        </button>
      </div>

      {/* Dropdown results */}
      {showDrop && query.trim() && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40 overflow-hidden">
          {results.length > 0 && (
            <ul className="divide-y divide-zinc-800/60 max-h-48 overflow-y-auto">
              {results.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => handleSelect(c)}
                    className="cursor-pointer flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-zinc-800/60 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.phone}</p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-600">{c.visits ?? 0} visits</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length === 0 && (
            <p className="px-4 py-3 text-xs text-zinc-500">No customers found for &ldquo;{query}&rdquo;</p>
          )}
          {/* Add new shortcut */}
          <button type="button"
            onClick={() => {
              const looksLikePhone = /^[\d\s+\-()\\.]{5,}$/.test(query.trim());
              setNewForm((f) => ({
                ...f,
                phone: looksLikePhone ? query.trim() : f.phone,
                name:  !looksLikePhone ? query.trim() : f.name,
              }));
              setShowAdd(true);
              setShowDrop(false);
            }}
            className="cursor-pointer flex w-full items-center gap-2 border-t border-zinc-800 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-zinc-800/60 transition-colors">
            <UserPlus className="size-4" /> Add &ldquo;{query}&rdquo; as new customer
          </button>
        </div>
      )}

      {/* Add new form */}
      {showAdd && (
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">New Customer</p>
          <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name *"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          <input value={newForm.phone} onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone *"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          <input value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email (optional)"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleAdd}
              disabled={!newForm.name.trim() || !newForm.phone.trim()}
              className="cursor-pointer flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
              Save & Select
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200">
              Cancel
            </button>
          </div>
          {addError ? (
            <p className="text-xs text-red-400">{addError}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main modal
══════════════════════════════════════════════════════════ */
export default function ReservationFormModal({ open, onClose, editing, tableOptions, onSave }) {
  const { floorTables, reservationRows, tableCategories, setCustomerRows } = useModuleData();
  const [form, setForm] = useState(empty);
  const [linkedCustomerId, setLinkedCustomerId] = useState(null);

  useEffect(() => {
    if (!open) return;
    const nextForm = editing
      ? {
          customerName: editing.customerName,
          phone: editing.phone,
          date: editing.date,
          time: editing.time,
          guests: String(editing.guests),
          tableNumber: editing.tableNumber,
          area: editing.area ?? "",
          notes: editing.notes ?? "",
          status: editing.status,
        }
      : {
          ...empty,
          date: new Date().toISOString().slice(0, 10),
          tableNumber: tableOptions[0] ?? "",
        };

    const raf = requestAnimationFrame(() => {
      setLinkedCustomerId(null);
      setForm(nextForm);
    });
    return () => cancelAnimationFrame(raf);
  }, [open, editing, tableOptions]);

  /* Customer selected from search widget */
  const handleCustomerSelect = ({ name, phone, customerId }) => {
    setForm((f) => ({ ...f, customerName: name, phone }));
    setLinkedCustomerId(customerId);
  };

  /* Availability check */
  const availabilityInfo = useMemo(() => {
    if (!form.tableNumber || !form.date || !form.time) return null;
    return getTableAvailability({
      tableNumber: form.tableNumber,
      date: form.date,
      time: form.time,
      reservations: reservationRows,
      excludeId: editing?.id,
    });
  }, [form.tableNumber, form.date, form.time, reservationRows, editing]);

  /* Enriched table options */
  const enrichedTables = useMemo(() => {
    return tableOptions.map((tn) => {
      const t   = floorTables.find((ft) => ft.tableNumber === tn);
      const cat = t ? tableCategories.find((c) => c.id === t.categoryId) : null;
      return {
        tableNumber: tn,
        label: t ? `${tn} — ${t.capacity} persons${cat ? ` · ${cat.name}` : ""}` : tn,
        areaName: cat?.name ?? "",
      };
    });
  }, [tableOptions, floorTables, tableCategories]);

  /* Auto-derive area when table changes */
  const handleTableChange = (tableNumber) => {
    const entry = enrichedTables.find((e) => e.tableNumber === tableNumber);
    setForm((f) => ({ ...f, tableNumber, area: entry?.areaName ?? f.area }));
  };

  const isConflict = availabilityInfo && !availabilityInfo.available;

  const submit = async () => {
    const guests = parseInt(form.guests, 10);
    if (
      !form.customerName.trim() || !form.phone.trim() ||
      !form.date || !form.time ||
      Number.isNaN(guests) || guests < 1 ||
      !form.tableNumber
    ) return;

    // Update visit count if linked to existing customer
    if (linkedCustomerId) {
      setCustomerRows((prev) =>
        prev.map((c) =>
          c.id === linkedCustomerId
            ? { ...c, visits: (c.visits ?? 0) + 1, lastVisit: form.date }
            : c
        )
      );
      fetch(`/api/customers/${linkedCustomerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastVisit: form.date }),
      }).catch(() => {});
    }

    await onSave(buildPayload(editing, form));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit reservation" : "Add reservation"}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose}
            className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500">
            Cancel
          </button>
          <button type="button" onClick={submit}
            className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Customer search ── */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Customer</label>
          <CustomerSearchField
            key={open ? "open" : "closed"}
            onSelect={handleCustomerSelect}
            initialName={editing?.customerName ?? ""}
            initialPhone={editing?.phone ?? ""}
          />
        </div>

        {/* ── Name + Phone (manual fallback, auto-filled by search) ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Name *</label>
            <input value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Full name"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Phone *</label>
            <input value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Guests</label>
            <input type="number" min={1} value={form.guests}
              onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Date</label>
            <input type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Time slot</label>
            <select value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{formatTimeSlot(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Status</label>
            <select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ── Table with availability ── */}
        <div>
          <label className="text-xs font-medium text-zinc-500">Table</label>
          <select value={form.tableNumber}
            onChange={(e) => handleTableChange(e.target.value)}
            className={`cursor-pointer mt-1 w-full rounded-xl border px-3 py-2.5 text-sm text-zinc-100 outline-none bg-zinc-950/60 ${
              isConflict ? "border-red-500/50 focus:border-red-500/50" : "border-zinc-700 focus:border-emerald-500/40"
            }`}>
            <option value="">— Select table —</option>
            {enrichedTables.map(({ tableNumber, label }) => (
              <option key={tableNumber} value={tableNumber}>{label}</option>
            ))}
          </select>

          {availabilityInfo && (
            <div className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              isConflict
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}>
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {isConflict
                ? `Table booked at this time.${availabilityInfo.nextAvailableTime ? ` Next free: ${availabilityInfo.nextAvailableTime}` : ""}`
                : "Table is available for this slot."}
            </div>
          )}
        </div>

        {/* ── Area (auto-filled, editable) ── */}
        <div>
          <label className="text-xs font-medium text-zinc-500">
            Area
            {form.area && <span className="ml-1 text-zinc-600">(auto-filled from table)</span>}
          </label>
          <select value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
            <option value="">— Select area —</option>
            {tableCategories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="text-xs font-medium text-zinc-500">Special notes</label>
          <textarea rows={2} value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
        </div>
      </div>
    </Modal>
  );
}
