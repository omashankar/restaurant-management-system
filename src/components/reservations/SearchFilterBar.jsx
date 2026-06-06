"use client";

import SearchField from "@/components/ui/SearchField";
import { CalendarRange, LayoutGrid, List } from "lucide-react";

export default function SearchFilterBar({
  search,
  onSearchChange,
  dateFilter,
  onDateChange,
  statusFilter,
  onStatusChange,
  areaFilter = "all",
  onAreaChange,
  areaOptions = [],
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      {/* Search */}
      <SearchField
        className="min-w-0 w-full flex-1 lg:max-w-md"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search name or phone…"
        inputClassName="focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"
      />

      <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
        {/* Date */}
        <div className="flex min-w-0 w-full items-center gap-2 admin-surface-card px-2 py-1 sm:w-auto">
          <CalendarRange className="ml-1 size-4 shrink-0 admin-surface-muted" aria-hidden />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="min-w-0 flex-1 rounded-lg bg-transparent py-1.5 pr-2 text-sm admin-shell-text outline-none sm:flex-none"
            aria-label="Filter by date"
          />
          <button
            type="button"
            onClick={() => onDateChange("")}
            className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
          >
            All dates
          </button>
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full cursor-pointer admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary sm:w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Area filter — only shown when areas exist */}
        {areaOptions.length > 0 && onAreaChange && (
          <select
            value={areaFilter}
            onChange={(e) => onAreaChange(e.target.value)}
            className="w-full cursor-pointer admin-surface-card px-3 py-2.5 text-sm admin-shell-text outline-none focus-ra-primary sm:w-auto"
            aria-label="Filter by area"
          >
            <option value="all">All areas</option>
            {areaOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}

        {/* View toggle */}
        <div className="admin-surface-segment-track flex w-full p-0.5 sm:w-auto">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:flex-none ${
              viewMode === "table"
                ? "bg-ra-primary text-zinc-950"
                : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
            }`}
            aria-pressed={viewMode === "table"}
          >
            <List className="size-3.5" aria-hidden /> List
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:flex-none ${
              viewMode === "calendar"
                ? "bg-ra-primary text-zinc-950"
                : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
            }`}
            aria-pressed={viewMode === "calendar"}
          >
            <LayoutGrid className="size-3.5" aria-hidden /> By date
          </button>
        </div>
      </div>
    </div>
  );
}
