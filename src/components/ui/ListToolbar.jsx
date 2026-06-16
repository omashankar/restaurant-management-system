"use client";

import SearchField from "@/components/ui/SearchField";

export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  searchInputProps = {},
  filterSlot,
  endSlot,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
      <SearchField
        className="min-w-0 w-full xl:max-w-md xl:shrink-0"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        inputClassName="focus-ra-primary"
        {...searchInputProps}
      />
      {filterSlot || endSlot ? (
        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:ml-auto xl:w-auto xl:flex-nowrap xl:justify-end">
          {filterSlot}
          {endSlot ? (
            <div className="w-full shrink-0 sm:ml-auto sm:w-auto xl:ml-2">{endSlot}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
