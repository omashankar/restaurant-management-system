"use client";

import { isPathAllowedByPlatformFeatures } from "@/lib/platformFeatures";
import { normalizeCustomerStorefrontPath } from "@/lib/customerStorefrontPath";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PlatformFeatureGate({ children }) {
  const pathname = usePathname();
  const normalizedPath = normalizeCustomerStorefrontPath(pathname);
  const { link } = useRestaurantSlug();
  const { features, loading, config } = usePlatformConfig();

  if (loading) return null;

  if (config.maintenanceMode) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-customer-text">
          Temporarily unavailable
        </h1>
        <p className="mt-2 text-sm text-customer-muted">
          Online ordering is paused while we perform maintenance.
        </p>
        <Link href={link("/home")} className="mt-6 inline-block text-sm text-emerald-600 hover:underline">
          Back to restaurant home
        </Link>
      </div>
    );
  }

  if (!isPathAllowedByPlatformFeatures(normalizedPath, features)) {
    const isOrder = normalizedPath.includes("/order");
    const isBooking = normalizedPath.includes("table-booking");
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-customer-text">
          Feature unavailable
        </h1>
        <p className="mt-2 text-sm text-customer-muted">
          {isOrder
            ? "Online ordering is currently disabled on this platform."
            : isBooking
              ? "Table reservations are currently disabled on this platform."
              : "This section is currently disabled."}
        </p>
        <Link href={link("/home")} className="mt-6 inline-block text-sm text-emerald-600 hover:underline">
          Back to restaurant home
        </Link>
      </div>
    );
  }

  return children;
}
