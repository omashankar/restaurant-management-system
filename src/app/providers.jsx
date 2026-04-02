"use client";

import AppPreloader from "@/components/ui/AppPreloader";
import { AppProvider } from "@/context/AppProviders";
import { ModuleDataProvider } from "@/context/ModuleDataContext";

export default function Providers({ children }) {
  return (
    <AppProvider>
      <ModuleDataProvider>
        <AppPreloader />
        {children}
      </ModuleDataProvider>
    </AppProvider>
  );
}
