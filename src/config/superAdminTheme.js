/** Super Admin brand defaults — overridden by Settings → Theme at runtime. */
export const SUPER_ADMIN_PRIMARY = "#f43f5e";
export const SUPER_ADMIN_ACCENT = "#10b981";

export const saInputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-sa-primary placeholder:text-zinc-600 transition-colors";

export const saBtnPrimaryCls =
  "sa-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed transition-colors";

export const saBtnPrimarySmCls =
  "sa-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed transition-colors";

export const saIconBadgeCls =
  "sa-icon-badge size-10 shrink-0";

export const saPageActiveCls =
  "border-sa-primary-40 bg-sa-primary-10 text-sa-primary";

export const saToggleOnCls = "bg-sa-primary";

export const saTabActiveCls =
  "bg-sa-primary-10 text-zinc-100 ring-1 ring-sa-primary-25";

export const saTabActiveIconCls = "text-sa-primary";

export const saSpinnerCls = "sa-spinner size-4";

export const saSkeletonBlockCls = "sa-skeleton";

export const saSkeletonCardCls = "sa-skeleton-card";

/** Semantic success — uses Settings → Accent Color */
export const saSuccessTextCls = "text-sa-accent";
export const saSuccessBadgeCls = "sa-status-badge rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize";
