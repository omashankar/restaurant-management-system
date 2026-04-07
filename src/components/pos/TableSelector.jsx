"use client";

const STATUS_STYLE = {
  available: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  occupied: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  reserved: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export default function TableSelector({ tables, selectedTableId, onSelect, compact = false }) {
  return (
    <div className={`grid gap-1.5 ${compact ? "grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {tables.map((table) => {
        const selected = selectedTableId === table.id;
        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onSelect(table.id)}
            className={`rounded-xl border px-2 py-1.5 text-left transition-all ${
              selected
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            }`}
            aria-pressed={selected}
          >
            <p className={`font-semibold text-zinc-100 ${compact ? "text-xs" : "text-sm"}`}>{table.name}</p>
            <span
              className={`mt-1 inline-flex rounded-md border px-1.5 py-0.5 font-medium capitalize ${compact ? "text-[9px]" : "text-[11px]"} ${
                STATUS_STYLE[table.status] ?? STATUS_STYLE.available
              }`}
            >
              {table.status}
            </span>
          </button>
        );
      })}
    </div>
  );
}
