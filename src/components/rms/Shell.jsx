"use client";

import { canAccessPath } from "@/config/navigation";
import { useApp } from "@/context/AppProviders";
import { useAccessControlSettings } from "@/hooks/useAccessControlSettings";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useUser } from "@/context/AuthContext";
import { BrandPreloaderFace } from "@/components/ui/BrandPreloaderFace";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import LayoutWrapper from "./LayoutWrapper";
import RestrictedPage from "./RestrictedPage";

export default function Shell({ children }) {
  const { hydrated: appHydrated } = useApp();
  const { user, hydrated, loading } = useUser();
  const accessControl = useAccessControlSettings();
  const { features: platformFeatures } = usePlatformConfig();
  const pathname = usePathname();
  const router   = useRouter();
  const [routing, setRouting] = useState(false);

  /* ── Redirect to login if not authenticated ── */
  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  /* ── Role-based path correction ── */
  useLayoutEffect(() => {
    if (!user) return;
    if (user.role === "waiter" && pathname === "/dashboard") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRouting(true);
      router.replace("/pos");
      return;
    }
    if (user.role === "chef" && pathname === "/dashboard") {
      setRouting(true);
      router.replace("/kitchen");
      return;
    }
    setRouting(false);
  }, [user, pathname, router]);

  /* ── Loading states ── */
  if (loading || !hydrated || !appHydrated) {
    return (
      <div className="restaurant-admin-panel flex min-h-screen items-center justify-center bg-zinc-950">
        <BrandPreloaderFace variant="restaurant-admin" subtitle="Loading workspace…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="restaurant-admin-panel flex min-h-screen items-center justify-center bg-zinc-950">
        <BrandPreloaderFace variant="restaurant-admin" subtitle="Redirecting…" compact />
      </div>
    );
  }

  if (routing) {
    return (
      <div className="restaurant-admin-panel flex min-h-screen items-center justify-center bg-zinc-950">
        <BrandPreloaderFace variant="restaurant-admin" subtitle="Opening workspace…" compact />
      </div>
    );
  }

  /* ── RBAC path check ── */
  if (!canAccessPath(user.role, pathname, accessControl, platformFeatures)) {
    return <LayoutWrapper><RestrictedPage title="Module not available" /></LayoutWrapper>;
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
}
