"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

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
}) {
  if (!open && !embedded) return null;
  if (embedded && !open) return null;

  const title = type === "messages" ? "Messages" : "Notifications";
  const markAllCls =
    accent === "rose"
      ? "text-rose-400 hover:text-rose-300"
      : "text-emerald-400 hover:text-emerald-300";
  const resolveCls =
    accent === "rose"
      ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
      : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10";
  const unreadDot = accent === "rose" ? "bg-rose-400" : "bg-emerald-400";

  const panel = (
    <div
      className={
        embedded
          ? "rounded-lg border border-zinc-800 bg-zinc-950/80 p-1.5"
          : "w-[min(360px,calc(100vw-1rem))] rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl shadow-black/40"
      }
    >
      <div className="flex items-center justify-between px-2.5 py-2">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
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
            <Loader2 className="size-4 animate-spin text-zinc-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-zinc-500">No {title.toLowerCase()} yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.key}>
                <div
                  className={`rounded-lg px-2.5 py-2 transition-colors ${
                    item.read ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800/70" : "bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800"
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
                        <p className="mt-0.5 text-xs text-zinc-500">{item.body}</p>
                      </div>
                      {!item.read ? <span className={`mt-1 size-2 shrink-0 rounded-full ${unreadDot}`} /> : null}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">{item.ago ?? "just now"}</p>
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

  return (
    <div className="absolute right-0 top-full z-[70] mt-2">
      {panel}
    </div>
  );
}

function InboxCountBadge({ count, tone = "emerald" }) {
  if (!count || count <= 0) return null;
  const cls =
    tone === "amber"
      ? "bg-amber-500/20 text-amber-300"
      : "bg-emerald-500/20 text-emerald-300";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {count}
    </span>
  );
}

export { InboxCountBadge };
