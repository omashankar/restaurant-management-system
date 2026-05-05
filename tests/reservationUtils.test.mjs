import test from "node:test";
import assert from "node:assert/strict";
import {
  TIME_SLOTS,
  formatReservationDate,
  formatTimeSlot,
  getReservationTimeline,
} from "../src/lib/reservationUtils.js";

test("getReservationTimeline marks pending reservations correctly", () => {
  const timeline = getReservationTimeline({
    status: "pending",
    createdAt: "2026-05-01T10:00:00.000Z",
    confirmedAt: null,
    completedAt: null,
    cancelledAt: null,
  });

  assert.equal(timeline[0].key, "created");
  assert.equal(timeline[1].tone, "wait");
  assert.equal(timeline[2].key, "completed");
  assert.equal(timeline[2].tone, "wait");
});

test("getReservationTimeline marks cancelled reservations with bad tone", () => {
  const timeline = getReservationTimeline({
    status: "cancelled",
    createdAt: "2026-05-01T10:00:00.000Z",
    confirmedAt: "2026-05-01T10:05:00.000Z",
    completedAt: null,
    cancelledAt: "2026-05-01T10:30:00.000Z",
  });

  assert.equal(timeline.length, 3);
  assert.equal(timeline[2].key, "cancelled");
  assert.equal(timeline[2].tone, "bad");
});

test("formatters return safe placeholders and readable values", () => {
  assert.equal(formatReservationDate(""), "—");
  assert.equal(formatTimeSlot(""), "—");
  assert.match(formatReservationDate("2026-05-01"), /\d{4}|May|Fri|Sat|Sun|Mon|Tue|Wed|Thu/);
  assert.match(formatTimeSlot("18:30"), /\d/);
});

test("TIME_SLOTS contains expected booking window", () => {
  assert.equal(TIME_SLOTS[0], "11:00");
  assert.equal(TIME_SLOTS[TIME_SLOTS.length - 1], "21:30");
  assert.ok(TIME_SLOTS.includes("19:00"));
});
