"use client";

export default function PaymentSettingsSidebar({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="flex flex-row flex-wrap gap-1 lg:flex-col lg:gap-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
