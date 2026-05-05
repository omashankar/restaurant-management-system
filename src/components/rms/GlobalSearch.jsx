"use client";

import { useModuleData } from "@/context/ModuleDataContext";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const CATEGORIES = {
  order:    { label: "Order",    color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  customer: { label: "Customer", color: "text-amber-400",   bg: "bg-amber-500/10"   },
  menu:     { label: "Menu",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
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
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (Ctrl+K)"
          className="h-9 w-48 rounded-xl border border-zinc-800 bg-zinc-900/70 pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40 focus:w-64 transition-all duration-200"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setDebouncedQuery(""); setOpen(false); }}
            className="absolute right-2.5 text-zinc-500 hover:text-zinc-300"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
          {debouncedQuery !== query.trim() ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-600">
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
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-zinc-800/60"
                    >
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                        {cat.label[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">{r.title}</p>
                        <p className="truncate text-xs text-zinc-500">{r.sub}</p>
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
          <div className="border-t border-zinc-800 px-3 py-2 text-[10px] text-zinc-700">
            {results.length} result{results.length !== 1 ? "s" : ""} · Press Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
