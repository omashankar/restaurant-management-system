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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchField
        className="min-w-0 w-full lg:max-w-md lg:shrink-0"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        inputClassName="focus-ra-primary"
      />
      {filterSlot || endSlot ? (
        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto lg:flex-nowrap lg:justify-end">
          {filterSlot}
          {endSlot}
        </div>
      ) : null}
    </div>
  );
}
