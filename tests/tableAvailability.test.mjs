import test from "node:test";
import assert from "node:assert/strict";
import {
  SLOT_DURATION_MINUTES,
  getCategoryAvailabilityCounts,
  getTableAvailability,
  getTablesAvailability,
  isTimeOverlapping,
  minutesToTime,
  timeToMinutes,
} from "../src/lib/tableAvailability.js";

test("time conversion helpers round-trip correctly", () => {
  assert.equal(timeToMinutes("18:30"), 1110);
  assert.equal(minutesToTime(1110), "18:30");
});

test("isTimeOverlapping respects slot duration boundaries", () => {
  const sixPm = timeToMinutes("18:00");
  const sevenThirtyPm = timeToMinutes("19:30");
  const sixThirtyPm = timeToMinutes("18:30");
  assert.equal(isTimeOverlapping(sixPm, sixThirtyPm), true);
  assert.equal(isTimeOverlapping(sixPm, sevenThirtyPm), false);
  assert.equal(SLOT_DURATION_MINUTES, 90);
});

test("getTableAvailability returns conflict and next available time", () => {
  const reservations = [
    { id: "r1", tableNumber: "T1", date: "2026-05-01", time: "18:00", status: "confirmed" },
  ];
  const result = getTableAvailability({
    tableNumber: "T1",
    date: "2026-05-01",
    time: "18:30",
    reservations,
  });
  assert.equal(result.available, false);
  assert.equal(result.conflictingRes?.id, "r1");
  assert.equal(result.nextAvailableTime, "19:30");
});

test("getTablesAvailability and category counts combine reservation and occupied states", () => {
  const tables = [
    { id: "a", tableNumber: "T1", categoryId: "bar", status: "available" },
    { id: "b", tableNumber: "T2", categoryId: "bar", status: "occupied" },
    { id: "c", tableNumber: "T3", categoryId: "hall", status: "available" },
  ];
  const reservations = [
    { id: "r1", tableNumber: "T1", date: "2026-05-01", time: "18:00", status: "confirmed" },
  ];

  const availability = getTablesAvailability({
    tables,
    date: "2026-05-01",
    time: "18:30",
    reservations,
  });
  assert.equal(availability.get("a")?.available, false);
  assert.equal(availability.get("c")?.available, true);

  const counts = getCategoryAvailabilityCounts({
    tables,
    date: "2026-05-01",
    time: "18:30",
    reservations,
  });
  assert.deepEqual(counts, {
    bar: { total: 2, available: 0 },
    hall: { total: 1, available: 1 },
  });
});
