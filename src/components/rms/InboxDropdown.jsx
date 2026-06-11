"use client";

import { adminHeaderDropdownPortal, adminSurface } from "@/config/adminSurfaceClasses";
import { useAnchoredPortalPosition } from "@/hooks/useAnchoredPortalPosition";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";

export default function InboxDropdown({
  open,
  type,
  items,
  loading,
  onMarkRead,
  onMarkAllRead,
  onResolveMessage,
  onClose,
  embedded = false,
  accent = "emerald",
  anchorRef,
}) {
  const position = useAnchoredPortalPosition(open && !embedded, anchorRef);

  if (!open && !embedded) return null;
  if (embedded && !open) return null;

  const isSa = accent === "sa";
  const isRa = accent === "ra" || accent === "emerald";
  const title = type === "messages" ? "Messages" : "Notifications";
  const markAllCls = isSa
    ? "text-sa-primary hover-text-sa-primary-muted"
    : isRa
      ? "text-ra-primary hover-text-ra-primary-muted"
      : "text-ra-primary hover:text-ra-primary-muted";
  const resolveCls = isSa
    ? "border-sa-primary-40 text-sa-primary-muted hover-bg-sa-primary-10"
    : isRa
      ? "border-ra-primary-40 text-ra-primary-muted hover-bg-ra-primary-10"
      : "border-ra-primary-40 text-ra-primary-muted hover-bg-ra-primary-10";
  const unreadDot = isSa ? "bg-sa-primary" : isRa ? "bg-ra-primary" : "bg-emerald-400";

  const panel = (
    <div
      className={
        embedded
          ? `rounded-lg p-1.5 ${adminSurface.cardSolid}`
          : `w-[min(360px,calc(100vw-1rem))] p-1.5 ${adminSurface.dropdown}`
      }
    >
      <div className="flex items-center justify-between px-2.5 py-2">
        <p className={`text-sm font-semibold ${adminSurface.title}`}>{title}</p>
        <button
          type="button"
          onClick={() => onMarkAllRead(type)}
          className={`cursor-pointer text-[11px] font-medium ${markAllCls}`}
        >
          Mark all read
        </button>
      </div>
      <div className={embedded ? "max-h-56 overflow-y-auto" : "max-h-80 overflow-y-auto"}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`size-4 animate-spin ${adminSurface.muted}`} />
          </div>
        ) : items.length === 0 ? (
          <p className={`px-3 py-6 text-center text-xs ${adminSurface.muted}`}>No {title.toLowerCase()} yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.key}>
                <div
                  className={`px-2.5 py-2 transition-colors ${
                    item.read
                      ? `rounded-lg ${adminSurface.rowHover}`
                      : `rounded-lg ${adminSurface.rowHover} bg-[var(--admin-hover)]`
                  }`}
                >
                  <Link
                    href={item.href || "#"}
                    onClick={() => {
                      onMarkRead(item.key);
                      onClose();
                    }}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className={`mt-0.5 text-xs ${adminSurface.muted}`}>{item.body}</p>
                      </div>
                      {!item.read ? <span className={`mt-1 size-2 shrink-0 rounded-full ${unreadDot}`} /> : null}
                    </div>
                    <p className={`mt-1 text-[11px] ${adminSurface.muted}`}>{item.ago ?? "just now"}</p>
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    {type === "messages" && item.actionable ? (
                      <button
                        type="button"
                        onClick={() => onResolveMessage?.(item.key)}
                        className={`cursor-pointer rounded-md border px-2 py-1 text-[11px] font-semibold ${resolveCls}`}
                      >
                        Mark Resolved
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (embedded) return panel;

  if (typeof document === "undefined" || !position) return null;

  return createPortal(
    <div
      data-admin-header-dropdown=""
      className={adminHeaderDropdownPortal}
      style={{ top: position.top, right: position.right }}
    >
      {panel}
    </div>,
    document.body
  );
}

/** Pill badge in profile menu rows */
function InboxCountBadge({ count, tone = "emerald" }) {
  if (!count || count <= 0) return null;
  const cls =
    tone === "amber"
      ? "bg-amber-500/20 text-amber-300"
      : tone === "sa" || tone === "rose"
        ? "bg-sa-primary-20 text-sa-primary-muted"
        : tone === "ra" || tone === "emerald"
          ? "bg-ra-primary-20 text-ra-primary-muted"
          : "bg-ra-primary/20 text-ra-primary-muted";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${cls}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Corner badge on header icon buttons (messages / notifications) */
function HeaderInboxBadge({ count, tone = "amber" }) {
  if (!count || count <= 0) return null;
  const display = count > 99 ? "99+" : count;
  const toneCls =
    tone === "ra"
      ? "admin-header-inbox-badge--ra"
      : tone === "sa"
        ? "admin-header-inbox-badge--sa"
        : "admin-header-inbox-badge--amber";

  return (
    <span aria-hidden className={`admin-header-inbox-badge ${toneCls}`}>
      {display}
    </span>
  );
}

export { HeaderInboxBadge, InboxCountBadge };
