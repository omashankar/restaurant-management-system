"use client";

import { BHOJDESK_LOGOS, BHOJDESK_PLATFORM_UI } from "@/config/bhojdeskBrand";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { useEffect, useState } from "react";

const FALLBACK_ICON = BHOJDESK_LOGOS.icon;

/** Sidebar header — tenant logo + name from Settings → General; BhojDesk fallback. */
export default function SidebarBrand({
  collapsed = false,
  name = BHOJDESK_PLATFORM_UI.name,
  logoUrl = BHOJDESK_PLATFORM_UI.logoUrl,
  portal = "restaurant",
}) {
  const ringCls =
    portal === "super-admin" ? "ring-sa-primary-25" : "ring-ra-primary-25";
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl]);

  const rawSrc = normalizeLogoSrc(logoUrl);
  const src = imgFailed || !rawSrc ? FALLBACK_ICON : rawSrc;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-control)] ring-1 ${ringCls}`}
        title={name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="size-8 rounded-lg object-contain p-0.5"
          onError={() => setImgFailed(true)}
        />
      </span>
      {!collapsed ? (
        <p
          className={`min-w-0 flex-1 truncate text-sm font-semibold leading-tight tracking-tight ${adminSurface.title}`}
          title={name}
        >
          {name}
        </p>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </div>
  );
}
