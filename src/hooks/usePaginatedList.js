"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * @param {unknown[]} items
 * @param {{
 *   searchKeys: string[];
 *   pageSize?: number;
 *   filter?: (row: unknown) => boolean;
 *   resetKey?: string;
 * }} opts
 */
export function usePaginatedList(items, opts) {
  const { searchKeys, pageSize = 8, filter, resetKey = "" } = opts;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, resetKey]);

  const filtered = useMemo(() => {
    let out = items;
    if (filter) out = out.filter(filter);
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter((row) =>
        searchKeys.some((k) =>
          String(row[k] ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }
    return out;
  }, [items, search, searchKeys, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  const pageRows = useMemo(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize]
  );

  return {
    search,
    setSearch,
    page: safePage,
    setPage,
    pageRows,
    total: filtered.length,
    totalPages,
    pageSize,
  };
}
