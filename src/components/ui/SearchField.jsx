"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { Search, X } from "lucide-react";
import { forwardRef } from "react";

/**
 * Admin search input — icon + text spacing via .admin-search-wrap / .admin-search-input (theme CSS).
 */
const SearchField = forwardRef(function SearchField(
  {
    value,
    onChange,
    placeholder = "Search…",
    className = "",
    inputClassName = "",
    compact = false,
    clearable = false,
    onClear,
    type = "text",
    id,
    ...inputProps
  },
  ref
) {
  const inputBase = compact ? adminSurface.searchCompact : adminSurface.searchInput;

  function handleClear() {
    if (onClear) onClear();
    else if (onChange) {
      onChange({ target: { value: "" } });
    }
  }

  return (
    <div className={`admin-search-wrap relative ${className}`}>
      <Search className="admin-search-icon" strokeWidth={2} aria-hidden />
      <input
        ref={ref}
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputBase} w-full ${clearable ? "pr-10" : ""} ${inputClassName}`}
        {...inputProps}
      />
      {clearable && value ? (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute right-2.5 top-1/2 z-10 -translate-y-1/2 ${adminSurface.muted} transition-opacity hover:opacity-80`}
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
});

export default SearchField;
