"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { useModuleData } from "@/context/ModuleDataContext";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const CATEGORIES = {
  order:    { label: "Order",    color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  customer: { label: "Customer", color: "text-amber-400",   bg: "bg-amber-500/10"   },
  menu:     { label: "Menu",     color: "text-ra-primary", bg: "bg-ra-primary-10" },
  staff:    { label: "Staff",    color: "text-sky-400",     bg: "bg-sky-500/10"     },
};

const DEBOUNCE_MS = 200;
const MAX_HITS = 8;
/** Cap scans per category so huge tenants do not freeze the main thread. */
const MAX_SCAN_PER_BUCKET = 400;

export default function GlobalSearch() {
  const { orderRows, customerRows, menuItems, staffRows } = useModuleData();
  const [query, setQuery]   = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen]     = useState(false);
  const inputRef            = useRef(null);
  const containerRef        = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  /* Keyboard shortcut: Ctrl+K or Cmd+K */
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
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Close on outside click */
  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const results = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q || q.length < 2) return [];

    const hits = [];

    const orders = orderRows ?? [];
    for (let i = 0; i < orders.length && i < MAX_SCAN_PER_BUCKET && hits.length < MAX_HITS; i++) {
      const o = orders[i];
      if (
        o.orderId?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        o.table?.toLowerCase().includes(q)
      ) {
        hits.push({
          type: "order",
          id: o.id ?? o.orderId,
          title: o.orderId ?? o.id,
          sub: `${o.customer} · ${o.type ?? o.orderType ?? ""}`,
          href: "/orders",
        });
      }
    }

    const customers = customerRows ?? [];
    for (let i = 0; i < customers.length && i < MAX_SCAN_PER_BUCKET && hits.length < MAX_HITS; i++) {
      const c = customers[i];
      if (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      ) {
        hits.push({
          type: "customer",
          id: c.id,
          title: c.name,
          sub: c.email ?? c.phone ?? "",
          href: `/customers/${c.id}`,
        });
      }
    }

    const menu = menuItems ?? [];
    for (let i = 0; i < menu.length && i < MAX_SCAN_PER_BUCKET && hits.length < MAX_HITS; i++) {
      const m = menu[i];
      if (
        m.name?.toLowerCase().includes(q) ||
        m.categoryName?.toLowerCase().includes(q)
      ) {
        hits.push({
          type: "menu",
          id: m.id,
          title: m.name,
          sub: `${m.categoryName ?? ""} · $${m.price}`,
          href: "/menu/items",
        });
      }
    }

    const staff = staffRows ?? [];
    for (let i = 0; i < staff.length && i < MAX_SCAN_PER_BUCKET && hits.length < MAX_HITS; i++) {
      const s = staff[i];
      if (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.role?.toLowerCase().includes(q)
      ) {
        hits.push({
          type: "staff",
          id: s.id,
          title: s.name,
          sub: `${s.role} · ${s.email ?? ""}`,
          href: "/staff",
        });
      }
    }

    return hits;
  }, [debouncedQuery, orderRows, customerRows, menuItems, staffRows]);

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="admin-search-wrap relative flex items-center">
        <Search className="admin-search-icon" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (Ctrl+K)"
          className={`${adminSurface.searchCompact} focus-ra-primary pr-9`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setDebouncedQuery(""); setOpen(false); }}
            className={`absolute right-2.5 top-1/2 z-10 -translate-y-1/2 ${adminSurface.muted} transition-opacity hover:opacity-80`}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results dropdown */}
      {open && query.trim().length >= 2 && (
        <div className={`absolute right-0 top-full z-50 mt-2 w-80 ${adminSurface.dropdown}`}>
          {debouncedQuery !== query.trim() ? (
            <div className={`px-4 py-6 text-center text-sm ${adminSurface.muted}`}>Searching…</div>
          ) : results.length === 0 ? (
            <div className={`px-4 py-6 text-center text-sm ${adminSurface.faint}`}>
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            <ul className="py-1.5">
              {results.map((r) => {
                const cat = CATEGORIES[r.type] ?? CATEGORIES.menu;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <Link
                      href={r.href}
                      onClick={() => { setOpen(false); setQuery(""); setDebouncedQuery(""); }}
                      className={`flex items-center gap-3 px-3 py-2.5 ${adminSurface.rowHover}`}
                    >
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                        {cat.label[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${adminSurface.title}`}>{r.title}</p>
                        <p className={`truncate text-xs ${adminSurface.muted}`}>{r.sub}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={`border-t admin-shell-border px-3 py-2 text-[10px] ${adminSurface.faint}`}>
            {results.length} result{results.length !== 1 ? "s" : ""} · Press Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
