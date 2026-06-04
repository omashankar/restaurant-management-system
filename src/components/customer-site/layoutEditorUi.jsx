"use client";

export const layoutInputCls =
  "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm outline-none focus-ra-primary placeholder:admin-surface-faint";

export function LayoutField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

export function LayoutColorRow({ label, value, onChange }) {
  const hex = value?.match(/^#[0-9A-Fa-f]{6}$/) ? value : "#ffffff";
  return (
    <div className="flex items-center gap-3 rounded-xl border admin-shell-border bg-zinc-950/40 px-3 py-2.5">
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
          className="mt-1 w-full bg-transparent font-mono text-xs text-zinc-400 outline-none"
        />
      </div>
    </div>
  );
}

export function LayoutToggle({ label, hint, enabled, onToggle }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border admin-shell-border bg-zinc-950/40 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium admin-shell-text">{label}</p>
        {hint && <p className="text-xs admin-surface-muted">{hint}</p>}
      </div>
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="size-4 rounded border-zinc-600 accent-ra-primary"
      />
    </label>
  );
}

export function LayoutSection({ title, subtitle, enabled, onToggle, children }) {
  return (
    <div className="rounded-xl border admin-shell-border bg-zinc-950/30 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b admin-shell-border px-4 py-3">
        <div>
          <p className="admin-surface-title text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs admin-surface-muted">{subtitle}</p>}
        </div>
        {onToggle != null && (
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            className="size-4 rounded border-zinc-600 accent-ra-primary"
          />
        )}
      </div>
      {enabled !== false && <div className="space-y-3 p-4">{children}</div>}
    </div>
  );
}
