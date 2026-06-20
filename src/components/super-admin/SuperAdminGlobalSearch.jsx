"use client";

import { matchSuperAdminNavLinks } from "@/config/superAdminNavigation";
import { adminHeaderDropdownPortal, adminSurface } from "@/config/adminSurfaceClasses";
import { useAnchoredPortalPosition } from "@/hooks/useAnchoredPortalPosition";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEBOUNCE_MS = 250;
const MAX_HITS = 12;

const CATEGORIES = {
  page:       { label: "Page",       color: "text-sa-accent",  bg: "bg-sa-primary-10" },
  restaurant: { label: "Restaurant", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  admin:      { label: "Admin",      color: "text-amber-400",  bg: "bg-amber-500/10" },
  payment:    { label: "Payment",    color: "text-violet-400", bg: "bg-violet-500/10" },
  contact:    { label: "Contact",    color: "text-sky-400",    bg: "bg-sky-500/10" },
  ticket:     { label: "Ticket",     color: "text-rose-400",   bg: "bg-rose-500/10" },
};

export default function SuperAdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef = useRef(null);

  const trimmed = query.trim();
  const showResults = open && trimmed.length >= 2;
  const resultsPosition = useAnchoredPortalPosition(showResults, containerRef);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmed]);

  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setDebouncedQuery("");
        setApiResults([]);
        setFetchError("");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    function handler(e) {
      const target = e.target;
      if (containerRef.current?.contains(target)) return;
      if (target.closest?.("[data-sa-global-search-panel]")) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setApiResults([]);
      setFetchError("");
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError("");

    (async () => {
      try {
        const params = new URLSearchParams({ q: debouncedQuery });
        const res = await fetch(`/api/super-admin/search?${params}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok || !data.success) {
          setApiResults([]);
          setFetchError(data.error ?? "Search failed.");
          return;
        }
        setApiResults(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setApiResults([]);
        setFetchError("Network error. Try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  const pageResults = useMemo(
    () => matchSuperAdminNavLinks(debouncedQuery, 4),
    [debouncedQuery],
  );

  const results = useMemo(() => {
    const seen = new Set();
    const merged = [];

    for (const item of [...pageResults, ...apiResults]) {
      const key = `${item.type}-${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length >= MAX_HITS) break;
    }

    return merged;
  }, [pageResults, apiResults]);

  const isPending = debouncedQuery !== trimmed || loading;
  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setApiResults([]);
    setFetchError("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="admin-search-wrap relative flex items-center">
        <Search className="admin-search-icon" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (Ctrl+K)"
          aria-label="Search platform"
          autoComplete="off"
          className={`max-w-[9rem] md:max-w-[12rem] xl:max-w-[16rem] ${adminSurface.searchCompact} focus-sa-primary pr-9`}
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className={`absolute right-2.5 top-1/2 z-10 -translate-y-1/2 ${adminSurface.muted} transition-opacity hover:opacity-80`}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {showResults && resultsPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              data-sa-global-search-panel=""
              data-admin-header-dropdown=""
              className={adminHeaderDropdownPortal}
              style={{ top: resultsPosition.top, right: resultsPosition.right }}
            >
              <div className={`w-[min(22rem,calc(100vw-2rem))] ${adminSurface.dropdown}`}>
                {isPending ? (
                  <div className={`px-4 py-6 text-center text-sm ${adminSurface.muted}`}>Searching…</div>
                ) : fetchError && results.length === 0 ? (
                  <div className={`px-4 py-6 text-center text-sm text-red-400`} role="alert">
                    {fetchError}
                  </div>
                ) : results.length === 0 ? (
                  <div className={`px-4 py-6 text-center text-sm ${adminSurface.faint}`}>
                    No results for &ldquo;{debouncedQuery}&rdquo;
                  </div>
                ) : (
                  <ul className="max-h-[min(20rem,60vh)] overflow-y-auto py-1.5">
                    {results.map((r) => {
                      const cat = CATEGORIES[r.type] ?? CATEGORIES.page;
                      return (
                        <li key={`${r.type}-${r.id}`}>
                          <Link
                            href={r.href}
                            onClick={clearSearch}
                            className={`flex items-center gap-3 px-3 py-2.5 ${adminSurface.rowHover}`}
                          >
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${cat.bg} ${cat.color}`}
                            >
                              {cat.label[0]}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-medium ${adminSurface.title}`}>{r.title}</p>
                              <p className={`truncate text-xs ${adminSurface.muted}`}>{r.sub}</p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${cat.bg} ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className={`border-t admin-shell-border px-3 py-2 text-[10px] ${adminSurface.faint}`}>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                  {fetchError ? " · Some results unavailable" : ""}
                  {" · Press Esc to close"}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
