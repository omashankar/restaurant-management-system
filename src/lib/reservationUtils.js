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

export function formatReservationDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeSlot(time24) {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const TIME_SLOTS = [
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
