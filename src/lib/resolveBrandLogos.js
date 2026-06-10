import { BHOJDESK_LOGOS, BHOJDESK_PLATFORM_UI } from "@/config/bhojdeskBrand";
import { normalizeLogoSrc } from "@/lib/logoUrl";

/** Fixed platform branding for all admin panels (restaurant + super admin chrome). */
export function resolveAdminPlatformBranding() {
  return {
    name: BHOJDESK_PLATFORM_UI.name,
    tagline: BHOJDESK_PLATFORM_UI.tagline,
    fullName: BHOJDESK_PLATFORM_UI.fullName,
    sidebarLogoUrl: BHOJDESK_LOGOS.icon,
    fullLogoUrl: BHOJDESK_LOGOS.horizontalLight,
  };
}

/** Super Admin sidebar — always BhojDesk (platform chrome). */
export function resolveAdminSidebarBranding() {
  const platform = resolveAdminPlatformBranding();
  return {
    name: platform.name,
    tagline: platform.tagline,
    sidebarLogoUrl: platform.sidebarLogoUrl,
    hasCustomName: false,
    hasCustomLogo: false,
  };
}

/**
 * Restaurant Admin sidebar — tenant name/logo from Settings → General, BhojDesk fallback.
 */
export function resolveRestaurantAdminSidebarBranding({
  restaurantName = "",
  restaurantLogoUrl = "",
} = {}) {
  const platform = resolveAdminPlatformBranding();
  const customName = String(restaurantName ?? "").trim();
  const customLogo = normalizeLogoSrc(restaurantLogoUrl);

  return {
    name: customName || platform.name,
    tagline: platform.tagline,
    sidebarLogoUrl: customLogo || platform.sidebarLogoUrl,
    hasCustomName: Boolean(customName),
    hasCustomLogo: Boolean(customLogo),
  };
}

/**
 * Customer website — restaurant CMS/settings first, then BhojDesk defaults.
 */
export function resolveCustomerSiteLogos({
  headerLogo = "",
  headerLogoDark = "",
  settingsLogo = "",
} = {}) {
  const light =
    normalizeLogoSrc(headerLogo) ||
    normalizeLogoSrc(settingsLogo) ||
    BHOJDESK_LOGOS.horizontalLight;
  const dark =
    normalizeLogoSrc(headerLogoDark) ||
    light ||
    BHOJDESK_LOGOS.horizontalDark;

  return { logoUrl: light, logoDarkUrl: dark };
}

export function resolveCustomerSiteName(restaurantName = "") {
  const custom = String(restaurantName ?? "").trim();
  return custom || BHOJDESK_PLATFORM_UI.name;
}
