"use client";

import { canAccessPath } from "@/config/navigation";
import { useApp } from "@/context/AppProviders";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import RestrictedPage from "./RestrictedPage";
import LayoutWrapper from "./LayoutWrapper";

export default function Shell({ children }) {
  const { user, hydrated } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  useLayoutEffect(() => {
    if (!user) return;
    if (user.role === "waiter" && pathname === "/dashboard") {
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

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading workspace…
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

  const allowed = canAccessPath(user.role, pathname);
  if (!allowed) {
    return <LayoutWrapper><RestrictedPage title="Module not available" /></LayoutWrapper>;
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
}
