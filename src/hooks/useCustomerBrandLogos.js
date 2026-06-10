"use client";

import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { resolveCustomerSiteLogos, resolveCustomerSiteName } from "@/lib/resolveBrandLogos";
import { resolveTheme } from "@/lib/resolveLayoutTheme";

/** Customer site logos from CMS (header) with Settings fallback — tenant branding only. */
export function useCustomerBrandLogos() {
  const { content: cms } = useRestaurantCms();
  const { info } = useRestaurantInfo();
  const header = resolveTheme(cms.theme).header ?? {};

  const { logoUrl, logoDarkUrl } = resolveCustomerSiteLogos({
    headerLogo: header.logoUrl,
    headerLogoDark: header.logoDarkUrl,
    settingsLogo: info.logoUrl,
  });

  return {
    logoUrl,
    logoDarkUrl,
    showBrandText: header.showBrandText === true,
    alt: resolveCustomerSiteName(info.name),
  };
}
