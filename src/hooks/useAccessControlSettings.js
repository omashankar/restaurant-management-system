"use client";

import { normalizeAccessControl } from "@/config/accessControlConfig";
import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { useEffect, useState } from "react";

export function useAccessControlSettings() {
  const [accessControl, setAccessControl] = useState(EMPTY_SETTINGS.accessControl);

  useEffect(() => {
    let mounted = true;

    async function loadAccessControl() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!mounted || !data?.success) return;
        setAccessControl(normalizeAccessControl(data.settings?.accessControl));
      } catch {
        if (!mounted) return;
        setAccessControl(normalizeAccessControl());
      }
    }

    loadAccessControl();
    return () => {
      mounted = false;
    };
  }, []);

  return accessControl;
}
