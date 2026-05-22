"use client";

import TableCard from "@/components/table/TableCard";
import { CUSTOMER_BOOKING_CAPACITY_FILTERS, CUSTOMER_BOOKING_CONTENT, CUSTOMER_BOOKING_TIME_SLOTS } from "@/config/customerBookingContent";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { getCategoryAvailabilityCounts, getTableAvailability, getTablesAvailability } from "@/lib/tableAvailability";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Users, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const inputCls = "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#FF6B35]/40 focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/10";

function StepDot({ n, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.span
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`flex size-10 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all duration-300 ${
          done    ? "gradient-primary text-white shadow-[#FF6B35]/20"
          : active ? "border-2 border-[#FF6B35] bg-white text-[#FF6B35]"
          : "border border-gray-200 bg-white text-gray-400"
        }`}
      >
        {done ? <CheckCircle2 className="size-4" /> : n}
      </motion.span>
      <span className={`hidden text-[10px] font-bold uppercase tracking-wider sm:block ${active ? "text-[#FF6B35]" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

function StepLine({ done }) {
  return (
    <div className="relative mb-4 h-0.5 flex-1 overflow-hidden rounded-full bg-gray-200">
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: done ? "100%" : "0%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute inset-y-0 left-0 gradient-primary"
      />
    </div>
  );
}

export default function TableBookingPage() {
  const { showToast } = useCustomer();
  const { floorTables, reservationRows, setReservationRows, tableCategories } = useModuleData();
  const { link } = useRestaurantSlug();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "19:00", guests: "2", notes: "" });
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [capFilter, setCapFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
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
      } catch {}
    }
    fetchAreaImages();
    return () => { active = false; };
  }, []);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") { input.showPicker(); return; }
    input.focus();
  };

  const catCounts = useMemo(() => {
    if (!form.date || !form.time) {
      const map = {};
      floorTables.forEach((t) => {
        if (!t.categoryId) return;
        if (!map[t.categoryId]) map[t.categoryId] = { total: 0, available: 0 };
        map[t.categoryId].total++;
        if (t.status === "available") map[t.categoryId].available++;
      });
      return map;
    }
    return getCategoryAvailabilityCounts({ tables: floorTables, date: form.date, time: form.time, reservations: reservationRows });
  }, [floorTables, reservationRows, form.date, form.time]);

  const tablesInCat = useMemo(() => {
    if (!selectedCatId) return [];
    return floorTables.filter((t) => {
      if (t.categoryId !== selectedCatId) return false;
      if (capFilter === "2") return t.capacity === 2;
      if (capFilter === "4") return t.capacity === 4;
      if (capFilter === "6+") return t.capacity >= 6;
      return true;
    });
  }, [floorTables, selectedCatId, capFilter]);

  const availabilityMap = useMemo(() => {
    if (!form.date || !form.time || tablesInCat.length === 0) return new Map();
    return getTablesAvailability({ tables: tablesInCat, date: form.date, time: form.time, reservations: reservationRows });
  }, [tablesInCat, form.date, form.time, reservationRows]);

  const step1Valid = form.name.trim() && form.phone.trim() && form.date;
  const selectedCat = tableCategories.find((c) => c.id === selectedCatId);

  const submit = async () => {
    setConflictError(null);
    if (selectedTable && form.date && form.time) {
      const check = getTableAvailability({ tableNumber: selectedTable.tableNumber, date: form.date, time: form.time, reservations: reservationRows });
      if (!check.available) {
        setConflictError(`Table ${selectedTable.tableNumber} was just booked. ${check.nextAvailableTime ? `Next: ${check.nextAvailableTime}` : "Choose another."}`);
        return;
      }
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setReservationRows((prev) => [...prev, {
      id: `res-c-${Date.now()}`, customerName: form.name.trim(), phone: form.phone.trim(),
      date: form.date, time: form.time, guests: parseInt(form.guests, 10) || 2,
      tableNumber: selectedTable?.tableNumber ?? "TBD", area: selectedCat?.name ?? "—",
      status: "pending", notes: form.notes.trim(), createdAt: new Date().toISOString(),
      confirmedAt: null, completedAt: null, cancelledAt: null,
    }]);
    setLoading(false);
    setDone(true);
    showToast("Table booking request sent!");
  };

  const reset = () => {
    setDone(false); setStep(1); setConflictError(null);
    setForm({ name: "", phone: "", date: "", time: "19:00", guests: "2", notes: "" });
    setSelectedCatId(null); setSelectedTable(null); setCapFilter("all");
  };

  /* ══ SUCCESS SCREEN ══ */
  if (done) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-green-100">
              <CalendarClock className="size-12 text-green-500" />
            </motion.div>
            <h2 className="font-poppins text-2xl font-black text-[#111827]">{CUSTOMER_BOOKING_CONTENT.successTitle}</h2>
            <p className="mt-2 text-sm text-gray-500">{CUSTOMER_BOOKING_CONTENT.successSubtitle}</p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
              {[{ label: "Name", value: form.name }, { label: "Date & Time", value: `${form.date} at ${form.time}` },
                { label: "Area", value: selectedCat?.name ?? "—" }, { label: "Table", value: selectedTable?.tableNumber ?? "TBD" },
                { label: "Guests", value: `${form.guests} persons` }].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm last:border-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-bold text-[#111827]">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex gap-3">
              <button type="button" onClick={reset}
                className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:border-[#FF6B35]/30">
                Book Another
              </button>
              <Link href={link("/order/menu")}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full gradient-primary py-3 text-sm font-bold text-white shadow-md">
                Browse Menu <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ══ HERO ══ */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
              Reservations
            </span>
            <h1 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">
              {CUSTOMER_BOOKING_CONTENT.pageTitle}
            </h1>
            <p className="mt-2 text-sm text-gray-500">{CUSTOMER_BOOKING_CONTENT.pageSubtitle}</p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-8 flex items-center gap-2">
          <StepDot n={1} label="Details" active={step === 1} done={step > 1} />
          <StepLine done={step > 1} />
          <StepDot n={2} label="Area"    active={step === 2} done={step > 2} />
          <StepLine done={step > 2} />
          <StepDot n={3} label="Table"   active={step === 3} done={step > 3} />
          <StepLine done={step > 3} />
          <StepDot n={4} label="Confirm" active={step === 4} done={false} />
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <motion.div key="step1" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="mb-6 font-poppins text-xl font-black text-[#111827]">{CUSTOMER_BOOKING_CONTENT.detailsTitle}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Full Name *</label>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Phone *</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Date *</label>
                  <div className="relative">
                    <input ref={dateInputRef} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls + " pr-10"} />
                    <button type="button" onClick={openDatePicker} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6B35]">
                      <CalendarClock className="size-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Time</label>
                  <select value={form.time} onChange={(e) => set("time", e.target.value)} className={inputCls}>
                    {CUSTOMER_BOOKING_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Guests</label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#FF6B35]" />
                    <input type="number" min={1} max={20} value={form.guests} onChange={(e) => set("guests", e.target.value)} className={inputCls + " pl-10"} />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Special Requests (optional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Allergies, occasion, seating preference…" className={inputCls + " resize-none"} />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                type="button" disabled={!step1Valid} onClick={() => setStep(2)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 disabled:cursor-not-allowed disabled:opacity-40">
                Next: Choose Area <ChevronRight className="size-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div key="step2" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="font-poppins text-xl font-black text-[#111827]">{CUSTOMER_BOOKING_CONTENT.areaTitle}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Availability for <span className="font-semibold text-[#111827]">{form.date}</span> at <span className="font-semibold text-[#111827]">{form.time}</span>
                </p>
              </div>
              {tableCategories.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
                  <p className="text-sm text-gray-400">{CUSTOMER_BOOKING_CONTENT.noAreasLabel}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {tableCategories.map((cat, i) => {
                    const isActive = selectedCatId === cat.id;
                    const counts = catCounts[cat.id];
                    const noAvail = counts && counts.available === 0;
                    const imageUrl = cat.imageUrl || customerAreaImages[normalizeAreaKey(cat.name)] || "";
                    return (
                      <motion.button key={cat.id} type="button"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedCatId(cat.id); setSelectedTable(null); }}
                        className={`flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                          isActive ? "border-[#FF6B35] shadow-lg shadow-[#FF6B35]/15" : "border-gray-100 bg-white hover:border-[#FF6B35]/30 hover:shadow-md"
                        }`}>
                        {imageUrl ? (
                          <div className="aspect-[16/9] w-full overflow-hidden">
                            <Image src={imageUrl} alt={cat.name} width={320} height={180} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-[16/9] w-full bg-gradient-to-br from-[#FFF8F3] to-[#FFE4D6] flex items-center justify-center">
                            <CalendarClock className="size-8 text-[#FF6B35]/40" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className={`font-poppins text-sm font-bold ${isActive ? "text-[#FF6B35]" : "text-[#111827]"}`}>{cat.name}</p>
                          {counts ? (
                            <p className={`mt-0.5 text-xs font-semibold ${noAvail ? "text-red-500" : "text-green-600"}`}>
                              {noAvail ? "No tables free" : `${counts.available}/${counts.total} available`}
                            </p>
                          ) : <p className="mt-0.5 text-xs text-gray-400">No tables</p>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 hover:border-[#FF6B35]/30">
                  <ChevronLeft className="size-4" /> Back
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="button" disabled={!selectedCatId} onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full gradient-primary py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/20 disabled:cursor-not-allowed disabled:opacity-40">
                  Next: Pick Table <ChevronRight className="size-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <motion.div key="step3" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-poppins text-xl font-black text-[#111827]">{selectedCat?.name} {CUSTOMER_BOOKING_CONTENT.tableTitleSuffix}</h2>
                  <p className="mt-1 text-sm text-gray-400">{form.date} · {form.time} · ~90 min slot</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOMER_BOOKING_CAPACITY_FILTERS.map((f) => (
                    <button key={f.id} type="button" onClick={() => { setCapFilter(f.id); setSelectedTable(null); }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        capFilter === f.id ? "gradient-primary text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35]/30"
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-400" /> Booked</span>
              </div>
              {tablesInCat.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
                  <p className="text-sm text-gray-400">{CUSTOMER_BOOKING_CONTENT.noTablesLabel}</p>
                  <button type="button" onClick={() => setCapFilter("all")} className="mt-3 text-xs font-semibold text-[#FF6B35] hover:underline">
                    {CUSTOMER_BOOKING_CONTENT.clearFilterLabel}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {tablesInCat.map((t) => {
                    const avail = availabilityMap.get(t.id);
                    return (
                      <TableCard key={t.id} table={t} selected={selectedTable?.id === t.id}
                        onSelect={() => setSelectedTable(t)}
                        reservationBooked={avail ? !avail.available : false}
                        nextAvailableTime={avail?.nextAvailableTime ?? null} />
                    );
                  })}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 hover:border-[#FF6B35]/30">
                  <ChevronLeft className="size-4" /> Back
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="button" disabled={!selectedTable} onClick={() => setStep(4)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full gradient-primary py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/20 disabled:cursor-not-allowed disabled:opacity-40">
                  Review Booking <ChevronRight className="size-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <motion.div key="step4" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="mb-6 font-poppins text-xl font-black text-[#111827]">{CUSTOMER_BOOKING_CONTENT.confirmTitle}</h2>
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                {[{ label: "Name", value: form.name }, { label: "Phone", value: form.phone },
                  { label: "Date", value: form.date }, { label: "Time", value: `${form.time} (~90 min)` },
                  { label: "Guests", value: `${form.guests} persons` }, { label: "Area", value: selectedCat?.name ?? "—" },
                  { label: "Table", value: selectedTable?.tableNumber }, { label: "Capacity", value: `${selectedTable?.capacity} persons` },
                  ...(form.notes ? [{ label: "Notes", value: form.notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 text-sm last:border-0">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-bold text-[#111827]">{value}</span>
                  </div>
                ))}
              </div>
              {conflictError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{conflictError}</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setStep(3); setConflictError(null); }}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-500 hover:border-[#FF6B35]/30">
                  <ChevronLeft className="size-4" /> Back
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="button" onClick={submit} disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full gradient-primary py-3 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 disabled:opacity-50">
                  {loading ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : <><CheckCircle2 className="size-4" /> Confirm Booking</>}
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
