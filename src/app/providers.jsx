"use client";

import AppPreloader from "@/components/ui/AppPreloader";
import { AppProvider } from "@/context/AppProviders";
import { AuthProvider } from "@/context/AuthContext";
import { ModuleDataProvider } from "@/context/ModuleDataContext";
import { LanguageProvider } from "@/context/LanguageContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <AppProvider>
        <LanguageProvider>
          <ModuleDataProvider>
            <AppPreloader />
            {children}
          </ModuleDataProvider>
        </LanguageProvider>
      </AppProvider>
    </AuthProvider>
  );
}
