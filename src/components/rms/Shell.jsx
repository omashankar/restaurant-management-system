"use client";

import { canAccessPath } from "@/config/navigation";
import { useApp } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import LayoutWrapper from "./LayoutWrapper";
import RestrictedPage from "./RestrictedPage";

export default function Shell({ children }) {
  const { hydrated: appHydrated } = useApp();
  const { user, hydrated, loading } = useUser();
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading workspace…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Redirecting…
      </div>
    );
  }

  if (routing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Opening workspace…
      </div>
    );
  }

  /* ── RBAC path check ── */
  if (!canAccessPath(user.role, pathname)) {
    return <LayoutWrapper><RestrictedPage title="Module not available" /></LayoutWrapper>;
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
}
