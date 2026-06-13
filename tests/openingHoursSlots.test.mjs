import test from "node:test";
import assert from "node:assert/strict";
import { timeToMinutes, minutesToTime, SLOT_DURATION_MINUTES } from "../src/lib/tableAvailability.js";

const SLOT_INTERVAL_MINUTES = 30;

function normalizeOpeningHoursRow(row) {
  if (!row) return null;
  const openTime = String(row.openTime ?? row.open ?? "").trim().slice(0, 5);
  const closeTime = String(row.closeTime ?? row.close ?? "").trim().slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return null;
  }
  return { day: row.day, openTime, closeTime, closed: Boolean(row.closed) };
}

function generateTimeSlotsForDayRow(dayRow) {
  const row = normalizeOpeningHoursRow(dayRow);
  if (!row || row.closed) return [];
  const open = timeToMinutes(row.openTime);
  let close = timeToMinutes(row.closeTime);
  if (close <= open) close += 24 * 60;
  const lastStart = close - SLOT_DURATION_MINUTES;
  if (lastStart < open) return [];
  const slots = [];
  for (let t = open; t <= lastStart; t += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTime(t % (24 * 60)));
  }
  return slots;
}

function getWeekdayNameForDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function getTimeSlotsForDate(openingHours, date, { fallback = ["11:00"] } = {}) {
  if (!date || !Array.isArray(openingHours) || openingHours.length === 0) {
    return [...fallback];
  }
  const dayName = getWeekdayNameForDate(date);
  const dayRow = openingHours.find(
    (h) => String(h.day ?? "").toLowerCase() === dayName.toLowerCase(),
  );
  if (!dayRow) return [...fallback];
  const normalized = normalizeOpeningHoursRow(dayRow);
  if (!normalized) return [...fallback];
  if (normalized.closed) return [];
  return generateTimeSlotsForDayRow(dayRow);
}

const DEFAULT_HOURS = [
  { day: "Monday", openTime: "09:00", closeTime: "22:00", closed: false },
  { day: "Tuesday", openTime: "09:00", closeTime: "22:00", closed: false },
  { day: "Wednesday", openTime: "09:00", closeTime: "22:00", closed: false },
  { day: "Thursday", openTime: "09:00", closeTime: "22:00", closed: false },
  { day: "Friday", openTime: "09:00", closeTime: "23:00", closed: false },
  { day: "Saturday", openTime: "10:00", closeTime: "23:00", closed: false },
  { day: "Sunday", openTime: "10:00", closeTime: "21:00", closed: true },
];

test("Monday 09:00-22:00 yields slots every 30m ending at 20:30", () => {
  const slots = getTimeSlotsForDate(DEFAULT_HOURS, "2026-06-08");
  assert.equal(getWeekdayNameForDate("2026-06-08"), "Monday");
  assert.equal(slots[0], "09:00");
  assert.equal(slots[slots.length - 1], "20:30");
  assert.equal(slots.length, 24);
  assert.deepEqual(slots.slice(0, 4), ["09:00", "09:30", "10:00", "10:30"]);
});

test("closed Sunday returns no slots", () => {
  const slots = getTimeSlotsForDate(DEFAULT_HOURS, "2026-06-14");
  assert.equal(getWeekdayNameForDate("2026-06-14"), "Sunday");
  assert.deepEqual(slots, []);
});

test("onboarding open/close field names still produce correct slots", () => {
  const hours = [{ day: "Monday", open: "11:00", close: "23:00", closed: false }];
  const slots = getTimeSlotsForDate(hours, "2026-06-08");
  assert.equal(slots[0], "11:00");
  assert.equal(slots[slots.length - 1], "21:30");
});

test("open day with window shorter than 90 minutes returns empty not fallback", () => {
  const hours = [{ day: "Monday", openTime: "22:00", closeTime: "22:30", closed: false }];
  const slots = getTimeSlotsForDate(hours, "2026-06-08", { fallback: ["19:00"] });
  assert.deepEqual(slots, []);
});

test("Saturday 10:00-23:00 last slot is 21:30", () => {
  const slots = getTimeSlotsForDate(DEFAULT_HOURS, "2026-06-13");
  assert.equal(getWeekdayNameForDate("2026-06-13"), "Saturday");
  assert.equal(slots[0], "10:00");
  assert.equal(slots[slots.length - 1], "21:30");
});

test("Monday 09:00 to midnight (00:00) — slots until 22:30", () => {
  const hours = [
    { day: "Monday", openTime: "09:00", closeTime: "00:00", closed: false },
    ...DEFAULT_HOURS.slice(1),
  ];
  const slots = getTimeSlotsForDate(hours, "2026-06-08");
  assert.equal(slots[0], "09:00");
  assert.equal(slots[slots.length - 1], "22:30");
  assert.ok(slots.length >= 28);
});
