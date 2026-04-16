"use client";

import AppPreloader from "@/components/ui/AppPreloader";
import { AppProvider } from "@/context/AppProviders";
import { AuthProvider } from "@/context/AuthContext";
import { ModuleDataProvider } from "@/context/ModuleDataContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <AppProvider>
        <ModuleDataProvider>
          <AppPreloader />
          {children}
        </ModuleDataProvider>
      </AppProvider>
    </AuthProvider>
  );
}
