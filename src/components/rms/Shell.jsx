"use client";

import { canAccessPath } from "@/config/navigation";
import { useApp } from "@/context/AppProviders";
import { useAccessControlSettings } from "@/hooks/useAccessControlSettings";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useUser } from "@/context/AuthContext";
import { BrandPreloaderFace } from "@/components/ui/BrandPreloaderFace";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { adminShell } from "@/config/adminSurfaceClasses";
import LayoutWrapper from "./LayoutWrapper";
import RestrictedPage from "./RestrictedPage";

export default function Shell({ children }) {
  const { hydrated: appHydrated } = useApp();
  const { user, hydrated, loading } = useUser();
  const accessControl = useAccessControlSettings();
  const { features: platformFeatures } = usePlatformConfig();
  const pathname = usePathname();
  const router   = useRouter();

  /* ── Redirect to login if not authenticated ── */
  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  /* ── Loading states ── */
  if (loading || !hydrated || !appHydrated) {
    return (
      <div className={`restaurant-admin-panel ${adminShell.pageCentered}`}>
        <BrandPreloaderFace variant="restaurant-admin" subtitle="Loading workspace…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`restaurant-admin-panel ${adminShell.pageCentered}`}>
        <BrandPreloaderFace variant="restaurant-admin" subtitle="Redirecting…" compact />
      </div>
    );
  }

  /* ── RBAC path check ── */
  if (!canAccessPath(user.role, pathname, accessControl, platformFeatures)) {
    return <LayoutWrapper><RestrictedPage title="Module not available" /></LayoutWrapper>;
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
}
