"use client";

import {
  getDefaultRestaurantLocaleFormatters,
  useRestaurantLocale,
} from "@/hooks/useRestaurantLocale";
import { createContext, useContext } from "react";

const RestaurantLocaleContext = createContext(getDefaultRestaurantLocaleFormatters());

export function RestaurantLocaleProvider({ children }) {
  const locale = useRestaurantLocale();
  return (
    <RestaurantLocaleContext.Provider value={locale}>
      {children}
    </RestaurantLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  return useContext(RestaurantLocaleContext);
}
