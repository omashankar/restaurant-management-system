import { Plus } from "lucide-react";

export default function MenuItemCard({ item, onAdd, disabled, className = "" }) {
  return (
    <div
      className={`group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition-all duration-200 hover:border-emerald-500/35 hover:shadow-lg hover:shadow-emerald-500/5 ${className}`}
    >
      <div className="flex flex-1 flex-col">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {item.category}
        </p>
        <p className="mt-1 font-medium text-zinc-100">{item.name}</p>
        {item.badge ? (
          <span className="mt-2 w-fit rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
            {item.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-lg font-semibold text-emerald-400">
          ${item.price.toFixed(2)}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAdd?.(item)}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 transition-transform duration-200 hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
          Add
        </button>
      </div>
    </div>
  );
}
