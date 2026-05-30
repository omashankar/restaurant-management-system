"use client";

export default function CategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <div className="overflow-x-auto pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700">
      <div className="flex min-w-max gap-2">
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
                  : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"
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
