"use client";

import Modal from "@/components/ui/Modal";
import { useModuleData } from "@/context/ModuleDataContext";
import { useCustomerSearch } from "@/hooks/useCustomerSearch";
import {
  getReservationFormFieldErrors,
  EMPTY_RESERVATION_FORM_ERRORS,
  validateCustomerForm,
} from "@/lib/formValidation";
import PhoneInput from "@/components/ui/PhoneInput";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { invalidateOpeningHoursCache } from "@/hooks/useOpeningHours";
import {
  getTimeSlotsForDate,
  getWeekdayNameForDate,
  isRestaurantClosedOnDate,
  pickDefaultTimeSlot,
  areaNameForTable,
} from "@/lib/reservationUtils";
import { getTableAvailability } from "@/lib/tableAvailability";
import { useOpeningHours } from "@/hooks/useOpeningHours";
import { AlertCircle, Search, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { raInputCls, raTextareaCls } from "@/config/restaurantAdminTheme";

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
    const validationError = validateCustomerForm(newForm);
    if (validationError) {
      setAddError(validationError);
      return;
    }
    setAddError("");
    const result = await addCustomer(newForm);
    if (!result.ok) {
      setAddError(result.error ?? "Customer save failed. Try again.");
      return;
    }
    const c = result.customer;
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
      <div className="flex items-start justify-between gap-3 rounded-xl border border-ra-primary-30 bg-ra-primary-5 px-3 py-2.5">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ra-primary-muted">{selected.name}</p>
          <p className="break-all text-xs admin-surface-muted">
            {selected.phone}
            {selected.email ? ` · ${selected.email}` : ""}
          </p>
        </div>
        <button type="button" onClick={handleClear}
          className="cursor-pointer rounded-lg p-1 admin-surface-muted hover:admin-shell-text" aria-label="Clear">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="space-y-2">
      {/* Search input */}
      <div className="flex overflow-hidden rounded-xl border admin-shell-border admin-surface-card focus-within-ra-primary">
        <span className="flex items-center pl-3 admin-surface-muted">
          <Search className="size-4" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDrop(true); setShowAdd(false); }}
          onFocus={() => { if (query.trim()) setShowDrop(true); }}
          placeholder="Search by name or phone…"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm admin-shell-text outline-none placeholder:admin-surface-faint"
        />
        <button type="button" onClick={() => { setShowAdd((v) => !v); setShowDrop(false); }}
          title="Add new customer"
          className="cursor-pointer flex items-center justify-center px-3 admin-surface-muted hover-ra-primary transition-colors">
          <UserPlus className="size-4" />
        </button>
      </div>

      {/* Dropdown results */}
      {showDrop && query.trim() && (
        <div className="rounded-xl border admin-shell-border bg-zinc-900 shadow-xl shadow-black/40 overflow-hidden">
          {results.length > 0 && (
            <ul className="admin-table-body max-h-48 overflow-y-auto">
              {results.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => handleSelect(c)}
                    className="cursor-pointer flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:admin-shell-hover transition-colors">
                    <div>
                      <p className="text-sm font-medium admin-shell-text">{c.name}</p>
                      <p className="text-xs admin-surface-muted">{c.phone}</p>
                    </div>
                    <span className="shrink-0 text-xs admin-surface-faint">{c.visits ?? 0} visits</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length === 0 && (
            <p className="px-4 py-3 text-xs admin-surface-muted">No customers found for &ldquo;{query}&rdquo;</p>
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
            className="cursor-pointer flex w-full items-center gap-2 border-t admin-shell-border px-4 py-2.5 text-sm font-semibold text-ra-primary hover:admin-shell-hover transition-colors">
            <UserPlus className="size-4" /> Add &ldquo;{query}&rdquo; as new customer
          </button>
        </div>
      )}

      {/* Add new form */}
      {showAdd && (
        <div className="space-y-2 rounded-xl border admin-shell-border bg-zinc-900/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">New Customer</p>
          <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name *"
            className="admin-surface-input focus-ra-primary px-3 py-2 placeholder:admin-surface-faint" />
          <PhoneInput
            id="reservation-new-customer-phone"
            value={newForm.phone}
            onChange={(digits) => setNewForm((f) => ({ ...f, phone: digits }))}
          />
          <input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email (optional)"
            className="admin-surface-input focus-ra-primary px-3 py-2 placeholder:admin-surface-faint" />
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button type="button" onClick={handleAdd}
              disabled={!newForm.name.trim() || !newForm.phone.trim()}
              className="cursor-pointer flex-1 rounded-xl bg-ra-primary py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40">
              Save & Select
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="cursor-pointer rounded-xl border admin-shell-border px-3 py-2 text-sm admin-surface-muted hover:admin-shell-text sm:shrink-0">
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
  const { formatTimeSlot } = useAdminLocale();
  const { floorTables, reservationRows, tableCategories, setCustomerRows } = useModuleData();
  const [hoursRevision, setHoursRevision] = useState(0);
  const { openingHours } = useOpeningHours({ enabled: open, revision: hoursRevision });

  useEffect(() => {
    if (!open) return;
    invalidateOpeningHoursCache();
    setHoursRevision((n) => n + 1);
  }, [open]);
  const [form, setForm] = useState(empty);
  const [linkedCustomerId, setLinkedCustomerId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_RESERVATION_FORM_ERRORS);

  const timeSlots = useMemo(
    () => getTimeSlotsForDate(openingHours, form.date),
    [openingHours, form.date]
  );

  const closedOnSelectedDate = useMemo(
    () => isRestaurantClosedOnDate(openingHours, form.date),
    [openingHours, form.date]
  );

  useEffect(() => {
    if (!open) return;
    setSaveError("");
    setFieldErrors(EMPTY_RESERVATION_FORM_ERRORS);
    const defaultTable = editing?.tableNumber ?? tableOptions[0] ?? "";
    const nextForm = editing
      ? {
          customerName: editing.customerName,
          phone: editing.phone,
          date: editing.date,
          time: editing.time,
          guests: String(editing.guests),
          tableNumber: editing.tableNumber,
          area:
            areaNameForTable(editing.tableNumber, floorTables, tableCategories) ||
            editing.area ||
            "",
          notes: editing.notes ?? "",
          status: editing.status,
        }
      : {
          ...empty,
          date: new Date().toISOString().slice(0, 10),
          tableNumber: defaultTable,
          area: areaNameForTable(defaultTable, floorTables, tableCategories),
        };

    const raf = requestAnimationFrame(() => {
      setLinkedCustomerId(null);
      setForm(nextForm);
    });
    return () => cancelAnimationFrame(raf);
  }, [open, editing, tableOptions, floorTables, tableCategories]);

  useEffect(() => {
    if (!open || !form.date || timeSlots.length === 0) return;
    if (!timeSlots.includes(form.time)) {
      setForm((f) => ({ ...f, time: pickDefaultTimeSlot(timeSlots, f.time) }));
    }
  }, [open, form.date, form.time, timeSlots]);

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
      const t   = floorTables.find((ft) => String(ft.tableNumber) === String(tn));
      const areaName = areaNameForTable(tn, floorTables, tableCategories);
      return {
        tableNumber: tn,
        label: t ? `${tn} — ${t.capacity} persons${areaName ? ` · ${areaName}` : ""}` : tn,
        areaName,
      };
    });
  }, [tableOptions, floorTables, tableCategories]);

  const selectedTableArea = useMemo(
    () => areaNameForTable(form.tableNumber, floorTables, tableCategories),
    [form.tableNumber, floorTables, tableCategories],
  );

  /* Auto-derive area when table changes */
  const handleTableChange = (tableNumber) => {
    const area = areaNameForTable(tableNumber, floorTables, tableCategories);
    setForm((f) => ({ ...f, tableNumber, area }));
  };

  useEffect(() => {
    if (!open || !form.tableNumber) return;
    if (selectedTableArea && form.area !== selectedTableArea) {
      setForm((f) => ({ ...f, area: selectedTableArea }));
    }
  }, [open, form.tableNumber, form.area, selectedTableArea]);

  const isConflict = availabilityInfo && !availabilityInfo.available;

  const submit = async () => {
    const validation = getReservationFormFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setSaveError(validation.message ?? "Fix the highlighted fields.");
      return;
    }

    if (isConflict) {
      setSaveError(
        availabilityInfo?.nextAvailableTime
          ? `This table is booked. Next free slot: ${availabilityInfo.nextAvailableTime}`
          : "This table is already booked for the selected time."
      );
      return;
    }
    setSaveError("");

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

    const result = await onSave(buildPayload(editing, form));
    if (result?.ok) {
      onClose();
      return;
    }
    if (result?.error) setSaveError(result.error);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit reservation" : "Add reservation"}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-surface-body hover:border-zinc-500 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="min-w-0 space-y-4">

        {/* ── Customer search ── */}
        <div>
          <label className="mb-1.5 admin-surface-label">Customer</label>
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
            <label className="text-xs font-medium admin-surface-muted">Name *</label>
            <input
              value={form.customerName}
              onChange={(e) => {
                setForm((f) => ({ ...f, customerName: e.target.value }));
                if (fieldErrors.customerName) {
                  setFieldErrors((p) => ({ ...p, customerName: "" }));
                }
                setSaveError("");
              }}
              placeholder="Full name"
              aria-invalid={fieldErrors.customerName ? true : undefined}
              className={`mt-1 ${raInputCls} ${
                fieldErrors.customerName ? "border-red-500/50" : ""
              }`}
            />
            {fieldErrors.customerName && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.customerName}</p>
            )}
          </div>
          <PhoneInput
            id="reservation-phone"
            label="Phone"
            labelClassName="text-xs font-medium admin-surface-muted"
            required
            value={form.phone}
            onChange={(digits) => {
              setForm((f) => ({ ...f, phone: digits }));
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
              setSaveError("");
            }}
            error={fieldErrors.phone || undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium admin-surface-muted">Guests</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={form.guests}
              onChange={(e) => {
                setForm((f) => ({ ...f, guests: e.target.value }));
                if (fieldErrors.guests) setFieldErrors((p) => ({ ...p, guests: "" }));
                setSaveError("");
              }}
              aria-invalid={fieldErrors.guests ? true : undefined}
              className={`mt-1 ${raInputCls} ${
                fieldErrors.guests ? "border-red-500/50" : ""
              }`}
            />
            {fieldErrors.guests && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.guests}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((f) => ({ ...f, date: e.target.value }));
                if (fieldErrors.date) setFieldErrors((p) => ({ ...p, date: "" }));
                setSaveError("");
              }}
              aria-invalid={fieldErrors.date ? true : undefined}
              className={`mt-1 ${raInputCls} ${
                fieldErrors.date ? "border-red-500/50" : ""
              }`}
            />
            {fieldErrors.date && <p className="mt-1 text-xs text-red-400">{fieldErrors.date}</p>}
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Time slot</label>
            <select
              value={form.time}
              disabled={closedOnSelectedDate || timeSlots.length === 0}
              onChange={(e) => {
                setForm((f) => ({ ...f, time: e.target.value }));
                if (fieldErrors.time) setFieldErrors((p) => ({ ...p, time: "" }));
                setSaveError("");
              }}
              aria-invalid={fieldErrors.time ? true : undefined}
              className={`cursor-pointer mt-1 ${raInputCls} disabled:cursor-not-allowed disabled:opacity-60 ${
                fieldErrors.time ? "border-red-500/50" : ""
              }`}
            >
              {closedOnSelectedDate ? (
                <option value="">Closed this day</option>
              ) : timeSlots.length === 0 ? (
                <option value="">No slots available</option>
              ) : (
                timeSlots.map((t) => (
                  <option key={t} value={t}>{formatTimeSlot(t)}</option>
                ))
              )}
            </select>
            {closedOnSelectedDate ? (
              <p className="mt-1 text-xs text-amber-400">
                Restaurant is closed on {getWeekdayNameForDate(form.date) || "this day"} (Settings → Opening Hours).
              </p>
            ) : timeSlots.length === 0 && form.date ? (
              <p className="mt-1 text-xs text-amber-400">
                No slots for {getWeekdayNameForDate(form.date)} — open/close must allow at least 90 minutes
                (Settings → Opening Hours, then Save Changes).
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium admin-surface-muted">Status</label>
            <select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="cursor-pointer mt-1 admin-surface-input focus-ra-primary px-3 py-2.5">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ── Table with availability ── */}
        <div>
          <label className="text-xs font-medium admin-surface-muted">Table *</label>
          <select
            value={form.tableNumber}
            onChange={(e) => {
              handleTableChange(e.target.value);
              if (fieldErrors.tableNumber) {
                setFieldErrors((p) => ({ ...p, tableNumber: "" }));
              }
              setSaveError("");
            }}
            aria-invalid={fieldErrors.tableNumber ? true : undefined}
            className={`cursor-pointer mt-1 w-full rounded-xl border px-3 py-2.5 text-sm admin-shell-text outline-none admin-surface-card ${
              isConflict || fieldErrors.tableNumber
                ? "border-red-500/50 focus:border-red-500/50"
                : ""
            }`}
          >
            <option value="">— Select table —</option>
            {enrichedTables.map(({ tableNumber, label }) => (
              <option key={tableNumber} value={tableNumber}>{label}</option>
            ))}
          </select>

          {availabilityInfo && (
            <div className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              isConflict
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-ra-accent-20 bg-ra-accent-10 text-ra-accent"
            }`}>
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {isConflict
                ? `Table booked at this time.${availabilityInfo.nextAvailableTime ? ` Next free: ${availabilityInfo.nextAvailableTime}` : ""}`
                : "Table is available for this slot."}
            </div>
          )}
          {fieldErrors.tableNumber && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.tableNumber}</p>
          )}
          {saveError && !fieldErrors.tableNumber ? (
            <p className="mt-2 text-xs text-red-400">{saveError}</p>
          ) : null}
        </div>

        {/* ── Area (from selected table) ── */}
        <div>
          <label className="text-xs font-medium admin-surface-muted">
            Area
            {form.tableNumber ? (
              <span className="ml-1 admin-surface-faint">(from selected table)</span>
            ) : null}
          </label>
          <select
            value={form.area}
            disabled={Boolean(form.tableNumber && selectedTableArea)}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            className="cursor-pointer mt-1 admin-surface-input focus-ra-primary px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-80"
          >
            <option value="">— Select area —</option>
            {tableCategories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {form.tableNumber && !selectedTableArea ? (
            <p className="mt-1 text-xs text-amber-400">
              This table has no floor area assigned. Set it under Tables → Areas.
            </p>
          ) : null}
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="text-xs font-medium admin-surface-muted">Special notes</label>
          <textarea rows={2} value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={`mt-1 ${raTextareaCls}`} />
        </div>
      </div>
    </Modal>
  );
}
