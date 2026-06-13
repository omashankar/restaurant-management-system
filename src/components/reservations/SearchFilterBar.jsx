"use client";

import ListToolbar from "@/components/ui/ListToolbar";
import { raFilterSelectCls } from "@/config/restaurantAdminTheme";
import { CalendarRange, LayoutGrid, List } from "lucide-react";

const viewBtnBase =
  "flex min-h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color] sm:px-3";

function ViewModeToggle({ viewMode, onViewModeChange }) {
  return (
    <div
      className="admin-surface-segment-track inline-flex w-full shrink-0 p-0.5 sm:w-auto"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onViewModeChange("table")}
        className={`${viewBtnBase} flex-1 sm:flex-none ${
          viewMode === "table"
            ? "bg-ra-primary text-zinc-950"
            : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
        }`}
        aria-pressed={viewMode === "table"}
        aria-label="List view"
        title="List view"
      >
        <List className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">List</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("calendar")}
        className={`${viewBtnBase} flex-1 sm:flex-none ${
          viewMode === "calendar"
            ? "bg-ra-primary text-zinc-950"
            : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
        }`}
        aria-pressed={viewMode === "calendar"}
        aria-label="By date view"
        title="By date view"
      >
        <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">By date</span>
      </button>
    </div>
  );
}

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
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search name or phone…"
      filterSlot={
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
          <div className="focus-within-ra-primary flex min-w-0 w-full shrink-0 items-center gap-2 rounded-xl border box-border admin-shell-border bg-[var(--admin-control)] px-2 py-1 sm:w-auto sm:max-w-full">
            <CalendarRange className="ml-0.5 size-4 shrink-0 admin-surface-muted" aria-hidden />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border-0 bg-transparent py-1.5 pr-1 text-sm admin-shell-text outline-none focus:ring-0 sm:min-w-[8.5rem] sm:flex-none"
              aria-label="Filter by date"
            />
            <button
              type="button"
              onClick={() => onDateChange("")}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium admin-surface-muted transition-colors hover:bg-[var(--admin-hover)] hover:admin-surface-body"
            >
              All dates
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`${raFilterSelectCls} w-full shrink-0 sm:w-auto`}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {areaOptions.length > 0 && onAreaChange ? (
            <select
              value={areaFilter}
              onChange={(e) => onAreaChange(e.target.value)}
              className={`${raFilterSelectCls} w-full shrink-0 sm:w-auto`}
              aria-label="Filter by area"
            >
              <option value="all">All areas</option>
              {areaOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      }
      endSlot={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />}
    />
  );
}
