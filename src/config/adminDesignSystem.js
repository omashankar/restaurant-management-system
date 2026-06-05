/**
 * Single visual language for Restaurant Admin + Super Admin.
 * Use these instead of mixing raw zinc-* with one-off classes.
 */
import { adminPortalScope, adminShell, adminSurface } from "@/config/adminSurfaceClasses";

export { adminPortalScope, adminShell, adminSurface };

/** Standard page layout */
export const adminPage = {
  stack: "space-y-6",
  stackLg: "space-y-8",
  header: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
  title: adminSurface.pageTitle,
  desc: adminSurface.pageDesc,
};

/** Surfaces — same look on every page */
export const adminBox = {
  card: adminSurface.card,
  cardPadded: `${adminSurface.card} p-5`,
  cardPaddedLg: `${adminSurface.card} p-6 sm:p-8`,
  cardSolid: adminSurface.cardSolid,
  table: adminSurface.tableShell,
  dashed: adminSurface.dashedBox,
  empty: adminSurface.empty,
};

/** Typography */
export const adminText = {
  heading: adminSurface.heading,
  title: adminSurface.title,
  sub: adminSurface.subheading,
  label: adminSurface.label,
  body: adminSurface.body,
  muted: adminSurface.muted,
  faint: adminSurface.faint,
};

/** Controls — identical border, radius, focus */
export const adminControl = {
  input: adminSurface.input,
  search: adminSurface.search,
  ghost: adminSurface.btnGhost,
  icon: adminSurface.btnIcon,
  segmentTrack: adminSurface.segmentTrack,
  segment: adminSurface.segmentBtn,
  segmentActive: adminSurface.segmentBtnActive,
  rowHover: adminSurface.rowHover,
  menu: adminSurface.menuItem,
  dropdown: adminSurface.dropdown,
};

/** Re-export table primitives — use inside DataTableShell */
export { default as AdminSectionHeader } from "@/components/ui/AdminSectionHeader";
export { AdminSideNav, AdminSideNavItem, AdminSideNavList } from "@/components/ui/AdminSideNav";

export {
  AdminTable,
  AdminTableHead,
  AdminTableHeadRow,
  AdminTableTh,
  AdminTableThActions,
  AdminTableBody,
  AdminTableRow,
  AdminTableTd,
  AdminTableActionsCell,
  AdminTableIconButton,
} from "@/components/ui/AdminTable";
