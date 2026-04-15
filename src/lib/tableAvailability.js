/**
 * Table availability utilities.
 * All pure functions — no React, no side effects.
 *
 * Reservation duration: SLOT_DURATION_MINUTES (default 90 min).
 * A booking at 18:00 occupies 18:00–19:30.
 */

export const SLOT_DURATION_MINUTES = 90;

/**
 * Convert "HH:MM" string to total minutes from midnight.
 * @param {string} time  e.g. "18:30"
 * @returns {number}
 */
export function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes-from-midnight back to "HH:MM".
 * @param {number} mins
 * @returns {string}
 */
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Check if two time ranges overlap.
 * Range A: [aStart, aStart + SLOT_DURATION_MINUTES)
 * Range B: [bStart, bStart + SLOT_DURATION_MINUTES)
 *
 * @param {number} aStart  minutes
 * @param {number} bStart  minutes
 * @returns {boolean}
 */
export function isTimeOverlapping(aStart, bStart) {
  const aEnd = aStart + SLOT_DURATION_MINUTES;
  const bEnd = bStart + SLOT_DURATION_MINUTES;
  // Overlap if one starts before the other ends
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Get availability info for a single table on a given date+time.
 *
 * @param {object} params
 * @param {string} params.tableNumber   e.g. "T06"
 * @param {string} params.date          "YYYY-MM-DD"
 * @param {string} params.time          "HH:MM"
 * @param {Array}  params.reservations  all reservation rows
 * @param {string} [params.excludeId]   reservation id to ignore (for edits)
 *
 * @returns {{ available: boolean, conflictingRes: object|null, nextAvailableTime: string|null }}
 */
export function getTableAvailability({ tableNumber, date, time, reservations, excludeId }) {
  const requestedStart = timeToMinutes(time);

  // Only active reservations for this table on this date
  const active = reservations.filter(
    (r) =>
      r.tableNumber === tableNumber &&
      r.date === date &&
      r.status !== "cancelled" &&
      r.id !== excludeId
  );

  let conflictingRes = null;

  for (const res of active) {
    const resStart = timeToMinutes(res.time);
    if (isTimeOverlapping(requestedStart, resStart)) {
      conflictingRes = res;
      break;
    }
  }

  if (!conflictingRes) {
    return { available: true, conflictingRes: null, nextAvailableTime: null };
  }

  // Find next available slot after the conflict ends
  const conflictEnd = timeToMinutes(conflictingRes.time) + SLOT_DURATION_MINUTES;
  const nextAvailableTime = minutesToTime(conflictEnd);

  return { available: false, conflictingRes, nextAvailableTime };
}

/**
 * Get availability for ALL tables in a category for a given date+time.
 *
 * @param {object} params
 * @param {Array}  params.tables        floor tables (filtered by category already)
 * @param {string} params.date
 * @param {string} params.time
 * @param {Array}  params.reservations
 *
 * @returns {Map<string, { available: boolean, nextAvailableTime: string|null }>}
 *   keyed by tableNumber
 */
export function getTablesAvailability({ tables, date, time, reservations }) {
  const result = new Map();
  for (const table of tables) {
    const info = getTableAvailability({
      tableNumber: table.tableNumber,
      date,
      time,
      reservations,
    });
    result.set(table.id, {
      available: info.available,
      nextAvailableTime: info.nextAvailableTime,
    });
  }
  return result;
}

/**
 * Count available tables in a category for a given date+time.
 * Used for area cards.
 */
export function getCategoryAvailabilityCounts({ tables, date, time, reservations }) {
  const map = {};
  for (const table of tables) {
    if (!table.categoryId) continue;
    if (!map[table.categoryId]) map[table.categoryId] = { total: 0, available: 0 };
    map[table.categoryId].total++;

    // Only count as available if not physically occupied AND no reservation conflict
    if (table.status === "occupied") continue;
    const info = getTableAvailability({ tableNumber: table.tableNumber, date, time, reservations });
    if (info.available) map[table.categoryId].available++;
  }
  return map;
}
