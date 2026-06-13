/** Shared layout classes for Customer Site admin editor (full-width panel). */

/** Mode-stable labels — use instead of text-zinc-* inside admin CMS */
export const CMS_LABEL = "mb-1.5 block text-xs font-medium admin-surface-muted";
export const CMS_HINT = "mt-1 text-[11px] leading-snug admin-surface-faint";
export const CMS_SECTION_TITLE =
  "text-xs font-semibold uppercase tracking-wide admin-surface-faint";
export const CMS_EDITOR_WELL =
  "cms-editor-well rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-3";

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

/** Promo / media row: stack on tablet; side-by-side only when the CMS panel is wide enough */
export const CMS_MEDIA_FORM_ROW =
  "cms-media-form-row min-w-0 w-full max-w-full rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-3 flex flex-col gap-4 sm:p-4 xl:grid xl:grid-cols-[minmax(15rem,22.5rem)_minmax(0,1fr)] xl:items-start xl:gap-6";

/** Toggle / control row */
export const CMS_EDITOR_TOGGLE_ROW =
  "flex items-center justify-between gap-3 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-3 sm:px-4";

/** Panel section with header divider */
export const CMS_EDITOR_PANEL =
  "rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] overflow-hidden min-w-0";

export const CMS_EDITOR_PANEL_HEAD =
  "flex flex-col gap-3 admin-surface-divider-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between";

/** Inline control chip (color row, checkbox row) */
export const CMS_EDITOR_CONTROL_ROW =
  "flex items-center gap-3 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2.5";
