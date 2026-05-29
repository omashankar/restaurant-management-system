"use client";

import { isPathAllowedByPlatformFeatures } from "@/lib/platformFeatures";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PlatformFeatureGate({ children }) {
  const pathname = usePathname();
  const { features, loading, config } = usePlatformConfig();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (config.maintenanceMode) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Temporarily unavailable
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Online ordering is paused while we perform maintenance.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-emerald-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!isPathAllowedByPlatformFeatures(pathname, features)) {
    const isOrder = pathname.includes("/order");
    const isBooking = pathname.includes("table-booking");
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Feature unavailable
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isOrder
            ? "Online ordering is currently disabled on this platform."
            : isBooking
              ? "Table reservations are currently disabled on this platform."
              : "This section is currently disabled."}
        </p>
        <Link href="/home" className="mt-6 inline-block text-sm text-emerald-600 hover:underline">
          Back to restaurant home
        </Link>
      </div>
    );
  }

  return children;
}
