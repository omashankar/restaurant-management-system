"use client";

export default function CategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <div className="min-w-0 overflow-x-auto scroll-px-1 bg-transparent pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--admin-scrollbar-thumb)]">
      <div className="flex w-max min-w-full gap-2 bg-transparent sm:w-auto sm:min-w-0 sm:flex-wrap">
        {categories.map((category) => {
          const active = activeCategory === category.name;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.name)}
              className={`cursor-pointer box-border shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] ${
                active
                  ? "border-transparent bg-ra-primary text-zinc-950 shadow-ra-primary-glow"
                  : "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] shadow-sm hover:bg-[var(--admin-hover)]"
              }`}
              aria-pressed={active}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
