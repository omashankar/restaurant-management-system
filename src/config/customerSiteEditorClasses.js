/** Shared layout classes for Customer Site admin editor (full-width panel). */

export const CMS_EDITOR_SECTION = "w-full space-y-5";

export const CMS_EDITOR_SECTION_TIGHT = "w-full space-y-3";

/** Grouped fields row (tags, section headers, cards) — theme-aware border */
export const CMS_EDITOR_GROUP = "rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-3 space-y-2";

/** Nested group without extra background */
export const CMS_EDITOR_GROUP_FLAT = "rounded-xl border border-[var(--admin-border-subtle)] p-3 space-y-2";

/** Standard text input inside CMS editor */
export const CMS_EDITOR_INPUT =
  "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm outline-none placeholder:admin-surface-faint transition-colors";

export const CMS_EDITOR_TEXTAREA = CMS_EDITOR_INPUT + " resize-none";

/** Promo / media row: image left, fields right on large screens */
export const CMS_MEDIA_FORM_ROW =
  "rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-4 space-y-4 lg:grid lg:grid-cols-[minmax(260px,380px)_1fr] lg:gap-6 lg:items-start lg:space-y-0";

/** Toggle / control row */
export const CMS_EDITOR_TOGGLE_ROW =
  "flex items-center justify-between rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-4 py-3";

/** Panel section with header divider */
export const CMS_EDITOR_PANEL =
  "rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] overflow-hidden";

export const CMS_EDITOR_PANEL_HEAD =
  "flex items-center justify-between gap-3 admin-surface-divider-b px-4 py-3";

/** Inline control chip (color row, checkbox row) */
export const CMS_EDITOR_CONTROL_ROW =
  "flex items-center gap-3 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2.5";
