"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { CalendarClock, Loader2 } from "lucide-react";
import { useState } from "react";

const TIME_SLOTS = ["12:00","12:30","13:00","13:30","14:00","18:00","18:30","19:00","19:30","20:00","20:30","21:00"];

export default function TableBookingPage() {
  const { showToast } = useCustomer();
  const { setReservationRows } = useModuleData();
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "19:00", guests: "2", notes: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.date) {
      showToast("Name, phone and date are required.", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    // Push into admin reservations
    setReservationRows((prev) => [
      ...prev,
      {
        id: `res-c-${Date.now()}`,
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: parseInt(form.guests, 10) || 2,
        tableNumber: "TBD",
        status: "pending",
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
        confirmedAt: null,
        completedAt: null,
        cancelledAt: null,
      },
    ]);

    setLoading(false);
    setDone(true);
    showToast("Table booking request sent!");
  };

  if (done) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <CalendarClock className="size-14 text-emerald-400" />
        <h2 className="text-xl font-bold text-zinc-50">Booking Request Sent!</h2>
        <p className="text-sm text-zinc-400">We'll confirm your table shortly. Check your phone for updates.</p>
        <button type="button" onClick={() => { setDone(false); setForm({ name:"",phone:"",date:"",time:"19:00",guests:"2",notes:"" }); }} className="cursor-pointer rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500">
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="mb-6 text-center">
        <CalendarClock className="mx-auto size-10 text-emerald-400" />
        <h1 className="mt-3 text-2xl font-bold text-zinc-50">Book a Table</h1>
        <p className="mt-1 text-sm text-zinc-500">Reserve your spot — we'll confirm within 30 minutes.</p>
      </div>
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Full Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Phone *</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Date *</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Time</label>
            <select value={form.time} onChange={(e) => set("time", e.target.value)} className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Guests</label>
            <input type="number" min={1} max={20} value={form.guests} onChange={(e) => set("guests", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Special Requests (optional)</label>
          <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Allergies, occasion, seating preference…" className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40" />
        </div>
        <button type="submit" disabled={loading} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:opacity-50">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : "Request Booking"}
        </button>
      </form>
    </div>
  );
}
