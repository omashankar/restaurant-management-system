"use client";

import { BHOJDESK_BRAND, BHOJDESK_LOGOS } from "@/config/bhojdeskBrand";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useEffect } from "react";

function upsertLink(rel, href) {
  if (!href || typeof document === "undefined") return;
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) {
    link.setAttribute("href", href);
  }
}

/** Live favicon + document title from Super Admin → App settings (after save, no full reload). */
export default function PlatformBrandingHead() {
  const { config } = usePlatformConfig();

  useEffect(() => {
    const title = String(config.appName ?? "").trim() || BHOJDESK_BRAND.fullName;
    if (document.title !== title) document.title = title;

    const favicon =
      String(config.faviconUrl ?? "").trim() || BHOJDESK_LOGOS.icon;
    upsertLink("icon", favicon);
    upsertLink("apple-touch-icon", favicon);
  }, [config.appName, config.faviconUrl]);

  return null;
}
