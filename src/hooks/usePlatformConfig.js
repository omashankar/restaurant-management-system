"use client";

import { useEffect, useState } from "react";

const DEFAULT_CONFIG = {
  maintenanceMode: false,
  appName: "RMS Platform",
  features: {
    featureMenuQR: true,
    featureOnlineOrder: true,
    featureReservations: true,
    featureInventory: true,
  },
  currency: "INR",
  language: "en",
  theme: { primaryColor: "#f43f5e", accentColor: "#10b981", darkMode: true },
  integrations: { googleAnalyticsId: "", metaPixelId: "" },
};

let _cache = null;
let _cacheTime = 0;
const TTL = 60_000;

export function invalidatePlatformConfigCache() {
  _cache = null;
  _cacheTime = 0;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("platform-config-updated"));
  }
}

export function usePlatformConfig() {
  const [config, setConfig] = useState(_cache ?? DEFAULT_CONFIG);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (_cache && Date.now() - _cacheTime < TTL) {
        setConfig(_cache);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/platform/config");
        const data = await res.json();
        if (!mounted) return;
        const next = {
          ...DEFAULT_CONFIG,
          ...data,
          features: { ...DEFAULT_CONFIG.features, ...(data.features ?? {}) },
          theme: { ...DEFAULT_CONFIG.theme, ...(data.theme ?? {}) },
        };
        _cache = next;
        _cacheTime = Date.now();
        setConfig(next);
      } catch {
        if (mounted) setConfig(DEFAULT_CONFIG);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const onUpdate = () => load();
    window.addEventListener("platform-config-updated", onUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("platform-config-updated", onUpdate);
    };
  }, []);

  return { config, loading, features: config.features ?? DEFAULT_CONFIG.features };
}
