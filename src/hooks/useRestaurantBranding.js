"use client";

import { useEffect, useState } from "react";

const DEFAULTS = { name: "", logoUrl: "" };

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

/** Settings → General (name + logo) for admin UI */
export function useRestaurantBranding() {
  const [branding, setBranding] = useState(_cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
      setBranding(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.success) return;
        const general = data.settings?.general ?? {};
        _cache = {
          name: general.restaurantName?.trim() || "",
          logoUrl: general.logoUrl?.trim() || "",
        };
        _cacheTime = Date.now();
        setBranding(_cache);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const name = branding.name || "RMS";
  const tagline = branding.name ? "" : "Restaurant OS";

  return { branding, name, tagline, logoUrl: branding.logoUrl, loading };
}

export function invalidateRestaurantBrandingCache() {
  _cache = null;
  _cacheTime = 0;
}
