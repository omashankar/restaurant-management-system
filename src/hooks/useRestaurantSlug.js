/**
 * useRestaurantSlug
 *
 * Current URL se restaurant slug detect karta hai.
 * Agar URL /r/pizza-palace/... hai to slug = "pizza-palace"
 * Warna slug = null (direct access, no prefix needed)
 *
 * Usage:
 *   const { slug, prefix, link } = useRestaurantSlug();
 *   link("/order/menu")  →  "/r/pizza-palace/order/menu"  (slug active)
 *                       →  "/order/menu"                  (no slug)
 */

"use client";

import { getCustomerStorageScope } from "@/lib/customerSessionStorage";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useRestaurantSlug() {
  const pathname = usePathname();

  const slug = useMemo(() => {
    const fromPath = pathname?.match(/^\/r\/([^/]+)(\/|$)/)?.[1];
    if (fromPath) return fromPath;
    const scope = getCustomerStorageScope(pathname);
    return scope === "default" ? null : scope;
  }, [pathname]);

  const prefix = slug ? `/r/${slug}` : "";

  /** Path ko slug prefix ke saath return karta hai */
  const link = (path) => `${prefix}${path}`;

  return { slug, prefix, link };
}
