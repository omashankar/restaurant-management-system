"use client";

/**
 * IconPicker — full lucide-react library picker
 *
 * Props:
 *   value    {string}                   — selected icon name (e.g. "CreditCard")
 *   onChange {(name: string) => void}   — called on selection
 *   label    {string}                   — optional field label (pass null to hide)
 */

import { adminSurface } from "@/config/adminSurfaceClasses";
import * as Icons from "lucide-react";
import { createElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────────────────────
   Build the full icon list once at module
   level — filter out non-component exports
   and the *Icon alias duplicates.
───────────────────────────────────────── */
const ALL_ICON_NAMES = Object.keys(Icons).filter(
  (k) =>
    /^[A-Z]/.test(k) &&
    !k.endsWith("Icon") &&
    typeof Icons[k] === "object" &&   // lucide icons are forwardRef objects, not functions
    Icons[k] !== null &&
    typeof Icons[k].displayName === "string"
);

const PAGE_SIZE = 96; // icons rendered per "page"

/** Resolve name → component. Falls back to Circle. */
function getIcon(name) {
  return Icons[name] ?? Icons["Circle"];
}

function renderIcon(name, className) {
  const IconRef = getIcon(name);
  return createElement(IconRef, { className });
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function IconPicker({ value, onChange, label = "Icon" }) {
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const dropdownRef             = useRef(null);
  const searchRef               = useRef(null);
  const gridRef                 = useRef(null);

  /* Filter icons by search term */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  /* Visible slice — grows as user scrolls */
  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  /* Reset page when search changes */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  /* Auto-focus search when dropdown opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30);
      // Scroll selected icon into view
      if (value) {
        setTimeout(() => {
          gridRef.current
            ?.querySelector("[data-selected='true']")
            ?.scrollIntoView({ block: "nearest" });
        }, 60);
      }
    }
  }, [open, value]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!dropdownRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Infinite scroll — load next page when near bottom */
  function handleGridScroll(e) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
      setPage((p) => p + 1);
    }
  }

  const hasMore = visible.length < filtered.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className={`mb-1.5 block ${adminSurface.label}`}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${adminSurface.input} flex w-full items-center gap-2.5 focus:border-indigo-500`}
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
          {renderIcon(value, "size-4")}
        </span>
        <span className={`flex-1 text-left ${adminSurface.body}`}>
          {value || <span className={adminSurface.muted}>Select icon…</span>}
        </span>
        <svg
          className={`size-4 shrink-0 ${adminSurface.muted} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 mt-2 w-full min-w-[320px] ${adminSurface.dropdown}`}>

          {/* Search bar */}
          <div className="p-3 pb-2">
            <div className="admin-search-wrap relative">
              <Icons.Search className="admin-search-icon !size-3.5 !left-3" strokeWidth={2} aria-hidden />
              <input
                ref={searchRef}
                type="text"
                placeholder={`Search ${ALL_ICON_NAMES.length.toLocaleString()} icons…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${adminSurface.searchInput} py-2 pr-3 focus:border-indigo-500`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${adminSurface.muted} hover:text-[var(--admin-text)]`}
                >
                  <Icons.X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Result count */}
            <p className={`mt-1.5 text-[10px] ${adminSurface.faint}`}>
              {filtered.length === ALL_ICON_NAMES.length
                ? `${ALL_ICON_NAMES.length.toLocaleString()} icons`
                : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              {hasMore && ` · showing ${visible.length}`}
            </p>
          </div>

          {/* Icon grid */}
          <div
            ref={gridRef}
            onScroll={handleGridScroll}
            className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto px-3 pb-3 sm:grid-cols-8"
          >
            {filtered.length === 0 && (
              <div className={`col-span-8 py-8 text-center text-xs ${adminSurface.muted}`}>
                No icons match &ldquo;{search}&rdquo;
              </div>
            )}

            {visible.map((name) => {
              const Icon = getIcon(name);
              const isSelected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`group flex flex-col items-center gap-1 rounded-xl p-2 transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                      : `${adminSurface.muted} hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]`
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="w-full truncate text-center text-[8px] leading-none opacity-60 group-hover:opacity-100">
                    {name}
                  </span>
                </button>
              );
            })}

            {/* Load-more sentinel */}
            {hasMore && (
              <div className="col-span-8 py-2 text-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className={`text-xs ${adminSurface.faint} hover:text-[var(--admin-text-muted)]`}
                >
                  Load more ({filtered.length - visible.length} remaining)
                </button>
              </div>
            )}
          </div>

          {/* Selected preview footer */}
          {value && (
            <div className={`flex items-center gap-2 border-t admin-shell-border px-3 py-2.5`}>
              <span className="inline-flex size-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                {renderIcon(value, "size-3.5")}
              </span>
              <span className={`text-xs ${adminSurface.muted}`}>
                Selected: <span className={`font-medium ${adminSurface.body}`}>{value}</span>
              </span>
              <button
                type="button"
                onClick={() => { onChange(""); }}
                className={`ml-auto text-[10px] ${adminSurface.faint} hover:text-[var(--admin-text-muted)]`}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
