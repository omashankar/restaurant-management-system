"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";

/**
 * Section title row inside settings / landing editors (icon badge + title + description).
 */
export default function AdminSectionHeader({
  icon: Icon,
  title,
  description,
  brand = "sa",
  className = "",
}) {
  const badgeCls =
    brand === "ra"
      ? "ra-icon-badge mt-0.5 size-9 shrink-0"
      : "sa-icon-badge mt-0.5 size-9 shrink-0";

  return (
    <div className={`flex items-start gap-3 border-b admin-shell-border pb-4 ${className}`}>
      <span className={`flex items-center justify-center rounded-xl ${badgeCls}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className={`text-base font-semibold ${adminSurface.title}`}>{title}</h2>
        {description ? (
          <p className={`mt-0.5 text-xs ${adminSurface.muted}`}>{description}</p>
        ) : null}
      </div>
    </div>
  );
}
