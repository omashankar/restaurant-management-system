import { Users } from "lucide-react";
import TableCapacityIcon from "@/components/table/TableCapacityIcon";

const statusMap = {
  available: {
    label: "Available",
    bar: "bg-ra-primary",
    ring: "ring-ra-primary-25",
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
  const iconTone = selected ? "text-ra-primary-muted" : "admin-surface-body";
  const iconShell = selected
    ? "border-ra-primary-40 bg-ra-primary/[0.08] shadow-[0_0_0_1px_color-mix(in_srgb,var(--ra-primary)_25%,transparent),0_10px_26px_color-mix(in_srgb,var(--ra-primary)_18%,transparent)]"
    : "border-zinc-700/75 admin-surface-card shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.35)]";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(table)}
      className={`relative w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-ra-primary-60 bg-ra-primary-10 shadow-lg shadow-ra-primary-soft"
          : "admin-shell-border admin-surface-card hover:border-zinc-600 hover:shadow-md"
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
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${s.ring} admin-shell-text`}
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
        <p className="mt-2 text-xs admin-surface-muted">{table.zone}</p>
        <p className="mt-2.5 text-xs font-medium uppercase tracking-wide admin-surface-muted">
          {s.label}
        </p>
      </div>
    </button>
  );
}
