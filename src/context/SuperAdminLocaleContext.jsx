"use client";

import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import {
  createLocaleFormatters,
  DEFAULT_LOCALE_PREFS,
} from "@/lib/localeFormat";
import { createContext, useContext, useMemo } from "react";

const SuperAdminLocaleContext = createContext(
  createLocaleFormatters(DEFAULT_LOCALE_PREFS)
);

export function SuperAdminLocaleProvider({ children }) {
  const { config } = usePlatformConfig();

  const locale = useMemo(
    () =>
      createLocaleFormatters({
        dateFormat: config.dateFormat,
        timeFormat: config.timeFormat,
        timezone: config.timezone,
      }),
    [config.dateFormat, config.timeFormat, config.timezone]
  );

  return (
    <SuperAdminLocaleContext.Provider value={locale}>
      {children}
    </SuperAdminLocaleContext.Provider>
  );
}

export function useSuperAdminLocale() {
  return useContext(SuperAdminLocaleContext);
}
