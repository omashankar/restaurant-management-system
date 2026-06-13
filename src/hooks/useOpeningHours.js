"use client";

import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { sanitizeOpeningHoursSchedule } from "@/lib/reservationUtils";
import { useEffect, useState } from "react";

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Restaurant opening hours for admin (Reservations, etc.) — from /api/settings.
 */
export function useOpeningHours({ enabled = true, revision = 0 } = {}) {
  const [openingHours, setOpeningHours] = useState(cache ?? EMPTY_SETTINGS.openingHours);
  const [loading, setLoading] = useState(enabled && !cache);

  useEffect(() => {
    if (!enabled) return;

    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      setOpeningHours(cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const hours = sanitizeOpeningHoursSchedule(
          Array.isArray(data?.settings?.openingHours)
            ? data.settings.openingHours
            : EMPTY_SETTINGS.openingHours,
        );
        cache = hours;
        cacheTime = Date.now();
        setOpeningHours(hours);
      })
      .catch(() => {
        if (!cancelled) setOpeningHours(EMPTY_SETTINGS.openingHours);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, revision]);

  return { openingHours, loading };
}

export function invalidateOpeningHoursCache() {
  cache = null;
  cacheTime = 0;
}
