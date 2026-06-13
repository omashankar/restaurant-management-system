"use client";

import AppPreloader from "@/components/ui/AppPreloader";
import { AppProvider } from "@/context/AppProviders";
import { AuthProvider } from "@/context/AuthContext";
import { ModuleDataProvider } from "@/context/ModuleDataContext";
import { LanguageProvider } from "@/context/LanguageContext";
import PlatformLanguageSync from "@/components/PlatformLanguageSync";
import DebugModeBanner from "@/components/DebugModeBanner";
import PlatformBrandingHead from "@/components/PlatformBrandingHead";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <AppProvider>
        <LanguageProvider>
          <PlatformLanguageSync />
          <PlatformBrandingHead />
          <ModuleDataProvider>
            <AppPreloader />
            <DebugModeBanner />
            {children}
          </ModuleDataProvider>
        </LanguageProvider>
      </AppProvider>
    </AuthProvider>
  );
}
