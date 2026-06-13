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

import { BHOJDESK_BRAND, BHOJDESK_LOGOS } from "@/config/bhojdeskBrand";
import { resolveCustomerSiteName } from "@/lib/resolveBrandLogos";
import {
  RESTAURANT_IDENTITY_UPDATED,
  notifyRestaurantIdentityUpdated,
} from "@/lib/restaurantIdentityEvents";
import { useEffect, useState } from "react";

const DEFAULT_INFO = {
  name: resolveCustomerSiteName(""),
  address: "",
  phone: "",
  email: BHOJDESK_BRAND.supportEmail,
  googleMapsLink: "",
  logoUrl: BHOJDESK_LOGOS.horizontalLight,
  slug: null,
  currency: "USD",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  timezone: "UTC",
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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onUpdated = () => setRefreshKey((k) => k + 1);
    window.addEventListener(RESTAURANT_IDENTITY_UPDATED, onUpdated);
    return () => window.removeEventListener(RESTAURANT_IDENTITY_UPDATED, onUpdated);
  }, []);

  useEffect(() => {
    if (refreshKey === 0 && _cache && Date.now() - _cacheTime < CACHE_TTL) {
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
  }, [refreshKey]);

  return { info, loading };
}

/** Cache invalidate karo (e.g. settings save hone ke baad) */
export function invalidateRestaurantInfoCache() {
  _cache = null;
  _cacheTime = 0;
  notifyRestaurantIdentityUpdated();
}
