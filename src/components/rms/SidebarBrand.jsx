"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { UtensilsCrossed } from "lucide-react";

/** Sidebar header — logo + name from Settings → General */
export default function SidebarBrand({
  collapsed = false,
  name = "RMS",
  tagline = "Restaurant OS",
  logoUrl = "",
}) {
  const src = normalizeLogoSrc(logoUrl);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
          src
            ? "bg-[var(--admin-control)] ring-ra-primary-25"
            : "bg-ra-primary-15 text-ra-primary ring-ra-primary-25"
        }`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="size-8 rounded-lg object-contain p-0.5"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <UtensilsCrossed className="size-5" aria-hidden />
        )}
      </span>
      {!collapsed ? (
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold tracking-tight ${adminSurface.title}`} title={name}>
            {name}
          </p>
          {tagline ? (
            <p className={`truncate text-[11px] ${adminSurface.muted}`}>{tagline}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
