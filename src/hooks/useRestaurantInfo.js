/**
 * useRestaurantInfo
 *
 * Restaurant ka public info fetch karta hai — name, address, phone, hours etc.
 * Cookie se slug automatically detect hota hai.
 * Result 5 min ke liye cache hota hai.
 *
 * Usage:
 *   const { info, loading } = useRestaurantInfo();
 *   <h1>{info.name}</h1>
 */

"use client";

import { useEffect, useState } from "react";

const DEFAULT_INFO = {
  name: "RMS Restaurant",
  address: "123 Restaurant St, Food City",
  phone: "+1 (555) 123-4567",
  email: "hello@rmsrestaurant.com",
  googleMapsLink: "",
  logoUrl: null,
  slug: null,
  currency: "USD",
  openingHours: [],
  isOpenToday: true,
  todayLabel: "11:00 – 22:00",
  hoursSummary: "Mon–Sun: 11:00 AM – 10:00 PM",
};

// Module-level cache — shared across all hook instances
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Keep customer API calls on the same restaurant as /r/[slug] routes. */
function syncRestaurantSlugCookie(slug) {
  if (typeof document === "undefined" || !slug) return;
  const current = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("x-restaurant-slug="))
    ?.split("=")[1];
  if (current === slug) return;
  document.cookie = `x-restaurant-slug=${encodeURIComponent(slug)}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
}

export function useRestaurantInfo() {
  const [info, setInfo] = useState(_cache ?? DEFAULT_INFO);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    // Use cache if fresh
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
      setInfo(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/customer/restaurant-info", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.info) {
          _cache = { ...DEFAULT_INFO, ...data.info };
          _cacheTime = Date.now();
          if (_cache.slug) syncRestaurantSlugCookie(_cache.slug);
          setInfo(_cache);
        }
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { info, loading };
}

/** Cache invalidate karo (e.g. settings save hone ke baad) */
export function invalidateRestaurantInfoCache() {
  _cache = null;
  _cacheTime = 0;
}
