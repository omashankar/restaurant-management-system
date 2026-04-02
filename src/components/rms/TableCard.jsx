import { Users } from "lucide-react";

const statusMap = {
  available: {
    label: "Available",
    bar: "bg-emerald-500",
    ring: "ring-emerald-500/30",
  },
  occupied: {
    label: "Occupied",
    bar: "bg-sky-500",
    ring: "ring-sky-500/30",
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
      <div className="pl-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold tracking-tight">{table.id}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${s.ring} text-zinc-200`}
          >
            <Users className="size-3" aria-hidden />
            {table.seats}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">{table.zone}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {s.label}
        </p>
      </div>
    </button>
  );
}
