import { getTableAvailability } from "@/lib/tableAvailability";

/** Normalize DB rows for availability helpers */
export function mapReservationRows(rows) {
  return (rows ?? []).map((r) => ({
    id: r.id ?? r._id?.toString(),
    tableNumber: r.tableNumber,
    date: r.date,
    time: r.time,
    status: r.status ?? "pending",
    customerName: r.customerName,
    phone: r.phone,
  }));
}

/**
 * Server-side: true if slot is free for this table.
 */
export function isReservationSlotAvailable(reservations, { tableNumber, date, time, excludeId }) {
  if (!tableNumber || !date || !time) return { available: true };
  const info = getTableAvailability({
    tableNumber,
    date,
    time,
    reservations: mapReservationRows(reservations),
    excludeId,
  });
  return info;
}
