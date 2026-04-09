"use client";

export default function SettingsSidebar({ tabs, activeTab, onTabChange }) {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Settings Menu
      </p>
      <nav className="space-y-1.5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`cursor-pointer w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
