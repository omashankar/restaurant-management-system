"use client";

import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useEffect } from "react";

const LS_KEY = "rms-language";

/** Apply platform default language when user has no saved preference. */
export default function PlatformLanguageSync() {
  const { config, loading } = usePlatformConfig();

  useEffect(() => {
    if (loading) return;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) return;
      const lang = config.language ?? "en";
      if (lang === "en" || lang === "hi") {
        localStorage.setItem(LS_KEY, lang);
        window.dispatchEvent(new Event("rms-language-set"));
      }
    } catch {
      /* ignore */
    }
  }, [config.language, loading]);

  return null;
}
