"use client";

import AdminSectionHeader from "@/components/ui/AdminSectionHeader";
import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { resolveSettingsPanelSection } from "@/config/settingsConfig";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function SectionCard({
  sectionId,
  title,
  description,
  icon,
  children,
  onSave,
  data,
}) {
  const meta = sectionId
    ? resolveSettingsPanelSection(sectionId, { title, description, icon, Icon: icon })
    : { title, description, Icon: icon };
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  return (
    <section className={`${adminSurface.cardSolid} p-5 sm:p-6`}>
      {meta.Icon && meta.title ? (
        <AdminSectionHeader
          brand="ra"
          icon={meta.Icon}
          title={meta.title}
          description={meta.description}
          className="mb-5"
        />
      ) : (
        <div className="mb-5">
          <h2 className={`text-lg font-semibold ${adminSurface.title}`}>{meta.title}</h2>
          {meta.description && <p className={`mt-1 text-sm ${adminSurface.muted}`}>{meta.description}</p>}
        </div>
      )}
      {children}
      {onSave && (
        <div className={`mt-6 flex justify-end border-t ${adminShell.borderT} pt-4`}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className={adminSurface.label}>{label}</label>
      {children}
      {hint && <p className={`mt-1 text-xs ${adminSurface.faint}`}>{hint}</p>}
    </div>
  );
}

export function Input({ value, onChange, type = "text", placeholder = "", disabled = false, className = "" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${adminSurface.input} focus-ra-primary disabled:opacity-50 ${className}`}
    />
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border ${adminShell.borderB} px-4 py-3`}
      style={{ backgroundColor: "var(--admin-control)" }}
    >
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${adminSurface.body}`}>{label}</span>
        {hint && <span className={`mt-0.5 block text-xs ${adminSurface.muted}`}>{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-ra-primary" : "bg-zinc-700"
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
