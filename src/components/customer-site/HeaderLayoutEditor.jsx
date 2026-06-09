"use client";

import CmsImageField from "@/components/customer-site/CmsImageField";
import CmsNavItemsEditor from "@/components/customer-site/CmsNavItemsEditor";
import CmsSaveActions from "@/components/customer-site/CmsSaveActions";
import {
  LayoutColorRow,
  LayoutField,
  LayoutSection,
  LayoutToggle,
  layoutInputCls,
} from "@/components/customer-site/layoutEditorUi";
import { isCmsSaving } from "@/config/customerSiteDraft";
import { DEFAULT_HEADER_MENU } from "@/lib/layoutNavDefaults";
import { ArrowLeft } from "lucide-react";

export default function HeaderLayoutEditor({
  theme,
  setTheme,
  saving,
  onSaveDraft,
  onPublish,
  onBack,
}) {
  const header = theme.header ?? {};
  const colors = header.colors ?? {};
  const setHeader = (patch) => setTheme((p) => ({ ...p, header: { ...p.header, ...patch } }));
  const setColors = (k, v) =>
    setTheme((p) => ({
      ...p,
      header: { ...p.header, colors: { ...p.header?.colors, [k]: v } },
    }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 admin-surface-divider-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="admin-surface-title text-lg font-semibold">Edit Header</h3>
          <p className="text-sm admin-surface-muted">Navbar, top bar, colors, and menu links</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2 text-sm admin-surface-body transition-colors hover:border-ra-primary-40 hover:bg-[var(--admin-hover)] sm:w-auto"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Logo upload</p>
      <p className="text-sm admin-surface-muted">
        Upload your full brand image (icon + name in one file). With &quot;Show restaurant name as text&quot;
        off, only the image is shown. Empty fields use Settings → General logo.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <CmsImageField
          label="Header logo (light background)"
          hint="Navbar & light areas. Wide PNG/SVG recommended."
          value={header.logoUrl ?? ""}
          onChange={(v) => setHeader({ logoUrl: v })}
          disabled={isCmsSaving(saving)}
          previewClassName="ct-brand-logo ct-brand-logo--sm w-full max-w-xs bg-white rounded-lg p-3"
        />
        <CmsImageField
          label="Dark mode logo"
          hint="Footer & dark header bar — often white/light wordmark."
          value={header.logoDarkUrl ?? ""}
          onChange={(v) => setHeader({ logoDarkUrl: v })}
          disabled={isCmsSaving(saving)}
          previewClassName="ct-brand-logo ct-brand-logo--md w-full max-w-xs bg-[#111827] rounded-lg p-3"
        />
      </div>
      <LayoutToggle
        label="Show restaurant name as text beside logo"
        hint="Off = image only (recommended). On = adds name from Settings next to small icon."
        enabled={header.showBrandText === true}
        onToggle={() => setHeader({ showBrandText: header.showBrandText !== true })}
      />

      <LayoutToggle
        label="Sticky header"
        hint="On = navbar stays fixed at top while scrolling. Click Publish header after changing."
        enabled={header.sticky !== false}
        onToggle={() => setHeader({ sticky: header.sticky === false ? true : false })}
      />

      <LayoutToggle
        label="Show location bar"
        enabled={header.showLocationBar !== false}
        onToggle={() => setHeader({ showLocationBar: header.showLocationBar === false })}
      />
      {header.showLocationBar !== false && (
        <LayoutField label="Location label" hint="Empty = first line of address from Settings">
          <input
            value={header.locationLabel ?? ""}
            onChange={(e) => setHeader({ locationLabel: e.target.value })}
            placeholder="Select Your Location"
            className={layoutInputCls}
          />
        </LayoutField>
      )}

      <LayoutToggle
        label="Show search"
        enabled={header.showSearch !== false}
        onToggle={() => setHeader({ showSearch: header.showSearch === false })}
      />

      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Header colors</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LayoutColorRow label="Background" value={colors.background} onChange={(v) => setColors("background", v)} />
        <LayoutColorRow label="Font" value={colors.font} onChange={(v) => setColors("font", v)} />
        <LayoutColorRow label="Icons" value={colors.icon} onChange={(v) => setColors("icon", v)} />
      </div>

      <LayoutSection title="Header menu" subtitle="Links shown in the main navbar (reorder, hide, or edit)">
        <CmsNavItemsEditor
          items={header.menuItems?.length ? header.menuItems : DEFAULT_HEADER_MENU}
          onChange={(menuItems) => setHeader({ menuItems })}
          addLabel="Add menu item"
        />
      </LayoutSection>

      <CmsSaveActions
        section="theme"
        saving={saving}
        onSaveDraft={() => onSaveDraft("theme", theme)}
        onPublish={() => onPublish("theme", theme)}
        publishLabel="Publish header"
      />
    </div>
  );
}
