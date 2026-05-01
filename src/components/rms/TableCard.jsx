import { Users } from "lucide-react";
import TableCapacityIcon from "@/components/table/TableCapacityIcon";

const statusMap = {
  available: {
    label: "Available",
    bar: "bg-emerald-500",
    ring: "ring-emerald-500/30",
  },
  occupied: {
    label: "Occupied",
    bar: "bg-red-500",
    ring: "ring-red-500/30",
  },
  reserved: {
    label: "Reserved",
    bar: "bg-amber-500",
    ring: "ring-amber-500/30",
  },
};

export default function TableCard({
  table,
  selected,
  onSelect,
  className = "",
}) {
  const s = statusMap[table.status] ?? statusMap.available;
  const capacity = Number(table.seats ?? table.capacity ?? 0) || 0;
  const tableName = table.name ?? table.id;
  const iconTone = selected ? "text-emerald-300" : "text-zinc-300";
  const iconShell = selected
    ? "border-emerald-400/40 bg-emerald-500/[0.08] shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_10px_26px_rgba(16,185,129,0.18)]"
    : "border-zinc-700/75 bg-zinc-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.35)]";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(table)}
      className={`relative w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:shadow-md"
      } ${className}`}
    >
      <span
        className={`absolute left-0 top-4 h-8 w-1 rounded-r-full ${s.bar}`}
        aria-hidden
      />
      <div className="pl-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold tracking-tight">{tableName}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${s.ring} text-zinc-200`}
          >
            <Users className="size-3" aria-hidden />
            {capacity}
          </span>
        </div>
        <div
          title={`${capacity} Seater Table`}
          className={`mt-3.5 w-fit rounded-xl border p-2 backdrop-blur-[2px] transition-all duration-200 ${iconShell}`}
        >
          <div className="rounded-lg bg-black/20 p-1">
            <TableCapacityIcon capacity={capacity} className={`size-12 ${iconTone}`} />
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">{table.zone}</p>
        <p className="mt-2.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {s.label}
        </p>
      </div>
    </button>
  );
}
