"use client";

/**
 * IconPicker — full lucide-react library picker
 *
 * Props:
 *   value    {string}                   — selected icon name (e.g. "CreditCard")
 *   onChange {(name: string) => void}   — called on selection
 *   label    {string}                   — optional field label (pass null to hide)
 */

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
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 transition-colors hover:border-zinc-600 focus:outline-none focus:border-indigo-500"
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
          {renderIcon(value, "size-4")}
        </span>
        <span className="flex-1 text-left text-zinc-200">
          {value || <span className="text-zinc-500">Select icon…</span>}
        </span>
        <svg
          className={`size-4 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[320px] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">

          {/* Search bar */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Icons.Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder={`Search ${ALL_ICON_NAMES.length.toLocaleString()} icons…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <Icons.X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Result count */}
            <p className="mt-1.5 text-[10px] text-zinc-600">
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
              <div className="col-span-8 py-8 text-center text-xs text-zinc-500">
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
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
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
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Load more ({filtered.length - visible.length} remaining)
                </button>
              </div>
            )}
          </div>

          {/* Selected preview footer */}
          {value && (
            <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2.5">
              <span className="inline-flex size-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                {renderIcon(value, "size-3.5")}
              </span>
              <span className="text-xs text-zinc-400">
                Selected: <span className="font-medium text-zinc-200">{value}</span>
              </span>
              <button
                type="button"
                onClick={() => { onChange(""); }}
                className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-400"
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
