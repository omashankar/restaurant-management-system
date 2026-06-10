"use client";

import {
  RESTAURANT_IDENTITY_UPDATED,
  notifyRestaurantIdentityUpdated,
} from "@/lib/restaurantIdentityEvents";
import {
  resolveAdminPlatformBranding,
  resolveRestaurantAdminSidebarBranding,
} from "@/lib/resolveBrandLogos";
import { useEffect, useState } from "react";

const DEFAULTS = { name: "", logoUrl: "" };

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Restaurant settings (tenant) + admin sidebar branding.
 * Restaurant Admin shows tenant name/logo when set; BhojDesk is the fallback.
 */
export function useRestaurantBranding() {
  const [branding, setBranding] = useState(_cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!_cache);
  const [refreshKey, setRefreshKey] = useState(0);

  const platform = resolveAdminPlatformBranding();
  const admin = resolveRestaurantAdminSidebarBranding({
    restaurantName: branding.name,
    restaurantLogoUrl: branding.logoUrl,
  });

  useEffect(() => {
    const onUpdated = () => setRefreshKey((k) => k + 1);
    window.addEventListener(RESTAURANT_IDENTITY_UPDATED, onUpdated);
    return () => window.removeEventListener(RESTAURANT_IDENTITY_UPDATED, onUpdated);
  }, []);

  useEffect(() => {
    if (refreshKey === 0 && _cache && Date.now() - _cacheTime < CACHE_TTL) {
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
  }, [refreshKey]);

  return {
    branding,
    loading,
    /** Raw tenant values from Settings → General */
    restaurantName: branding.name,
    restaurantLogoUrl: branding.logoUrl,
    /** Admin sidebar / top bar — tenant when set, else BhojDesk */
    name: admin.name,
    tagline: admin.tagline,
    sidebarLogoUrl: admin.sidebarLogoUrl,
    logoUrl: admin.sidebarLogoUrl,
    fullLogoUrl: platform.fullLogoUrl,
    hasCustomName: admin.hasCustomName,
    hasCustomLogo: admin.hasCustomLogo,
  };
}

export function invalidateRestaurantBrandingCache() {
  _cache = null;
  _cacheTime = 0;
  notifyRestaurantIdentityUpdated();
}
