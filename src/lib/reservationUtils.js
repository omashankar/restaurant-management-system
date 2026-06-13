import {
  DEFAULT_LOCALE_PREFS,
  formatAdminDate,
  formatTime24,
} from "@/lib/localeFormat";
import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import {
  SLOT_DURATION_MINUTES,
  minutesToTime,
  timeToMinutes,
} from "@/lib/tableAvailability";

/** @typedef {'pending'|'confirmed'|'cancelled'} ReservationStatus */

/**
 * @param {{
 *   status: ReservationStatus;
 *   createdAt: string;
 *   confirmedAt: string | null;
 *   completedAt: string | null;
 *   cancelledAt: string | null;
 * }} r
 */
export function getReservationTimeline(r) {
  /** @type {{ key: string; label: string; at: string | null; tone: 'done'|'wait'|'skip'|'bad' }[]} */
  const steps = [];

  steps.push({
    key: "created",
    label: "Created",
    at: r.createdAt,
    tone: "done",
  });

  if (r.status === "cancelled") {
    steps.push({
      key: "confirmed",
      label: "Confirmed",
      at: r.confirmedAt,
      tone: r.confirmedAt ? "done" : "skip",
    });
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      at: r.cancelledAt,
      tone: "bad",
    });
    return steps;
  }

  steps.push({
    key: "confirmed",
    label: "Confirmed",
    at: r.confirmedAt,
    tone: r.status === "pending" && !r.confirmedAt ? "wait" : "done",
  });

  steps.push({
    key: "completed",
    label: "Completed",
    at: r.completedAt,
    tone: r.completedAt ? "done" : "wait",
  });

  return steps;
}

export function formatReservationDate(isoDate, prefs = DEFAULT_LOCALE_PREFS) {
  return formatAdminDate(isoDate, prefs, { weekday: true });
}

export function formatTimeSlot(time24, prefs = DEFAULT_LOCALE_PREFS) {
  return formatTime24(time24, prefs);
}

/** Fallback when opening hours are missing or a day is closed */
export const DEFAULT_TIME_SLOTS = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

/** @deprecated Use getTimeSlotsForDate — kept for imports that expect a static list */
export const TIME_SLOTS = DEFAULT_TIME_SLOTS;

const SLOT_INTERVAL_MINUTES = 30;

/** Minutes between open and close; 00:00 close after morning open = end of day (overnight). */
export function getOperatingWindowMinutes(openTime, closeTime) {
  const open = timeToMinutes(openTime);
  let close = timeToMinutes(closeTime);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return 0;
  if (close <= open) close += 24 * 60;
  return close - open;
}

/**
 * @param {{ day?: string; openTime?: string; closeTime?: string; open?: string; close?: string; closed?: boolean } | null | undefined} row
 */
export function normalizeOpeningHoursRow(row) {
  if (!row) return null;
  const openTime = String(row.openTime ?? row.open ?? "").trim().slice(0, 5);
  const closeTime = String(row.closeTime ?? row.close ?? "").trim().slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return null;
  }
  return {
    day: String(row.day ?? "").trim(),
    openTime,
    closeTime,
    closed: Boolean(row.closed),
  };
}

/** Canonical 7-day schedule for DB + UI (openTime/closeTime on every row). */
export function sanitizeOpeningHoursSchedule(incoming = []) {
  const defaultRows = EMPTY_SETTINGS.openingHours.map((row) => ({ ...row }));

  if (!Array.isArray(incoming)) return defaultRows;

  const byDay = new Map();
  for (const row of incoming) {
    const normalized = normalizeOpeningHoursRow(row);
    if (!normalized?.day) continue;
    byDay.set(normalized.day, {
      day: normalized.day,
      openTime: normalized.openTime,
      closeTime: normalized.closeTime,
      closed: normalized.closed,
    });
  }

  return defaultRows.map((def) => byDay.get(def.day) ?? { ...def });
}

/** ISO date (YYYY-MM-DD) → weekday name matching Settings (e.g. "Monday") */
export function getWeekdayNameForDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Build bookable start times for one day from open → close.
 * Last slot ensures SLOT_DURATION_MINUTES fits before closing.
 */
export function generateTimeSlotsForDayRow(
  dayRow,
  { intervalMinutes = SLOT_INTERVAL_MINUTES, slotDurationMinutes = SLOT_DURATION_MINUTES } = {}
) {
  const row = normalizeOpeningHoursRow(dayRow);
  if (!row || row.closed) return [];

  const open = timeToMinutes(row.openTime);
  let close = timeToMinutes(row.closeTime);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return [];

  // 00:00 close after morning open = midnight end of day (close <= open).
  if (close <= open) {
    close += 24 * 60;
  }

  const lastStart = close - slotDurationMinutes;
  if (lastStart < open) return [];

  const slots = [];
  for (let t = open; t <= lastStart; t += intervalMinutes) {
    slots.push(minutesToTime(t % (24 * 60)));
  }
  return slots;
}

/**
 * Slots for a calendar date from restaurant opening hours.
 * Returns [] when the venue is closed that day (no fallback).
 */
export function getTimeSlotsForDate(openingHours, date, { fallback = DEFAULT_TIME_SLOTS } = {}) {
  if (!date || !Array.isArray(openingHours) || openingHours.length === 0) {
    return [...fallback];
  }

  const dayName = getWeekdayNameForDate(date);
  const dayRow = openingHours.find(
    (h) => String(h.day ?? "").toLowerCase() === dayName.toLowerCase()
  );

  if (!dayRow) return [...fallback];

  const normalized = normalizeOpeningHoursRow(dayRow);
  if (!normalized) return [...fallback];
  if (normalized.closed) return [];

  // Day is open — always use generated slots (may be [] if window < 90 min).
  // Do not fall back to DEFAULT_TIME_SLOTS or slots would ignore opening hours.
  return generateTimeSlotsForDayRow(dayRow);
}

export function isRestaurantClosedOnDate(openingHours, date) {
  if (!date || !Array.isArray(openingHours) || openingHours.length === 0) return false;
  const dayName = getWeekdayNameForDate(date);
  const dayRow = openingHours.find(
    (h) => String(h.day ?? "").toLowerCase() === dayName.toLowerCase()
  );
  return Boolean(normalizeOpeningHoursRow(dayRow)?.closed);
}

export function pickDefaultTimeSlot(slots, preferred = "19:00") {
  if (!Array.isArray(slots) || slots.length === 0) return preferred;
  if (slots.includes(preferred)) return preferred;
  return slots[0];
}

/** Load weekly hours from restaurant_settings (empty array if missing). */
export async function fetchRestaurantOpeningHours(db, restaurantId) {
  if (!db || !restaurantId) return [];
  const doc = await db.collection("restaurant_settings").findOne(
    { restaurantId },
    { projection: { openingHours: 1 } },
  );
  return Array.isArray(doc?.openingHours) ? doc.openingHours : [];
}

/**
 * Server-side: date/time must fall on an allowed booking slot from opening hours.
 * Uses the same rules as UI dropdowns (getTimeSlotsForDate).
 */
export function validateReservationDateTime(openingHours, date, time) {
  const dateNorm = String(date ?? "").trim();
  const timeNorm = String(time ?? "").trim().slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateNorm)) {
    return { valid: false, error: "Use a valid date (YYYY-MM-DD)." };
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeNorm)) {
    return { valid: false, error: "Use a valid time (HH:MM)." };
  }
  if (isRestaurantClosedOnDate(openingHours, dateNorm)) {
    return { valid: false, error: "Restaurant is closed on the selected date." };
  }

  const slots = getTimeSlotsForDate(openingHours, dateNorm);
  if (slots.length === 0) {
    return { valid: false, error: "No booking times are available on the selected date." };
  }
  if (!slots.includes(timeNorm)) {
    return {
      valid: false,
      error: "Selected time is outside opening hours. Choose an available slot.",
    };
  }

  return { valid: true, error: null };
}
