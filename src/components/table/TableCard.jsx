import { Check, Clock, Users } from "lucide-react";
import TableCapacityIcon from "./TableCapacityIcon";

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
  const capacity = Number(table.capacity) || 0;
  const tableName = table.name ?? `Table ${table.tableNumber ?? table.id ?? ""}`.trim();
  const effectiveStatus = reservationBooked
    ? "reserved"
    : table.status === "occupied" || table.status === "reserved"
      ? table.status
      : "available";
  const isAvailable = effectiveStatus === "available";

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={isAvailable ? onSelect : undefined}
      className={`group relative w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        !isAvailable
          ? "cursor-not-allowed border-zinc-200 bg-zinc-100/70 opacity-70"
          : selected
          ? "cursor-pointer border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:-translate-y-0.5"
          : "cursor-pointer border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-emerald-50/40 hover:shadow-md"
      }`}
    >
      {/* Selected check */}
      {selected && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}

      {!isAvailable && !selected && (
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
            effectiveStatus === "occupied"
              ? "bg-red-100 text-red-700 ring-red-200"
              : "bg-amber-100 text-amber-700 ring-amber-200"
          }`}
        >
          {effectiveStatus === "occupied" ? "Occupied" : "Reserved"}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-lg font-bold ${selected ? "text-emerald-700" : !isAvailable ? "text-zinc-500" : "text-zinc-900"}`}>
            {tableName}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
            <Users className="size-3.5" />
            <span>{capacity} {capacity === 1 ? "Person" : "People"}</span>
          </div>
        </div>

        <div title={`${capacity} Seater Table`} className="rounded-xl border border-zinc-200 bg-white/70 p-1.5 text-zinc-600">
          <TableCapacityIcon capacity={capacity} className="size-10" />
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`size-2 rounded-full ${
            effectiveStatus === "available"
              ? "bg-emerald-500"
              : effectiveStatus === "occupied"
                ? "bg-red-500"
                : "bg-amber-500"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            effectiveStatus === "available"
              ? "text-emerald-700"
              : effectiveStatus === "occupied"
                ? "text-red-700"
                : "text-amber-700"
          }`}
        >
          {effectiveStatus === "available"
            ? "Available"
            : effectiveStatus === "occupied"
              ? "Occupied"
              : "Reserved"}
        </span>
      </div>

      {/* Next available hint */}
      {!isAvailable && nextAvailableTime && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600">
          <Clock className="size-3" />
          <span>Free from {nextAvailableTime}</span>
        </div>
      )}
    </button>
  );
}
