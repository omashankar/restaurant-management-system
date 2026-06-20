"use client";

import { useEffect } from "react";

const DEFAULT_PARAM_NAMES = ["search", "q"];

/** Prefill a page filter from `?search=` or `?q=` when opened from global search. */
export function useHydrateSearchFromUrl(setSearch, paramNames = DEFAULT_PARAM_NAMES) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    for (const name of paramNames) {
      const value = params.get(name)?.trim();
      if (value) {
        setSearch(value);
        return;
      }
    }
  }, [setSearch, paramNames]);
}
