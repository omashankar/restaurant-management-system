"use client";

import { useApp } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { BrandPreloaderFace } from "@/components/ui/BrandPreloaderFace";
import { isAuthRoute } from "@/config/authTheme";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import "@/app/admin-surface-theme.css";
import "@/app/super-admin/super-admin-theme.css";
import "@/app/(app)/restaurant-admin-theme.css";
import "@/app/(auth)/auth-theme.css";
import { usePathname } from "next/navigation";

export default function AppPreloader() {
  const { hydrated: appHydrated } = useApp();
  const { hydrated: authHydrated } = useUser();
  const { hydrated: moduleHydrated } = useModuleData();
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const isAuth = !isSuperAdmin && isAuthRoute(pathname);
  usePlatformConfig();

  const ready = isSuperAdmin
    ? appHydrated && moduleHydrated && authHydrated
    : appHydrated && moduleHydrated;

  const variant = isSuperAdmin ? "super-admin" : isAuth ? "auth" : "restaurant-admin";
  const panelClass = isSuperAdmin
    ? "super-admin-panel"
    : isAuth
      ? "admin-portal-scope"
      : "restaurant-admin-panel";

  return (
    <div
      aria-hidden={ready}
      className={`${panelClass} admin-preloader-overlay pointer-events-none fixed inset-0 z-[120] flex items-center justify-center transition-opacity duration-500 ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      <BrandPreloaderFace variant={variant} />
    </div>
  );
}
