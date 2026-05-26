"use client";

import CmsImageField from "@/components/customer-site/CmsImageField";
import CmsSaveActions from "@/components/customer-site/CmsSaveActions";
import FooterLayoutEditor from "@/components/customer-site/FooterLayoutEditor";
import HeaderLayoutEditor from "@/components/customer-site/HeaderLayoutEditor";
import {
  LayoutColorRow,
  LayoutField,
  LayoutToggle,
  layoutInputCls,
} from "@/components/customer-site/layoutEditorUi";
import SocialUrlsEditor from "@/components/customer-site/SocialUrlsEditor";
import { CMS_EDITOR_SECTION } from "@/config/customerSiteEditorClasses";
import { CUSTOMER_FONT_OPTIONS } from "@/lib/customerThemeDefaults";
import { ChevronRight, Pencil } from "lucide-react";
import { useState } from "react";

export default function WebsiteLayoutTab({
  theme,
  setTheme,
  social,
  setSocial,
  saving,
  onSaveDraft,
  onPublish,
}) {
  const [view, setView] = useState(null);
  const set = (k, v) => setTheme((p) => ({ ...p, [k]: v }));

  if (view === "header") {
    return (
      <HeaderLayoutEditor
        theme={theme}
        setTheme={setTheme}
        saving={saving}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onBack={() => setView(null)}
      />
    );
  }

  if (view === "footer") {
    return (
      <FooterLayoutEditor
        theme={theme}
        setTheme={setTheme}
        saving={saving}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onBack={() => setView(null)}
      />
    );
  }

  return (
    <div className={CMS_EDITOR_SECTION}>
      <p className="text-sm text-zinc-400">
        Global theme plus full <strong className="text-zinc-200">header</strong> and{" "}
        <strong className="text-zinc-200">footer</strong> editors — similar to FoodLay website layout.
        Upload full logo images in <strong className="text-zinc-300">Header</strong> (no text beside logo on site).
        Fallback logo: <strong className="text-zinc-300">Settings → General</strong>.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <LayoutColorRow
          label="Primary color"
          value={theme.primaryColor}
          onChange={(v) => set("primaryColor", v)}
        />
        <LayoutColorRow
          label="Secondary color"
          value={theme.secondaryColor}
          onChange={(v) => set("secondaryColor", v)}
        />
        <LayoutField label="Theme font">
          <select
            value={theme.fontFamily ?? CUSTOMER_FONT_OPTIONS[0].value}
            onChange={(e) => set("fontFamily", e.target.value)}
            className={layoutInputCls}
          >
            {CUSTOMER_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </LayoutField>
        <LayoutField label="Default mode">
          <select
            value={theme.colorMode === "dark" ? "dark" : "light"}
            onChange={(e) => set("colorMode", e.target.value)}
            className={layoutInputCls}
          >
            <option value="light">Light mode</option>
            <option value="dark">Dark mode (beta)</option>
          </select>
        </LayoutField>
      </div>

      <CmsImageField
        label="Favicon"
        value={theme.faviconUrl ?? ""}
        onChange={(v) => set("faviconUrl", v)}
        previewClassName="size-16 object-contain rounded-lg bg-white p-2"
      />

      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Header & footer</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setView("header")}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-4 text-left transition-colors hover:border-emerald-500/40 hover:bg-zinc-900/60"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Pencil className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-100">Header</p>
            <p className="text-xs text-zinc-500">Menu, colors, location bar, search</p>
          </div>
          <ChevronRight className="size-5 text-zinc-500" />
        </button>
        <button
          type="button"
          onClick={() => setView("footer")}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-4 text-left transition-colors hover:border-emerald-500/40 hover:bg-zinc-900/60"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Pencil className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-100">Footer</p>
            <p className="text-xs text-zinc-500">Links, newsletter, hours, copyright</p>
          </div>
          <ChevronRight className="size-5 text-zinc-500" />
        </button>
      </div>

      <SocialUrlsEditor
        social={social}
        setSocial={setSocial}
        saving={saving}
        onSaveDraft={() => onSaveDraft("social", social)}
        onPublish={() => onPublish("social", social)}
      />

      <CmsSaveActions
        section="theme"
        saving={saving}
        onSaveDraft={() => onSaveDraft("theme", theme)}
        onPublish={() => onPublish("theme", theme)}
        publishLabel="Publish layout"
      />
    </div>
  );
}
