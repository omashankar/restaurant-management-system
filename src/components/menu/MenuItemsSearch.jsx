"use client";

import { Search } from "lucide-react";

export default function MenuItemsSearch({ value, onChange, placeholder }) {
  return (
    <div className="relative max-w-md flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search menu…"}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-emerald-500/45 focus:ring-2 focus:ring-emerald-500/15"
      />
    </div>
  );
}
