import { Check, Clock, Users } from "lucide-react";

/**
 * Single table card for customer booking selection.
 *
 * Props:
 *   table            — { id, tableNumber, capacity, status }
 *   selected         — boolean
 *   onSelect         — () => void
 *   reservationBooked — boolean  (true = blocked by a reservation at selected time)
 *   nextAvailableTime — string | null  e.g. "19:30"
 */
export default function TableCard({
  table,
  selected,
  onSelect,
  reservationBooked = false,
  nextAvailableTime = null,
}) {
  // Physically occupied (admin set) OR blocked by reservation
  const isBooked    = table.status === "occupied" || table.status === "reserved" || reservationBooked;
  const isAvailable = !isBooked;

  return (
    <button
      type="button"
      disabled={isBooked}
      onClick={isAvailable ? onSelect : undefined}
      className={`group relative w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        isBooked
          ? "cursor-not-allowed border-zinc-800 bg-zinc-900/30 opacity-60"
          : selected
          ? "cursor-pointer border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:-translate-y-0.5"
          : "cursor-pointer border-zinc-800 bg-zinc-900/60 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      {/* Selected check */}
      {selected && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}

      {/* Booked badge */}
      {isBooked && !selected && (
        <span className="absolute right-3 top-3 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/25">
          Booked
        </span>
      )}

      {/* Table number */}
      <p className={`text-lg font-bold ${selected ? "text-emerald-400" : isBooked ? "text-zinc-500" : "text-zinc-100"}`}>
        {table.tableNumber}
      </p>

      {/* Capacity */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
        <Users className="size-3.5" />
        <span>{table.capacity} {table.capacity === 1 ? "person" : "persons"}</span>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className={`size-2 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
        <span className={`text-xs font-medium ${isAvailable ? "text-emerald-400" : "text-red-400"}`}>
          {isAvailable ? "Available" : "Booked"}
        </span>
      </div>

      {/* Next available hint */}
      {isBooked && nextAvailableTime && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600">
          <Clock className="size-3" />
          <span>Free from {nextAvailableTime}</span>
        </div>
      )}
    </button>
  );
}
