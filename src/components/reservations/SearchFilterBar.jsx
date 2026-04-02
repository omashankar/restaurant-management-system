"use client";

import { CalendarRange, LayoutGrid, List, Search } from "lucide-react";

/**
 * @param {{
 *   search: string;
 *   onSearchChange: (v: string) => void;
 *   dateFilter: string;
 *   onDateChange: (v: string) => void;
 *   statusFilter: string;
 *   onStatusChange: (v: string) => void;
 *   viewMode: 'table' | 'calendar';
 *   onViewModeChange: (v: 'table'|'calendar') => void;
 * }} props
 */
export default function SearchFilterBar({
  search,
  onSearchChange,
  dateFilter,
  onDateChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="relative min-w-[200px] max-w-md flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name or phone…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 py-1">
          <CalendarRange className="ml-1 size-4 text-zinc-500" aria-hidden />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg bg-transparent py-1.5 pr-2 text-sm text-zinc-200 outline-none [color-scheme:dark]"
            aria-label="Filter by date"
          />
          <button
            type="button"
            onClick={() => onDateChange("")}
            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            All dates
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/40"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex rounded-xl border border-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
              viewMode === "table"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            aria-pressed={viewMode === "table"}
          >
            <List className="size-3.5" aria-hidden />
            List
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
              viewMode === "calendar"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            aria-pressed={viewMode === "calendar"}
          >
            <LayoutGrid className="size-3.5" aria-hidden />
            By date
          </button>
        </div>
      </div>
    </div>
  );
}
