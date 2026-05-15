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

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useRestaurantSlug() {
  const pathname = usePathname();

  const slug = useMemo(() => {
    // /r/pizza-palace/...  →  "pizza-palace"
    const match = pathname?.match(/^\/r\/([^/]+)(\/|$)/);
    return match ? match[1] : null;
  }, [pathname]);

  const prefix = slug ? `/r/${slug}` : "";

  /** Path ko slug prefix ke saath return karta hai */
  const link = (path) => `${prefix}${path}`;

  return { slug, prefix, link };
}
