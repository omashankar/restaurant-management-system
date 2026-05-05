"use client";

import TableCard from "@/components/table/TableCard";
import {
  CUSTOMER_BOOKING_CAPACITY_FILTERS,
  CUSTOMER_BOOKING_CONTENT,
  CUSTOMER_BOOKING_TIME_SLOTS,
} from "@/config/customerBookingContent";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import {
  getCategoryActive,
  getCategoryHover,
} from "@/lib/tableCategoryColors";
import {
  getCategoryAvailabilityCounts,
  getTableAvailability,
  getTablesAvailability,
} from "@/lib/tableAvailability";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

/* ── Step indicator ── */
function StepDot({ n, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
        done   ? "bg-emerald-500 text-zinc-950" :
        active ? "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/40" :
                 "bg-zinc-200 text-zinc-600"
      }`}>
        {done ? <CheckCircle2 className="size-4" /> : n}
      </span>
      <span className={`hidden text-[10px] font-medium sm:block ${active ? "text-zinc-800" : "text-zinc-500"}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }) {
  return <div className={`mb-4 h-0.5 flex-1 rounded-full transition-all ${done ? "bg-emerald-500" : "bg-zinc-300"}`} />;
}

export default function TableBookingPage() {
  const { showToast } = useCustomer();
  const { floorTables, reservationRows, setReservationRows, tableCategories } = useModuleData();

  const [step, setStep]                   = useState(1);
  const [form, setForm]                   = useState({ name: "", phone: "", date: "", time: "19:00", guests: "2", notes: "" });
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [capFilter, setCapFilter]         = useState("all");
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [customerAreaImages, setCustomerAreaImages] = useState({});
  const dateInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const normalizeAreaKey = (name) => String(name ?? "").trim().toLowerCase();

  useEffect(() => {
    let active = true;
    async function fetchAreaImages() {
      try {
        const res = await fetch("/api/customer/table-areas", { cache: "no-store" });
        const data = await res.json();
        if (!active || !data?.success || !Array.isArray(data.areas)) return;
        const map = {};
        for (const area of data.areas) {
          const key = normalizeAreaKey(area.name);
          if (!key || !area.imageUrl || map[key]) continue;
          map[key] = area.imageUrl;
        }
        setCustomerAreaImages(map);
      } catch {
        // Customer flow should remain usable even if images fail to load.
      }
    }
    fetchAreaImages();
    return () => {
      active = false;
    };
  }, []);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  /* ── Availability counts per category (for area cards) ── */
  const catCounts = useMemo(() => {
    if (!form.date || !form.time) {
      // Fallback: use physical status only
      const map = {};
      floorTables.forEach((t) => {
        if (!t.categoryId) return;
        if (!map[t.categoryId]) map[t.categoryId] = { total: 0, available: 0 };
        map[t.categoryId].total++;
        if (t.status === "available") map[t.categoryId].available++;
      });
      return map;
    }
    return getCategoryAvailabilityCounts({
      tables: floorTables,
      date: form.date,
      time: form.time,
      reservations: reservationRows,
    });
  }, [floorTables, reservationRows, form.date, form.time]);

  /* ── Tables in selected category with availability map ── */
  const tablesInCat = useMemo(() => {
    if (!selectedCatId) return [];
    return floorTables.filter((t) => {
      if (t.categoryId !== selectedCatId) return false;
      if (capFilter === "2")  return t.capacity === 2;
      if (capFilter === "4")  return t.capacity === 4;
      if (capFilter === "6+") return t.capacity >= 6;
      return true;
    });
  }, [floorTables, selectedCatId, capFilter]);

  /* Availability map for tables in current category */
  const availabilityMap = useMemo(() => {
    if (!form.date || !form.time || tablesInCat.length === 0) return new Map();
    return getTablesAvailability({
      tables: tablesInCat,
      date: form.date,
      time: form.time,
      reservations: reservationRows,
    });
  }, [tablesInCat, form.date, form.time, reservationRows]);

  const step1Valid   = form.name.trim() && form.phone.trim() && form.date;
  const selectedCat  = tableCategories.find((c) => c.id === selectedCatId);

  /* ── Submit with double-booking check ── */
  const submit = async () => {
    setConflictError(null);

    // Re-check availability at confirm time
    if (selectedTable && form.date && form.time) {
      const check = getTableAvailability({
        tableNumber: selectedTable.tableNumber,
        date: form.date,
        time: form.time,
        reservations: reservationRows,
      });
      if (!check.available) {
        setConflictError(
          `Table ${selectedTable.tableNumber} was just booked for this time. ${
            check.nextAvailableTime ? `Next available: ${check.nextAvailableTime}` : "Please choose another table."
          }`
        );
        return;
      }
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    setReservationRows((prev) => [
      ...prev,
      {
        id: `res-c-${Date.now()}`,
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: parseInt(form.guests, 10) || 2,
        tableNumber: selectedTable?.tableNumber ?? "TBD",
        area: selectedCat?.name ?? "—",
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

  const reset = () => {
    setDone(false); setStep(1); setConflictError(null);
    setForm({ name:"", phone:"", date:"", time:"19:00", guests:"2", notes:"" });
    setSelectedCatId(null); setSelectedTable(null); setCapFilter("all");
  };

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <CalendarClock className="size-10 text-emerald-600" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">{CUSTOMER_BOOKING_CONTENT.successTitle}</h2>
          <p className="mt-2 text-sm text-zinc-600">{CUSTOMER_BOOKING_CONTENT.successSubtitle}</p>
        </div>
        <div className="w-full max-w-sm divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
          {[
            { label: "Name",   value: form.name },
            { label: "Date",   value: `${form.date} at ${form.time}` },
            { label: "Area",   value: selectedCat?.name ?? "—" },
            { label: "Table",  value: selectedTable?.tableNumber ?? "TBD" },
            { label: "Guests", value: form.guests },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className="font-semibold text-zinc-900">{value}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={reset}
          className="cursor-pointer rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
          Book Another Table
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-8 rounded-3xl border border-zinc-200 bg-white/85 p-8 text-center shadow-sm">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25">
          <CalendarClock className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">{CUSTOMER_BOOKING_CONTENT.pageTitle}</h1>
        <p className="mt-1 text-sm text-zinc-600">{CUSTOMER_BOOKING_CONTENT.pageSubtitle}</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        <StepDot n={1} label="Details" active={step === 1} done={step > 1} />
        <StepLine done={step > 1} />
        <StepDot n={2} label="Area"    active={step === 2} done={step > 2} />
        <StepLine done={step > 2} />
        <StepDot n={3} label="Table"   active={step === 3} done={step > 3} />
        <StepLine done={step > 3} />
        <StepDot n={4} label="Confirm" active={step === 4} done={false} />
      </div>

      {/* ══ STEP 1: Details ══ */}
      {step === 1 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900">{CUSTOMER_BOOKING_CONTENT.detailsTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-600">Full Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Phone *</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Date *</label>
              <div className="relative mt-1">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  onFocus={openDatePicker}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 outline-none focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Open date picker"
                >
                  <CalendarClock className="size-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Time</label>
              <select value={form.time} onChange={(e) => set("time", e.target.value)}
                className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500/50">
                {CUSTOMER_BOOKING_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Guests</label>
              <div className="mt-1 flex items-center gap-2">
                <Users className="size-4 shrink-0 text-zinc-600" />
                <input type="number" min={1} max={20} value={form.guests} onChange={(e) => set("guests", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500/50" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Special Requests (optional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="Allergies, occasion, seating preference…"
              className="mt-1 w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-emerald-500/50" />
          </div>
          <button type="button" disabled={!step1Valid} onClick={() => setStep(2)}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
            Next: Choose Area <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* ══ STEP 2: Area ══ */}
      {step === 2 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-zinc-900">{CUSTOMER_BOOKING_CONTENT.areaTitle}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Showing availability for <span className="font-medium text-zinc-700">{form.date}</span> at <span className="font-medium text-zinc-700">{form.time}</span>
            </p>
          </div>

          {tableCategories.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-10 text-center">
              <p className="text-sm text-zinc-500">{CUSTOMER_BOOKING_CONTENT.noAreasLabel}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tableCategories.map((cat) => {
                const isActive   = selectedCatId === cat.id;
                const counts     = catCounts[cat.id];
                const noAvail    = counts && counts.available === 0;
                const activeClass = getCategoryActive(cat.color);
                const hoverClass  = getCategoryHover(cat.color);
                const imageUrl =
                  cat.imageUrl || customerAreaImages[normalizeAreaKey(cat.name)] || "";
                return (
                  <button key={cat.id} type="button"
                    onClick={() => { setSelectedCatId(cat.id); setSelectedTable(null); }}
                    className={`cursor-pointer flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      isActive
                        ? `${activeClass} ring-1`
                        : `border-zinc-200 bg-zinc-50 ${hoverClass}`
                    }`}>
                    {imageUrl ? (
                      <div className="mb-1 w-full overflow-hidden rounded-xl border border-zinc-200/70 bg-white/70">
                        <Image
                          src={imageUrl}
                          alt={`${cat.name} area`}
                          width={320}
                          height={140}
                          className="h-24 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <p className={`text-sm font-bold ${isActive ? "text-current" : "text-zinc-900"}`}>{cat.name}</p>
                    {counts ? (
                      <p className={`text-xs font-medium ${noAvail ? "text-red-400" : "text-zinc-500"}`}>
                        {noAvail ? "No tables free" : `${counts.available}/${counts.total} free`}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-600">No tables</p>
                    )}
                    {cat.description && (
                      <p className="text-[11px] text-zinc-600 line-clamp-1">{cat.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
              <ChevronLeft className="size-4" /> Back
            </button>
            <button type="button" disabled={!selectedCatId} onClick={() => setStep(3)}
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
              Next: Pick Table <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 3: Table ══ */}
      {step === 3 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">{selectedCat?.name} {CUSTOMER_BOOKING_CONTENT.tableTitleSuffix}</h2>
              <p className="text-xs text-zinc-500">
                {form.date} · {form.time} · ~90 min slot
              </p>
            </div>
            {/* Capacity filter */}
            <div className="flex flex-wrap gap-1.5">
              {CUSTOMER_BOOKING_CAPACITY_FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => { setCapFilter(f.id); setSelectedTable(null); }}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    capFilter === f.id
                      ? "bg-emerald-500 text-zinc-950"
                      : "border border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" /> Booked</span>
          </div>

          {tablesInCat.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-10 text-center">
              <p className="text-sm text-zinc-500">{CUSTOMER_BOOKING_CONTENT.noTablesLabel}</p>
              <button type="button" onClick={() => setCapFilter("all")}
                className="cursor-pointer mt-3 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                {CUSTOMER_BOOKING_CONTENT.clearFilterLabel}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tablesInCat.map((t) => {
                const avail = availabilityMap.get(t.id);
                const reservationBooked = avail ? !avail.available : false;
                const nextAvailableTime = avail?.nextAvailableTime ?? null;
                return (
                  <TableCard
                    key={t.id}
                    table={t}
                    selected={selectedTable?.id === t.id}
                    onSelect={() => setSelectedTable(t)}
                    reservationBooked={reservationBooked}
                    nextAvailableTime={nextAvailableTime}
                  />
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(2)}
              className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
              <ChevronLeft className="size-4" /> Back
            </button>
            <button type="button" disabled={!selectedTable} onClick={() => setStep(4)}
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
              Review Booking <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 4: Confirm ══ */}
      {step === 4 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900">{CUSTOMER_BOOKING_CONTENT.confirmTitle}</h2>

          <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50">
            {[
              { label: "Name",     value: form.name },
              { label: "Phone",    value: form.phone },
              { label: "Date",     value: form.date },
              { label: "Time",     value: `${form.time} (~90 min)` },
              { label: "Guests",   value: `${form.guests} persons` },
              { label: "Area",     value: selectedCat?.name ?? "—" },
              { label: "Table",    value: selectedTable?.tableNumber },
              { label: "Capacity", value: `${selectedTable?.capacity} persons` },
              ...(form.notes ? [{ label: "Notes", value: form.notes }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-zinc-500">{label}</span>
                <span className="font-semibold text-zinc-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Conflict error */}
          {conflictError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-700">{conflictError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setStep(3); setConflictError(null); }}
              className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
              <ChevronLeft className="size-4" /> Back
            </button>
            <button type="button" onClick={submit} disabled={loading}
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:opacity-50">
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> Sending…</>
                : <><CheckCircle2 className="size-4" /> Confirm Booking</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
