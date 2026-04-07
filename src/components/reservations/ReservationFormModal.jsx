"use client";

import Modal from "@/components/ui/Modal";
import { TIME_SLOTS, formatTimeSlot } from "@/lib/reservationUtils";
import { useEffect, useState } from "react";

const empty = {
  customerName: "",
  phone: "",
  date: "",
  time: "19:00",
  guests: "2",
  tableNumber: "",
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
    notes: form.notes.trim(),
    status: form.status,
  };

  if (!editing) {
    let confirmedAt = null;
    let cancelledAt = null;
    if (form.status === "confirmed") confirmedAt = now;
    if (form.status === "cancelled") cancelledAt = now;
    return {
      id: `res-${Date.now()}`,
      ...fields,
      createdAt: now,
      confirmedAt,
      completedAt: null,
      cancelledAt,
    };
  }

  const next = { ...editing, ...fields };
  if (form.status === "pending") {
    next.confirmedAt = null;
    next.cancelledAt = null;
  } else if (form.status === "confirmed") {
    if (!next.confirmedAt) next.confirmedAt = now;
    next.cancelledAt = null;
  } else if (form.status === "cancelled") {
    if (!next.cancelledAt) next.cancelledAt = now;
  }
  return next;
}

export default function ReservationFormModal({
  open,
  onClose,
  editing,
  tableOptions,
  onSave,
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        customerName: editing.customerName,
        phone: editing.phone,
        date: editing.date,
        time: editing.time,
        guests: String(editing.guests),
        tableNumber: editing.tableNumber,
        notes: editing.notes ?? "",
        status: editing.status,
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setForm({
        ...empty,
        date: today,
        tableNumber: tableOptions[0] ?? "",
      });
    }
  }, [open, editing, tableOptions]);

  const submit = () => {
    const guests = parseInt(form.guests, 10);
    if (
      !form.customerName.trim() ||
      !form.phone.trim() ||
      !form.date ||
      !form.time ||
      Number.isNaN(guests) ||
      guests < 1 ||
      !form.tableNumber
    ) {
      return;
    }
    onSave(buildPayload(editing, form));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit reservation" : "Add reservation"}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500">
              Customer name
            </label>
            <input
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Phone</label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Guests</label>
            <input
              type="number"
              min={1}
              value={form.guests}
              onChange={(e) =>
                setForm((f) => ({ ...f, guests: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Time slot
            </label>
            <select
              value={form.time}
              onChange={(e) =>
                setForm((f) => ({ ...f, time: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeSlot(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Table</label>
            <select
              value={form.tableNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, tableNumber: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            >
              {tableOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500">
              Special notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
