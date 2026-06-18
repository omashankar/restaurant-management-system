"use client";

import { useCustomerTheme } from "@/context/CustomerThemeContext";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import Link from "next/link";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 400;
const MAX_VISIBLE_MS = 8000;
const FADE_MS = 450;

/**
 * Full-screen preloader overlay — site shell stays mounted underneath.
 */
export default function CustomerShellGate({ children }) {
  const { hydrated: themeHydrated } = useCustomerTheme();
  const { loading: cmsLoading } = useRestaurantCms();
  const { loading: infoLoading, notFound } = useRestaurantInfo();
  const { loading: platformLoading } = usePlatformConfig();

  const mountedAt = useRef(Date.now());
  const [phase, setPhase] = useState("loading");

  const ready = themeHydrated && !cmsLoading && !infoLoading && !platformLoading;

  useEffect(() => {
    const forceTimer = setTimeout(() => setPhase("hidden"), MAX_VISIBLE_MS);
    return () => clearTimeout(forceTimer);
  }, []);

  useEffect(() => {
    if (!ready || phase !== "loading") return undefined;

    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const fadeTimer = setTimeout(() => setPhase("fading"), wait);
    const hideTimer = setTimeout(() => setPhase("hidden"), wait + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [ready, phase]);

  useEffect(() => {
    const unlockScroll = () => {
      document.body.style.removeProperty("overflow");
    };

    if (phase === "fading" || phase === "hidden") {
      unlockScroll();
      return undefined;
    }

    document.body.style.overflow = "hidden";
    return unlockScroll;
  }, [phase]);

  if (notFound) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-[var(--customer-text,#111827)]">Restaurant not found</h1>
        <p className="max-w-md text-sm text-customer-muted">
          This link may be wrong or the restaurant is no longer active on BhojDesk.
        </p>
        <Link
          href="/r"
          className="rounded-xl bg-customer-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen min-h-[100dvh] w-full max-w-full flex-col overflow-x-clip">
        {children}
      </div>

      {phase !== "hidden" && (
        <div
          aria-live="polite"
          aria-busy={phase === "loading"}
          className={`ct-customer-preloader fixed inset-0 z-[110] flex items-center justify-center transition-opacity duration-[450ms] ${
            phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="ct-customer-preloader__spinner ct-customer-preloader__spinner--lg" aria-hidden />
            <p className="text-sm font-medium text-customer-muted">Loading…</p>
          </div>
        </div>
      )}
    </>
  );
}
