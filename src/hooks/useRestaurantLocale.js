"use client";

import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import {
  createLocaleFormatters,
  DEFAULT_LOCALE_PREFS,
  normalizeLocalePrefs,
} from "@/lib/localeFormat";
import { useEffect, useMemo, useState } from "react";

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT_FORMATTERS = createLocaleFormatters(DEFAULT_LOCALE_PREFS);

function prefsFromGeneral(general = {}) {
  return normalizeLocalePrefs({
    dateFormat: general.dateFormat,
    timeFormat: general.timeFormat,
    timezone: general.timezone,
  });
}

/**
 * Restaurant admin locale preferences from /api/settings → general.
 */
export function useRestaurantLocale({ enabled = true } = {}) {
  const [prefs, setPrefs] = useState(cache ?? DEFAULT_LOCALE_PREFS);
  const [loading, setLoading] = useState(enabled && !cache);

  useEffect(() => {
    if (!enabled) return;

    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      setPrefs(cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const next = prefsFromGeneral(data?.settings?.general ?? EMPTY_SETTINGS.general);
        cache = next;
        cacheTime = Date.now();
        setPrefs(next);
      })
      .catch(() => {
        if (!cancelled) setPrefs(DEFAULT_LOCALE_PREFS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return useMemo(() => {
    const formatters = createLocaleFormatters(prefs);
    return { ...formatters, prefs, loading };
  }, [prefs, loading]);
}

export function invalidateRestaurantLocaleCache() {
  cache = null;
  cacheTime = 0;
}

export function primeRestaurantLocaleCache(general) {
  cache = prefsFromGeneral(general);
  cacheTime = Date.now();
}

export function getDefaultRestaurantLocaleFormatters() {
  return DEFAULT_FORMATTERS;
}
