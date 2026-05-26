"use client";

import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { resolveTheme } from "@/lib/resolveLayoutTheme";

/** Customer site logos from CMS (header) with Settings fallback. */
export function useCustomerBrandLogos() {
  const { content: cms } = useRestaurantCms();
  const { info } = useRestaurantInfo();
  const header = resolveTheme(cms.theme).header ?? {};

  const settingsLogo = normalizeLogoSrc(info.logoUrl);
  const logoUrl = normalizeLogoSrc(header.logoUrl) || settingsLogo;
  const logoDarkUrl =
    normalizeLogoSrc(header.logoDarkUrl) || logoUrl || settingsLogo;

  return {
    logoUrl,
    logoDarkUrl,
    showBrandText: header.showBrandText === true,
    alt: info.name?.trim() || "Restaurant",
  };
}
