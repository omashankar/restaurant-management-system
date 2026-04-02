"use client";

/**
 * Horizontal scrollable category chips (POS-style).
 * @param {{ id: string; name: string }[]} categories
 * @param {"all" | string} activeCategoryId
 * @param {(id: "all" | string) => void} onChange
 */
export default function CategoryTabs({
  categories,
  activeCategoryId,
  onChange,
}) {
  return (
    <div className="relative">
      <div
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700"
        role="tablist"
        aria-label="Filter by category"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryId === "all"}
          onClick={() => onChange("all")}
          className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out ${
            activeCategoryId === "all"
              ? "scale-[1.02] bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25"
              : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          All
        </button>
        {categories.map((c) => {
          const active = activeCategoryId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(c.id)}
              className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out ${
                active
                  ? "scale-[1.02] bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
