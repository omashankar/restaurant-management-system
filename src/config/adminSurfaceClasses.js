/** Shell + page surface classes — dark/light via admin-surface-theme.css */

/** Portaled overlays (Modal, ConfirmDialog, POS pickers) */
export const adminPortalScope = "admin-portal-scope";

/** Portaled header menus — solid surface + above POS sticky bars */
export const adminHeaderDropdownPortal =
  "admin-portal-scope admin-header-dropdown-portal fixed z-[200]";

/** Mobile sidebar drawer — above header + header dropdowns, below modals (z-[300]+) */
export const adminMobileOverlay =
  "admin-mobile-overlay fixed inset-0 z-[250] transition-opacity duration-200 md:hidden";

/** Page side/bottom drawers (ticket detail, etc.) — above header + nav, below modals (z-[300]+) */
export const adminPageDrawerOverlay =
  "admin-portal-scope fixed inset-0 z-[280] flex items-end justify-center bg-[var(--admin-overlay)] sm:items-stretch sm:justify-end";

/** Modals / confirm dialogs — above page drawers, below toast banners (z-[320]+) */
export const adminModalOverlay =
  "admin-portal-scope fixed inset-0 z-[300] flex min-w-0 items-end justify-center overflow-hidden sm:items-center sm:p-4 md:p-6";

export const adminShell = {
  page: "admin-shell-bg",
  layout: "admin-shell-bg h-screen overflow-hidden",
  pageCentered: "admin-shell-bg flex min-h-screen items-center justify-center",
  sidebar:
    "admin-shell-sidebar relative flex h-full shrink-0 flex-col border-r admin-shell-border transition-[width] duration-300 ease-out",
  header:
    "admin-shell-header sticky top-0 z-[100] flex h-16 items-center justify-between gap-4 overflow-visible border-b admin-shell-border px-4 backdrop-blur-md isolation-isolate",
  headerCompact:
    "admin-shell-header sticky top-0 z-[100] flex h-14 items-center justify-between overflow-visible border-b admin-shell-border px-4 backdrop-blur-md isolation-isolate",
  headerDesktop:
    "admin-shell-header sticky top-0 z-[100] hidden h-16 items-center justify-between gap-4 overflow-visible border-b admin-shell-border px-4 backdrop-blur-md isolation-isolate md:flex",
  borderB: "border-b admin-shell-border",
  borderT: "border-t admin-shell-border",
  border: "border admin-shell-border",
  ringSubtle: "ring-1 ring-[var(--admin-border-subtle)]",
  dividerB: "admin-surface-divider-b",
  dividerT: "admin-surface-divider-t",
  borderR: "border-r admin-shell-border",
  text: "admin-shell-text",
  muted: "admin-shell-muted",
  control:
    "admin-shell-control inline-flex items-center justify-center rounded-xl border admin-shell-border transition-colors",
  controlHover: "hover:admin-shell-hover",
  divider: "admin-shell-divider",
  tableBody: "admin-table-body",
  dropdown: "rounded-xl border admin-shell-border admin-shell-elevated p-1.5 shadow-lg admin-shell-dropdown-shadow",
  pageContent: "admin-page-content",
};

/** Semantic page chrome — prefer these over raw zinc-* in admin UIs */
export const adminSurface = {
  card: "admin-surface-card",
  cardSolid: "admin-surface-card-solid",
  tableShell: "admin-surface-table-shell",
  heading: "admin-surface-heading",
  title: "admin-surface-title",
  subheading: "admin-surface-subheading",
  label: "admin-surface-label",
  muted: "admin-surface-muted",
  faint: "admin-surface-faint",
  body: "admin-surface-body",
  input: "admin-surface-input",
  /** Search with leading icon — use inside SearchField or .admin-search-wrap */
  searchInput: "admin-surface-input admin-search-input",
  searchCompact: "admin-surface-search admin-search-input",
  search: "admin-surface-search",
  btnGhost: "admin-surface-btn-ghost",
  btnIcon: "admin-surface-btn-icon",
  /** Sidebar expand/collapse — same chrome as icon buttons */
  sidebarToggle: "admin-surface-sidebar-toggle",
  popover: "admin-surface-popover",
  empty: "admin-surface-empty",
  emptyIcon: "admin-surface-empty-icon",
  segmentTrack: "admin-surface-segment-track",
  segmentBtn: "admin-surface-segment-btn",
  segmentBtnActive: "admin-surface-segment-btn-active",
  progressTrack: "admin-progress-track",
  chartTooltip: "admin-chart-tooltip",
  rankBadge: "admin-rank-badge",
  rowHover: "admin-surface-row-hover",
  dashedBox: "admin-surface-dashed-box",
  tooltip: "admin-surface-tooltip",
  /** Floating panels — profile menu, search results, sidebar flyout */
  dropdown: "admin-surface-dropdown",
  menuItem: "admin-surface-menu-item",
  pageTitle: "admin-page-title",
  pageDesc: "admin-page-desc",
  navLink:
    "admin-nav-link relative group flex rounded-xl text-sm font-medium transition-all duration-200",
  navLinkCollapsed: "admin-nav-link size-11 items-center justify-center p-0",
  navLinkExpanded: "admin-nav-link w-full items-center gap-3 px-3 py-2.5",
  navGroupBtn:
    "admin-nav-group-btn cursor-pointer relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
};
