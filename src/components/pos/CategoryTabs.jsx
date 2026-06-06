"use client";

export default function CategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <div className="min-w-0 overflow-x-auto bg-transparent pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--admin-scrollbar-thumb)]">
      <div className="flex min-w-max gap-2 bg-transparent">
        {categories.map((category) => {
          const active = activeCategory === category.name;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.name)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-ra-primary text-zinc-950 shadow-ra-primary-glow"
                  : "border admin-shell-border bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] shadow-sm hover:bg-[var(--admin-hover)]"
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
