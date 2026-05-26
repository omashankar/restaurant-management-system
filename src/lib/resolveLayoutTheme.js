import { mergeCmsSection } from "@/lib/customerCmsMerge";
import {
  activeNavItems,
  DEFAULT_FOOTER_ACCOUNT_LINKS,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SOCIAL_LINKS,
  DEFAULT_HEADER_MENU,
  ensureNavItems,
} from "@/lib/layoutNavDefaults";
import { DEFAULT_CUSTOMER_THEME } from "@/lib/customerThemeDefaults";

export function resolveTheme(cmsTheme) {
  return mergeCmsSection(DEFAULT_CUSTOMER_THEME, cmsTheme);
}

export function resolveHeaderMenu(cmsTheme) {
  const theme = resolveTheme(cmsTheme);
  return activeNavItems(theme.header?.menuItems, DEFAULT_HEADER_MENU);
}

export function resolveFooterQuickLinks(cmsTheme) {
  const theme = resolveTheme(cmsTheme);
  if (theme.footer?.showQuickLinks === false) return [];
  return activeNavItems(theme.footer?.quickLinks, DEFAULT_FOOTER_QUICK_LINKS);
}

export function resolveFooterAccountLinks(cmsTheme) {
  const theme = resolveTheme(cmsTheme);
  if (theme.footer?.showAccountLinks === false) return [];
  return activeNavItems(theme.footer?.accountLinks, DEFAULT_FOOTER_ACCOUNT_LINKS);
}

export function resolveFooterSocialLinks(cmsTheme, cmsSocial = {}) {
  const theme = resolveTheme(cmsTheme);
  if (theme.footer?.showSocialLinks === false) return [];
  const fromTheme = ensureNavItems(theme.footer?.socialLinks, DEFAULT_FOOTER_SOCIAL_LINKS)
    .filter((i) => i.enabled !== false)
    .map((i) => ({
      ...i,
      href: i.url?.trim() || cmsSocial[i.id]?.trim() || "",
    }))
    .filter((i) => i.href);
  return fromTheme;
}
