"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { raToggleOnCls } from "@/config/restaurantAdminTheme";

export default function ToggleSwitch({ checked, onChange, label, hint }) {
  return (
    <label className={`flex items-start justify-between gap-3 rounded-xl border admin-shell-border px-3 py-3 sm:gap-4 sm:px-4 ${adminSurface.card}`}>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${adminSurface.title}`}>{label}</span>
        {hint ? <span className={`mt-0.5 block text-xs ${adminSurface.muted}`}>{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? raToggleOnCls : "bg-[var(--admin-border)]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
