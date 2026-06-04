import { Plus } from "lucide-react";

export default function MenuItemCard({ item, onAdd, disabled, className = "" }) {
  return (
    <div
      className={`group flex flex-col admin-surface-card p-4 transition-all duration-200 hover-border-ra-primary-40 hover:shadow-lg hover:shadow-ra-primary-soft ${className}`}
    >
      <div className="flex flex-1 flex-col">
        <p className="admin-surface-label">
          {item.category}
        </p>
        <p className="mt-1 font-medium admin-shell-text">{item.name}</p>
        {item.badge ? (
          <span className="mt-2 w-fit rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ra-primary">
            {item.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-lg font-semibold text-ra-primary">
          ${item.price.toFixed(2)}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAdd?.(item)}
          className="inline-flex items-center gap-1 rounded-xl bg-ra-primary px-3 py-1.5 text-sm font-semibold text-zinc-950 transition-transform duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
          Add
        </button>
      </div>
    </div>
  );
}
