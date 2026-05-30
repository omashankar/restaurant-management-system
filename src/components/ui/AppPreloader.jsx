"use client";

import { useApp } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { BrandPreloaderFace } from "@/components/ui/BrandPreloaderFace";
import { useSuperAdminThemeStyles } from "@/hooks/useSuperAdminThemeStyles";
import { useRestaurantTheme } from "@/hooks/useRestaurantTheme";
import "@/app/super-admin/super-admin-theme.css";
import "@/app/(app)/restaurant-admin-theme.css";
import { usePathname } from "next/navigation";

export default function AppPreloader() {
  const { hydrated: appHydrated } = useApp();
  const { hydrated: authHydrated } = useUser();
  const { hydrated: moduleHydrated } = useModuleData();
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const superAdminThemeStyle = useSuperAdminThemeStyles();
  useRestaurantTheme();

  const ready = isSuperAdmin
    ? appHydrated && moduleHydrated && authHydrated
    : appHydrated && moduleHydrated;

  const variant = isSuperAdmin ? "super-admin" : "restaurant-admin";
  const panelClass = isSuperAdmin ? "super-admin-panel" : "restaurant-admin-panel";

  return (
    <div
      aria-hidden={ready}
      style={isSuperAdmin ? superAdminThemeStyle : undefined}
      className={`${panelClass} pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/95 text-zinc-100 transition-opacity duration-500 ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      <BrandPreloaderFace variant={variant} />
    </div>
  );
}
