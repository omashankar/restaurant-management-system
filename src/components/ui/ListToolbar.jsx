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
        className="min-w-0 w-full flex-1 sm:max-w-md"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        inputClassName="focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"
      />
      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
        {filterSlot}
        {endSlot}
      </div>
    </div>
  );
}
