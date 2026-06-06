"use client";

import {
  CMS_EDITOR_CONTROL_ROW,
  CMS_EDITOR_INPUT,
  CMS_EDITOR_PANEL,
  CMS_EDITOR_PANEL_HEAD,
} from "@/config/customerSiteEditorClasses";

export const layoutInputCls = CMS_EDITOR_INPUT;

export function LayoutField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium admin-surface-muted">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] admin-surface-faint">{hint}</p>}
    </div>
  );
}

export function LayoutColorRow({ label, value, onChange }) {
  const hex = value?.match(/^#[0-9A-Fa-f]{6}$/) ? value : "#ffffff";
  return (
    <div className={CMS_EDITOR_CONTROL_ROW}>
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="size-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium admin-shell-text">{label}</p>
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#FFFFFF"
          className="mt-1 w-full bg-transparent font-mono text-xs admin-surface-muted outline-none"
        />
      </div>
    </div>
  );
}

export function LayoutToggle({ label, hint, enabled, onToggle }) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-3 ${CMS_EDITOR_CONTROL_ROW}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium admin-shell-text">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug admin-surface-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="mt-0.5 size-4 shrink-0 rounded border-[var(--admin-border)] accent-ra-primary"
      />
    </label>
  );
}

export function LayoutSection({ title, subtitle, enabled, onToggle, children }) {
  return (
    <div className={CMS_EDITOR_PANEL}>
      <div className={CMS_EDITOR_PANEL_HEAD}>
        <div className="min-w-0 flex-1">
          <p className="admin-surface-title text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs admin-surface-muted">{subtitle}</p>}
        </div>
        {onToggle != null && (
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            className="size-4 shrink-0 self-start rounded border-[var(--admin-border)] accent-ra-primary sm:self-center"
          />
        )}
      </div>
      {enabled !== false && <div className="space-y-3 p-4">{children}</div>}
    </div>
  );
}
