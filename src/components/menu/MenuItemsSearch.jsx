"use client";

import SearchField from "@/components/ui/SearchField";

export default function MenuItemsSearch({ value, onChange, placeholder }) {
  return (
    <SearchField
      className="max-w-md flex-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search menu…"}
      inputClassName="focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"
    />
  );
}
