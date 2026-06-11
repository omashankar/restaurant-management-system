/** Super Admin brand defaults — overridden by Settings → Theme at runtime. */
import { adminBox, adminControl, adminPage, adminText } from "@/config/adminDesignSystem";
import { adminSurface } from "@/config/adminSurfaceClasses";

export { adminBox, adminControl, adminPage, adminText };

/** Lime brand default — matches light Super Admin UI; overridden in Settings → Theme */
export const SUPER_ADMIN_PRIMARY = "#a3e635";
export const SUPER_ADMIN_ACCENT = "#10b981";

/** Standard text/select/textarea field — Super Admin + portaled modals */
export const saInputCls =
  "admin-surface-input outline-none focus-sa-primary placeholder:admin-surface-faint transition-colors";

export const saTextareaCls = `${saInputCls} resize-none`;

export const saCardCls = adminSurface.card;
export const saCardSolidCls = adminSurface.cardSolid;
export const saTableShellCls = adminSurface.tableShell;
export const saLabelCls = adminSurface.label;
export const saMutedCls = adminSurface.muted;
export const saFaintCls = adminSurface.faint;
export const saBodyCls = adminSurface.body;
export const saGhostBtnCls = adminSurface.btnGhost;
export const saIconBtnCls = adminSurface.btnIcon;
export const saSegmentTrackCls = adminSurface.segmentTrack;
export const saSegmentBtnCls = adminSurface.segmentBtn;
export const saSegmentBtnActiveCls = adminSurface.segmentBtnActive;
export const saDashedBoxCls = adminSurface.dashedBox;

export const saBtnPrimaryCls =
  "sa-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed transition-colors";

export const saBtnPrimarySmCls =
  "sa-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed transition-colors";

export const saIconBadgeCls =
  "sa-icon-badge size-10 shrink-0";

export const saPageActiveCls =
  "border-sa-primary-40 bg-sa-primary-10 text-sa-primary";

export const saToggleOnCls = "bg-sa-primary";

/** Subtle chip style (filters, secondary tabs) */
export const saTabActiveCls =
  "bg-sa-primary-10 text-sa-primary ring-1 ring-sa-primary-25";

/** Settings / Landing side nav — light pill + brand icon */
export const saSideNavActiveCls =
  "admin-side-nav-active-pill font-semibold";

export const saTabActiveIconCls = "text-sa-primary";

export const saSpinnerCls = "sa-spinner size-4";

export const saSkeletonBlockCls = "sa-skeleton";

export const saSkeletonCardCls = "sa-skeleton-card";

/** Semantic success — uses Settings → Accent Color */
export const saSuccessTextCls = "text-sa-accent";
export const saSuccessBadgeCls = "sa-status-badge rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize";
