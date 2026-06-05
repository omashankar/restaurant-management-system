"use client";

import SearchField from "@/components/ui/SearchField";

export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filterSlot,
  endSlot,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchField
        className="min-w-[200px] max-w-md flex-1"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        inputClassName="focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"
      />
      <div className="flex flex-wrap items-center gap-2">
        {filterSlot}
        {endSlot}
      </div>
    </div>
  );
}
