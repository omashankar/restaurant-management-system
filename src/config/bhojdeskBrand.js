/**
 * BhojDesk platform brand — Super Admin, landing page, and platform defaults.
 */
export const BHOJDESK_BRAND = {
  name: "BhojDesk",
  fullName: "BhojDesk Restaurant Management System",
  shortName: "BhojDesk RMS",
  tagline: "Smart Restaurant Management System",
  supportEmail: "support@bhojdesk.com",
};

/** Super Admin → Settings → Email → Send Test — default inbox */
export const PLATFORM_SMTP_TEST_RECIPIENT = "omsuman14106@gmail.com";

export const BHOJDESK_LOGOS = {
  /** B mark — favicon, collapsed sidebar, compact slots */
  icon: "/branding/bhojdesk/icon.png",
  /** Dark text on transparent — landing navbar/footer (light background) */
  horizontalLight: "/branding/bhojdesk/logo-horizontal-light.png",
  /** White text — super admin sidebar (dark background) */
  horizontalDark: "/branding/bhojdesk/logo-horizontal-dark.png",
  /** Stacked icon + wordmark — auth pages, preloader */
  vertical: "/branding/bhojdesk/logo-vertical.png",
  /** Full lockup on dark backgrounds — OG / marketing */
  lockupDarkBg: "/branding/bhojdesk/logo-horizontal-dark.png",
};

/** Platform UI fallbacks when a restaurant has not set name/logo yet (admin sidebar, etc.). */
export const BHOJDESK_PLATFORM_UI = {
  name: BHOJDESK_BRAND.name,
  tagline: BHOJDESK_BRAND.shortName,
  fullName: BHOJDESK_BRAND.fullName,
  logoUrl: BHOJDESK_LOGOS.icon,
};

/** Email / SMS subject prefix, e.g. [BhojDesk RMS] */
export function platformEmailSubject(topic) {
  const t = String(topic ?? "").trim();
  return t ? `[${BHOJDESK_BRAND.shortName}] ${t}` : `[${BHOJDESK_BRAND.shortName}]`;
}
