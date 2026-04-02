"use client";

import { Search } from "lucide-react";

export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filterSlot,
  endSlot,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-[200px] max-w-md flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filterSlot}
        {endSlot}
      </div>
    </div>
  );
}
