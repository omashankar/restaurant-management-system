/** Restaurant Admin brand defaults — overridden by Settings → Theme at runtime. */
import { adminBox, adminControl, adminPage, adminText } from "@/config/adminDesignSystem";
import { adminSurface } from "@/config/adminSurfaceClasses";

export { adminBox, adminControl, adminPage, adminText };

export const RESTAURANT_ADMIN_PRIMARY = "#10b981";
export const RESTAURANT_ADMIN_ACCENT = "#34d399";

/** Standard text/select/textarea field — Restaurant Admin + portaled modals */
export const raInputCls =
  "admin-surface-input outline-none focus-ra-primary placeholder:admin-surface-faint transition-colors";

export const raTextareaCls = `${raInputCls} resize-none`;

/** Toolbar dropdowns — compact width, same chrome as inputs */
export const raFilterSelectCls = `${raInputCls} admin-inline-select !w-auto min-w-[9rem] max-w-full cursor-pointer`;

/** Semantic shells — dark/light via admin-surface-theme.css */
export const raCardCls = adminSurface.card;
export const raCardSolidCls = adminSurface.cardSolid;
export const raTableShellCls = adminSurface.tableShell;
export const raLabelCls = adminSurface.label;
export const raMutedCls = adminSurface.muted;
export const raFaintCls = adminSurface.faint;
export const raBodyCls = adminSurface.body;
export const raGhostBtnCls = adminSurface.btnGhost;
export const raIconBtnCls = adminSurface.btnIcon;
export const raSegmentTrackCls = adminSurface.segmentTrack;
export const raSegmentBtnCls = adminSurface.segmentBtn;
export const raSegmentBtnActiveCls = adminSurface.segmentBtnActive;
export const raDashedBoxCls = adminSurface.dashedBox;

export const raBtnPrimaryCls =
  "ra-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed transition-colors";

export const raBtnPrimarySmCls =
  "ra-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed transition-colors";

export const raIconBadgeCls = "ra-icon-badge size-10 shrink-0";

export const raPageActiveCls =
  "border-ra-primary-40 bg-ra-primary-10 text-ra-primary";

export const raToggleOnCls = "bg-ra-primary";

/** Filter chips / segment tabs — tinted brand */
export const raTabActiveCls =
  "bg-ra-primary-10 text-ra-primary ring-1 ring-ra-primary-25";

/** Settings side nav — light pill + brand icon (matches Super Admin sections nav) */
export const raSideNavActiveCls =
  "admin-side-nav-active-pill font-semibold";

export const raTabActiveIconCls = "text-ra-primary";

export const raSpinnerCls = "ra-spinner size-4";

export const raSkeletonBlockCls = "ra-skeleton";

export const raSkeletonCardCls = "ra-skeleton-card";

export const raSuccessTextCls = "text-ra-accent";
export const raSuccessBadgeCls =
  "ra-status-badge rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize";
