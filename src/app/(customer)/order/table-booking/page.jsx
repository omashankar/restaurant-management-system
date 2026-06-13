"use client";

import CustomerMobileInput from "@/components/customer/CustomerMobileInput";
import TableCard from "@/components/table/TableCard";
import { CUSTOMER_BOOKING_CAPACITY_FILTERS } from "@/config/customerBookingContent";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import {
  getTimeSlotsForDate,
  isRestaurantClosedOnDate,
  pickDefaultTimeSlot,
} from "@/lib/reservationUtils";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { customerClasses, customerMotion, customerPage, customerSectionBg, customerType } from "@/lib/customerTheme";
import { getCategoryAvailabilityCounts, getTableAvailability, getTablesAvailability } from "@/lib/tableAvailability";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Users, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isValidGuestName, isValidGuestCount } from "@/lib/customerFormValidation";
import { isValidIndianMobile, toIndianE164 } from "@/lib/phoneUtils";
import { useEffect, useMemo, useRef, useState } from "react";

const fadeUp = customerMotion.fadeUpSm;

const inputCls = customerClasses.field;

function StepDot({ n, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.span
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`flex size-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
          done    ? "gradient-primary text-white"
          : active ? "border-2 border-customer-primary bg-[var(--customer-card)] text-customer-primary"
          : `border border-customer-border ${customerClasses.surface} text-customer-muted`
        }`}
      >
        {done ? <CheckCircle2 className="size-4" /> : n}
      </motion.span>
      <span className={`hidden text-[10px] font-bold uppercase tracking-wider sm:block ${active ? "text-customer-primary" : "text-customer-muted"}`}>{label}</span>
    </div>
  );
}

function StepLine({ done }) {
  return (
    <div className="relative mb-4 h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--customer-border)]">
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
  const { info } = useRestaurantInfo();
  const { formatTimeSlot, formatDate, formatReservationSlot } = useCustomerLocale();
  const { floorTables, reservationRows, setReservationRows, tableCategories } = useModuleData();
  const { link } = useRestaurantSlug();
  const { content: cms } = useRestaurantCms();
  const bookingCms = mergeCmsSection(DEFAULTS.booking, cms.booking);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "19:00", guests: "2", notes: "" });
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [capFilter, setCapFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [dateReservations, setDateReservations] = useState([]);
  const [customerAreaImages, setCustomerAreaImages] = useState({});
  const dateInputRef = useRef(null);
  const minBookingDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const timeSlots = useMemo(
    () => getTimeSlotsForDate(info.openingHours, form.date),
    [info.openingHours, form.date]
  );

  const closedOnSelectedDate = useMemo(
    () => isRestaurantClosedOnDate(info.openingHours, form.date),
    [info.openingHours, form.date]
  );

  useEffect(() => {
    if (!form.date || timeSlots.length === 0) return;
    if (!timeSlots.includes(form.time)) {
      setForm((f) => ({ ...f, time: pickDefaultTimeSlot(timeSlots, f.time) }));
    }
  }, [form.date, form.time, timeSlots]);

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

  useEffect(() => {
    if (!form.date) {
      setDateReservations([]);
      return;
    }
    let active = true;
    async function loadDateBookings() {
      try {
        const res = await fetch(
          `/api/customer/reservations?date=${encodeURIComponent(form.date)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (active && data?.success && Array.isArray(data.reservations)) {
          setDateReservations(data.reservations);
        }
      } catch {
        /* keep previous */
      }
    }
    loadDateBookings();
    return () => { active = false; };
  }, [form.date]);

  const activeReservations = useMemo(() => {
    if (!form.date) return reservationRows;
    const byId = new Map();
    for (const r of dateReservations) byId.set(r.id, r);
    for (const r of reservationRows) {
      if (r.date === form.date) byId.set(r.id, r);
    }
    return [...byId.values()];
  }, [form.date, dateReservations, reservationRows]);

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
    return getCategoryAvailabilityCounts({ tables: floorTables, date: form.date, time: form.time, reservations: activeReservations });
  }, [floorTables, activeReservations, form.date, form.time]);

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
    return getTablesAvailability({ tables: tablesInCat, date: form.date, time: form.time, reservations: activeReservations });
  }, [tablesInCat, form.date, form.time, activeReservations]);

  const step1Valid =
    isValidGuestName(form.name) &&
    isValidIndianMobile(form.phone) &&
    isValidGuestCount(form.guests) &&
    Boolean(form.date);
  const selectedCat = tableCategories.find((c) => c.id === selectedCatId);

  const submit = async () => {
    setConflictError(null);
    if (selectedTable && form.date && form.time) {
      const check = getTableAvailability({
        tableNumber: selectedTable.tableNumber,
        date: form.date,
        time: form.time,
        reservations: activeReservations,
      });
      if (!check.available) {
        setConflictError(
          `Table ${selectedTable.tableNumber} was just booked. ${check.nextAvailableTime ? `Next: ${check.nextAvailableTime}` : "Choose another."}`
        );
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name.trim(),
          phone: toIndianE164(form.phone),
          date: form.date,
          time: form.time,
          guests: parseInt(form.guests, 10) || 2,
          tableNumber: selectedTable?.tableNumber ?? "TBD",
          area: selectedCat?.name ?? "",
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setConflictError(data?.error ?? "Booking failed. Please try again.");
        return;
      }
      if (data.reservation) {
        const row = {
          ...data.reservation,
          createdAt: data.reservation.createdAt ?? new Date().toISOString(),
          confirmedAt: null,
          completedAt: null,
          cancelledAt: null,
        };
        setReservationRows((prev) => [...prev, row]);
        setDateReservations((prev) => [...prev, row]);
      }
      setDone(true);
      showToast("Table booking request sent!");
    } catch {
      setConflictError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDone(false); setStep(1); setConflictError(null);
    setForm({ name: "", phone: "", date: "", time: "19:00", guests: "2", notes: "" });
    setSelectedCatId(null); setSelectedTable(null); setCapFilter("all");
  };

  /* ══ SUCCESS SCREEN ══ */
  if (done) {
    return (
      <div className="ct-page-shell">
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="ct-surface-card rounded-3xl p-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
              className={`mx-auto mb-6 flex size-24 items-center justify-center rounded-full ${customerClasses.iconRingSuccess}`}>
              <CalendarClock className="size-12" />
            </motion.div>
            <h2 className="font-poppins text-2xl font-black text-customer-text">{bookingCms.successTitle}</h2>
            <p className="mt-2 text-sm text-customer-muted">{bookingCms.successSubtitle}</p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-customer-border">
              {[{ label: "Name", value: form.name }, { label: "Date & Time", value: formatReservationSlot(form.date, form.time) },
                { label: "Area", value: selectedCat?.name ?? "—" }, { label: "Table", value: selectedTable?.tableNumber ?? "TBD" },
                { label: "Guests", value: `${form.guests} persons` }].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-customer-border px-5 py-3 text-sm last:border-0">
                  <span className="shrink-0 text-customer-muted">{label}</span>
                  <span className="min-w-0 max-w-[65%] break-words text-right font-bold text-customer-text">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex gap-3">
              <button type="button" onClick={reset}
                className="flex-1 cursor-pointer rounded-full border border-customer-border py-3 text-sm font-semibold text-customer-muted hover:border-customer-primary/30">
                Book Another
              </button>
              <Link href={link("/order/menu")}
                className={`${customerClasses.btnPrimary} flex-1 gap-2 py-3 text-sm`}>
                Browse Menu <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-page-shell">

      {/* ══ HERO ══ */}
      <section className={customerSectionBg.white}>
        <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className={customerClasses.badge}>
              Reservations
            </span>
            <h1 className={`${customerType.heroTitle} sm:text-4xl`}>
              {bookingCms.pageTitle}
            </h1>
            <p className="mt-2 text-sm text-customer-muted">{bookingCms.pageSubtitle}</p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-8 flex min-w-0 items-center gap-1 overflow-x-auto pb-1 sm:gap-2">
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
              className="ct-surface-card rounded-3xl p-5 sm:p-8">
              <h2 className="mb-6 font-poppins text-lg font-black text-customer-text sm:text-xl">{bookingCms.detailsTitle}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-customer-muted">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your name"
                    className={inputCls}
                    autoComplete="name"
                  />
                  {form.name.trim() && !isValidGuestName(form.name) ? (
                    <p className={`mt-1 text-[11px] ${customerClasses.textDanger}`}>Use at least 2 letters (not numbers only).</p>
                  ) : null}
                </div>
                <CustomerMobileInput
                  id="booking-mobile"
                  label="Mobile number"
                  required
                  value={form.phone}
                  onChange={(digits) => set("phone", digits)}
                />
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-customer-muted">Date *</label>
                  <div className={customerClasses.fieldWrapPadRight}>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      onClick={openDatePicker}
                      min={minBookingDate}
                      className={inputCls}
                      aria-label="Reservation date"
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      className="ct-field-icon-btn"
                      aria-label="Open calendar"
                    >
                      <CalendarClock className="size-[1.125rem]" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-customer-muted">Time</label>
                  <select
                    value={form.time}
                    onChange={(e) => set("time", e.target.value)}
                    disabled={!form.date || closedOnSelectedDate || timeSlots.length === 0}
                    className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {!form.date ? (
                      <option value="">Select date first</option>
                    ) : closedOnSelectedDate ? (
                      <option value="">Closed this day</option>
                    ) : timeSlots.length === 0 ? (
                      <option value="">No slots available</option>
                    ) : (
                      timeSlots.map((t) => (
                        <option key={t} value={t}>{formatTimeSlot(t)}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-customer-muted">Guests</label>
                  <div className={customerClasses.fieldWrapPadLeft}>
                    <span className="ct-field-icon ct-field-icon--left" aria-hidden>
                      <Users className="size-5 shrink-0" strokeWidth={2.25} />
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={20}
                      value={form.guests}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        set("guests", v);
                      }}
                      className={`${inputCls} ct-field--number`}
                      aria-label="Number of guests"
                    />
                  </div>
                  {form.guests && !isValidGuestCount(form.guests) ? (
                    <p className={`mt-1 text-[11px] ${customerClasses.textDanger}`}>Guests must be between 1 and 20.</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-customer-muted">Special Requests (optional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Allergies, occasion, seating preference…" className={inputCls + " resize-none"} />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                type="button"
                disabled={!step1Valid}
                onClick={() => {
                  if (!isValidGuestName(form.name)) {
                    showToast("Please enter a valid full name (at least 2 letters).", "error");
                    return;
                  }
                  if (!isValidIndianMobile(form.phone)) {
                    showToast("Please enter a valid 10-digit mobile number.", "error");
                    return;
                  }
                  if (!form.date) {
                    showToast("Please select a date.", "error");
                    return;
                  }
                  setStep(2);
                }}
                className={`mt-6 ${customerClasses.btnPrimaryLg} cursor-pointer gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50`}>
                Next: Choose Area <ChevronRight className="size-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div key="step2" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="ct-surface-card rounded-3xl p-5 sm:p-8">
              <div className="mb-6">
                <h2 className="font-poppins text-xl font-black text-customer-text">{bookingCms.areaTitle}</h2>
                <p className="mt-1 text-sm text-customer-muted">
                  Availability for <span className="font-semibold text-customer-text">{formatReservationSlot(form.date, form.time)}</span>
                </p>
              </div>
              {tableCategories.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-customer-border py-12 text-center">
                  <p className="text-sm text-customer-muted">{bookingCms.noAreasLabel}</p>
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
                        whileHover={customerMotion.cardHoverSm} whileTap={customerMotion.tapSm}
                        onClick={() => { setSelectedCatId(cat.id); setSelectedTable(null); }}
                        className={`flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                          isActive ? "border-customer-primary" : `border-customer-border ${customerClasses.surface} hover:border-customer-primary/30`
                        }`}>
                        {imageUrl ? (
                          <div className="aspect-[16/9] w-full overflow-hidden">
                            <Image src={imageUrl} alt={cat.name} width={320} height={180} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-[16/9] w-full bg-gradient-to-br from-customer-cream to-customer-border flex items-center justify-center">
                            <CalendarClock className="size-8 text-customer-primary/40" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className={`font-poppins text-sm font-bold ${isActive ? "text-customer-primary" : "text-customer-text"}`}>{cat.name}</p>
                          {counts ? (
                            <p className={`mt-0.5 text-xs font-semibold ${noAvail ? customerClasses.textDanger : customerClasses.textSuccess}`}>
                              {noAvail ? "No tables free" : `${counts.available}/${counts.total} available`}
                            </p>
                          ) : <p className="mt-0.5 text-xs text-customer-muted">No tables</p>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-customer-border px-5 py-2.5 text-sm font-semibold text-customer-muted hover:border-customer-primary/30">
                  <ChevronLeft className="size-4" /> Back
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="button" disabled={!selectedCatId} onClick={() => setStep(3)}
                  className={`${customerClasses.btnPrimary} flex-1 cursor-pointer gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40`}>
                  Next: Pick Table <ChevronRight className="size-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <motion.div key="step3" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="ct-surface-card rounded-3xl p-5 sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-poppins text-xl font-black text-customer-text">{selectedCat?.name} {bookingCms.tableTitleSuffix}</h2>
                  <p className="mt-1 text-sm text-customer-muted">{formatReservationSlot(form.date, form.time)} · ~90 min slot</p>
                </div>
                <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:justify-end">
                  {CUSTOMER_BOOKING_CAPACITY_FILTERS.map((f) => (
                    <button key={f.id} type="button" onClick={() => { setCapFilter(f.id); setSelectedTable(null); }}
                      className={`rounded-full cursor-pointer px-3 py-1.5 text-xs font-semibold transition-all ${
                        capFilter === f.id ? customerClasses.chipActive : customerClasses.chip
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4 flex items-center gap-4 text-xs text-customer-muted">
                <span className="flex items-center gap-1.5"><span className={`size-2 ${customerClasses.statusDotOpen}`} /> Available</span>
                <span className="flex items-center gap-1.5"><span className={`size-2 ${customerClasses.statusDotClosed}`} /> Booked</span>
              </div>
              {tablesInCat.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-customer-border py-12 text-center">
                  <p className="text-sm text-customer-muted">{bookingCms.noTablesLabel}</p>
                  <button type="button" onClick={() => setCapFilter("all")} className="mt-3 text-xs font-semibold text-customer-primary hover:underline">
                    {bookingCms.clearFilterLabel}
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
                        nextAvailableTime={
                          avail?.nextAvailableTime ? formatTimeSlot(avail.nextAvailableTime) : null
                        } />
                    );
                  })}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-customer-border px-5 py-2.5 text-sm font-semibold text-customer-muted hover:border-customer-primary/30">
                  <ChevronLeft className="size-4" /> Back
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="button" disabled={!selectedTable} onClick={() => setStep(4)}
                  className={`${customerClasses.btnPrimary} flex-1 cursor-pointer gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40`}>
                  Review Booking <ChevronRight className="size-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <motion.div key="step4" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}
              className="ct-surface-card rounded-3xl p-5 sm:p-8">
              <h2 className="mb-6 font-poppins text-xl font-black text-customer-text">{bookingCms.confirmTitle}</h2>
              <div className="overflow-hidden rounded-2xl border border-customer-border">
                {[{ label: "Name", value: form.name }, { label: "Mobile", value: toIndianE164(form.phone) || form.phone },
                  { label: "Date", value: formatDate(form.date) }, { label: "Time", value: `${formatTimeSlot(form.time)} (~90 min)` },
                  { label: "Guests", value: `${form.guests} persons` }, { label: "Area", value: selectedCat?.name ?? "—" },
                  { label: "Table", value: selectedTable?.tableNumber }, { label: "Capacity", value: `${selectedTable?.capacity} persons` },
                  ...(form.notes ? [{ label: "Notes", value: form.notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3 border-b border-customer-border px-5 py-3.5 text-sm last:border-0">
                    <span className="shrink-0 text-customer-muted">{label}</span>
                    <span className="min-w-0 max-w-[65%] break-words text-right font-bold text-customer-text">{value}</span>
                  </div>
                ))}
              </div>
              {conflictError && (
                <div className={`mt-4 flex items-start gap-3 ${customerClasses.alertError}`}>
                  <AlertCircle className={`mt-0.5 size-4 shrink-0 ${customerClasses.textDanger}`} />
                  <p className="text-sm">{conflictError}</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setStep(3); setConflictError(null); }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-customer-border px-5 py-3 text-sm font-semibold text-customer-muted hover:border-customer-primary/30">
                  <ChevronLeft className="size-4" /> Back
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="button" onClick={submit} disabled={loading}
                  className={`${customerClasses.btnPrimary} flex-1 cursor-pointer gap-2 py-3 text-sm disabled:opacity-50`}>
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
