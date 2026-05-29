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
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-50">Edit Header</h3>
          <p className="text-sm text-zinc-500">Navbar, top bar, colors, and menu links</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500/40"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Logo upload</p>
      <p className="text-sm text-zinc-400">
        Upload your full brand image (icon + name in one file). No separate HTML text is shown on the
        customer site — only these images. Empty fields use Settings → General logo.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <CmsImageField
          label="Header logo (light background)"
          hint="Navbar & light areas. Wide PNG/SVG recommended."
          value={header.logoUrl ?? ""}
          onChange={(v) => setHeader({ logoUrl: v })}
          disabled={saving === "theme"}
          previewClassName="ct-brand-logo ct-brand-logo--sm w-full max-w-xs bg-white rounded-lg p-3"
        />
        <CmsImageField
          label="Dark mode logo"
          hint="Footer & dark header bar — often white/light wordmark."
          value={header.logoDarkUrl ?? ""}
          onChange={(v) => setHeader({ logoDarkUrl: v })}
          disabled={saving === "theme"}
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
        hint="Header stays at top when scrolling"
        enabled={header.sticky !== false}
        onToggle={() => setHeader({ sticky: header.sticky === false })}
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
