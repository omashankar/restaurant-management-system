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
    <label className={`cursor-pointer ${CMS_EDITOR_CONTROL_ROW}`}>
      <div>
        <p className="text-sm font-medium admin-shell-text">{label}</p>
        {hint && <p className="text-xs admin-surface-muted">{hint}</p>}
      </div>
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="size-4 rounded border-[var(--admin-border)] accent-ra-primary"
      />
    </label>
  );
}

export function LayoutSection({ title, subtitle, enabled, onToggle, children }) {
  return (
    <div className={CMS_EDITOR_PANEL}>
      <div className={CMS_EDITOR_PANEL_HEAD}>
        <div>
          <p className="admin-surface-title text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs admin-surface-muted">{subtitle}</p>}
        </div>
        {onToggle != null && (
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            className="size-4 rounded border-[var(--admin-border)] accent-ra-primary"
          />
        )}
      </div>
      {enabled !== false && <div className="space-y-3 p-4">{children}</div>}
    </div>
  );
}
