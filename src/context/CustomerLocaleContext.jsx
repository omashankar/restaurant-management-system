"use client";

import {
  createLocaleFormatters,
  DEFAULT_LOCALE_PREFS,
  normalizeLocalePrefs,
} from "@/lib/localeFormat";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { createContext, useContext, useMemo } from "react";

const CustomerLocaleContext = createContext(createLocaleFormatters(DEFAULT_LOCALE_PREFS));

export function CustomerLocaleProvider({ children }) {
  const { info } = useRestaurantInfo();
  const locale = useMemo(
    () =>
      createLocaleFormatters(
        normalizeLocalePrefs({
          dateFormat: info.dateFormat,
          timeFormat: info.timeFormat,
          timezone: info.timezone,
        })
      ),
    [info.dateFormat, info.timeFormat, info.timezone]
  );

  return (
    <CustomerLocaleContext.Provider value={locale}>
      {children}
    </CustomerLocaleContext.Provider>
  );
}

export function useCustomerLocale() {
  return useContext(CustomerLocaleContext);
}
