"use client";

const STATUS_STYLE = {
  available: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  occupied: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  reserved: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export default function TableSelector({ tables, selectedTableId, onSelect }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {tables.map((table) => {
        const selected = selectedTableId === table.id;
        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onSelect(table.id)}
            className={`rounded-xl border px-3 py-2 text-left transition-all ${
              selected
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            }`}
            aria-pressed={selected}
          >
            <p className="text-sm font-semibold text-zinc-100">{table.name}</p>
            <span
              className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${
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
