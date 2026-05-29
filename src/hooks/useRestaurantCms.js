"use client";

import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { useEffect, useState } from "react";

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 1000;

export function useRestaurantCms() {
  const [content, setContent] = useState(_cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
      setContent(_cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/customer/restaurant-cms", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.content) {
          _cache = data.content;
          _cacheTime = Date.now();
          setContent(_cache);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, loading };
}

export function invalidateRestaurantCmsCache() {
  _cache = null;
  _cacheTime = 0;
}

export { getActiveBanners } from "@/lib/restaurantCmsDefaults";
