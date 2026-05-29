"use client";

import { normalizeAccessControl } from "@/config/accessControlConfig";
import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { useEffect, useState } from "react";

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 1000;

/** Invalidate cached access-control matrix (call after Settings save). */
export function invalidateAccessControlCache() {
  _cache = null;
  _cacheTime = 0;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("access-control-updated"));
  }
}

export function useAccessControlSettings() {
  const [accessControl, setAccessControl] = useState(EMPTY_SETTINGS.accessControl);

  useEffect(() => {
    let mounted = true;

    async function loadAccessControl() {
      if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
        setAccessControl(_cache);
        return;
      }
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!mounted || !data?.success) return;
        const next = normalizeAccessControl(data.settings?.accessControl);
        _cache = next;
        _cacheTime = Date.now();
        setAccessControl(next);
      } catch {
        if (!mounted) return;
        setAccessControl(normalizeAccessControl());
      }
    }

    loadAccessControl();

    const onUpdate = () => { loadAccessControl(); };
    window.addEventListener("access-control-updated", onUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("access-control-updated", onUpdate);
    };
  }, []);

  return accessControl;
}
