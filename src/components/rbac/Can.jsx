"use client";

import { usePermission } from "@/hooks/usePermission";
import { Lock } from "lucide-react";

/**
 * Declarative permission gate.
 *
 * Props:
 *   permission  — single permission string
 *   any         — array: render if user has ANY of these
 *   all         — array: render if user has ALL of these
 *   fallback    — what to render when access is denied (default: null)
 *   disabled    — instead of hiding, render children with a "no access" overlay
 *
 * Examples:
 *   <Can permission="view_sales">...</Can>
 *   <Can any={["manage_staff","view_staff"]} fallback={<NoAccess />}>...</Can>
 *   <Can permission="export_reports" disabled>
 *     <ExportButton />
 *   </Can>
 */
export default function Can({
  permission,
  any: anyList,
  all: allList,
  fallback = null,
  disabled = false,
  children,
}) {
  const { hasPermission, hasAny, hasAll } = usePermission();

  let allowed = true;
  if (permission) allowed = hasPermission(permission);
  else if (anyList) allowed = hasAny(anyList);
  else if (allList) allowed = hasAll(allList);

  if (allowed) return children;

  if (disabled) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-40">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/60 backdrop-blur-[1px]">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-400">
            <Lock className="size-3.5" aria-hidden />
            No access
          </span>
        </div>
      </div>
    );
  }

  return fallback;
}
