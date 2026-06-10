"use client";

import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import {
  RESTAURANT_CMS_UPDATED,
  notifyRestaurantCmsUpdated,
} from "@/lib/restaurantIdentityEvents";
import { useEffect, useState } from "react";

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 1000;

export function useRestaurantCms() {
  const [content, setContent] = useState(_cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!_cache);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onUpdated = () => setRefreshKey((k) => k + 1);
    window.addEventListener(RESTAURANT_CMS_UPDATED, onUpdated);
    return () => window.removeEventListener(RESTAURANT_CMS_UPDATED, onUpdated);
  }, []);

  useEffect(() => {
    if (refreshKey === 0 && _cache && Date.now() - _cacheTime < CACHE_TTL) {
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
  }, [refreshKey]);

  return { content, loading };
}

export function invalidateRestaurantCmsCache() {
  _cache = null;
  _cacheTime = 0;
  notifyRestaurantCmsUpdated();
}

export { getActiveBanners } from "@/lib/restaurantCmsDefaults";
