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
import {
  DEFAULT_FOOTER_ACCOUNT_LINKS,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SOCIAL_LINKS,
  ensureNavItems,
} from "@/lib/layoutNavDefaults";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FooterLayoutEditor({
  theme,
  setTheme,
  saving,
  onSaveDraft,
  onPublish,
  onBack,
}) {
  const footer = theme.footer ?? {};
  const colors = footer.colors ?? {};
  const setFooter = (patch) => setTheme((p) => ({ ...p, footer: { ...p.footer, ...patch } }));
  const setColors = (k, v) =>
    setTheme((p) => ({
      ...p,
      footer: { ...p.footer, colors: { ...p.footer?.colors, [k]: v } },
    }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 border-b admin-shell-border pb-4">
        <div>
          <h3 className="admin-surface-title text-lg font-semibold">Edit Footer</h3>
          <p className="text-sm admin-surface-muted">Footer content, links, colors, and newsletter</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border admin-shell-border px-3 py-2 text-sm admin-surface-body hover:border-ra-primary-40"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <LayoutColorRow
          label="Background color"
          value={colors.background}
          onChange={(v) => setColors("background", v)}
        />
        <LayoutColorRow label="Font color" value={colors.font} onChange={(v) => setColors("font", v)} />
      </div>

      <p className="rounded-xl border admin-shell-border bg-zinc-950/40 px-3 py-2.5 text-xs admin-surface-muted">
        Logo images are set under <strong className="admin-surface-body">Website layout → Header → Logo upload</strong>{" "}
        (header logo + dark mode logo). Footer uses the dark logo automatically.
      </p>

      <LayoutSection
        title="Company description"
        subtitle="Short text under the logo"
        enabled={footer.showDescription !== false}
        onToggle={() => setFooter({ showDescription: footer.showDescription === false })}
      >
        <textarea
          rows={3}
          value={footer.tagline ?? ""}
          onChange={(e) => setFooter({ tagline: e.target.value })}
          placeholder="We are committed to delivering your favorite food quickly…"
          maxLength={150}
          className={layoutInputCls + " resize-none"}
        />
        <p className="text-right text-[10px] admin-surface-faint">{(footer.tagline ?? "").length}/150</p>
      </LayoutSection>

      <LayoutSection
        title="Opening hours"
        subtitle="From Settings → Hours"
        enabled={footer.showOpeningHours !== false}
        onToggle={() => setFooter({ showOpeningHours: footer.showOpeningHours === false })}
      >
        <p className="text-xs admin-surface-muted">
          Hours are loaded from{" "}
          <Link href="/settings" className="text-ra-primary hover:underline">
            Settings → Hours
          </Link>
          .
        </p>
      </LayoutSection>

      <LayoutSection
        title="App download buttons"
        subtitle="Optional App Store / Play Store links"
        enabled={footer.showAppDownload === true}
        onToggle={() => setFooter({ showAppDownload: !footer.showAppDownload })}
      >
        <label className="flex items-center gap-2 text-sm admin-surface-body">
          <input
            type="checkbox"
            checked={footer.showAppleStore !== false}
            onChange={() => setFooter({ showAppleStore: footer.showAppleStore === false })}
            className="accent-ra-primary"
          />
          Apple App Store
        </label>
        <LayoutField label="Apple Store link">
          <input
            value={footer.appStoreUrl ?? ""}
            onChange={(e) => setFooter({ appStoreUrl: e.target.value })}
            placeholder="https://apps.apple.com/..."
            className={layoutInputCls}
          />
        </LayoutField>
        <label className="flex items-center gap-2 text-sm admin-surface-body">
          <input
            type="checkbox"
            checked={footer.showPlayStore !== false}
            onChange={() => setFooter({ showPlayStore: footer.showPlayStore === false })}
            className="accent-ra-primary"
          />
          Google Play Store
        </label>
        <LayoutField label="Play Store link">
          <input
            value={footer.playStoreUrl ?? ""}
            onChange={(e) => setFooter({ playStoreUrl: e.target.value })}
            placeholder="https://play.google.com/..."
            className={layoutInputCls}
          />
        </LayoutField>
      </LayoutSection>

      <LayoutSection
        title="Newsletter"
        subtitle="Email signup strip above the bottom bar"
        enabled={footer.showNewsletter !== false}
        onToggle={() => setFooter({ showNewsletter: footer.showNewsletter === false })}
      >
        <LayoutField label="Title">
          <input
            value={footer.newsletterTitle ?? ""}
            onChange={(e) => setFooter({ newsletterTitle: e.target.value })}
            className={layoutInputCls}
          />
        </LayoutField>
        <LayoutField label="Subtitle">
          <textarea
            rows={2}
            maxLength={150}
            value={footer.newsletterSubtitle ?? ""}
            onChange={(e) => setFooter({ newsletterSubtitle: e.target.value })}
            className={layoutInputCls + " resize-none"}
          />
        </LayoutField>
        <LayoutField label="Email placeholder">
          <input
            value={footer.newsletterPlaceholder ?? ""}
            onChange={(e) => setFooter({ newsletterPlaceholder: e.target.value })}
            className={layoutInputCls}
          />
        </LayoutField>
      </LayoutSection>

      <LayoutSection
        title="Quick links"
        subtitle="Footer navigation column"
        enabled={footer.showQuickLinks !== false}
        onToggle={() => setFooter({ showQuickLinks: footer.showQuickLinks === false })}
      >
        <CmsNavItemsEditor
          items={footer.quickLinks?.length ? footer.quickLinks : DEFAULT_FOOTER_QUICK_LINKS}
          onChange={(quickLinks) => setFooter({ quickLinks })}
        />
      </LayoutSection>

      <LayoutSection
        title="My account links"
        subtitle="Profile, orders, reservations"
        enabled={footer.showAccountLinks !== false}
        onToggle={() => setFooter({ showAccountLinks: footer.showAccountLinks === false })}
      >
        <CmsNavItemsEditor
          items={footer.accountLinks?.length ? footer.accountLinks : DEFAULT_FOOTER_ACCOUNT_LINKS}
          onChange={(accountLinks) => setFooter({ accountLinks })}
        />
      </LayoutSection>

      <LayoutSection
        title="Social media icons"
        subtitle="Footer icons on/off. Paste URLs on Website layout main screen → Social media links."
        enabled={footer.showSocialLinks !== false}
        onToggle={() => setFooter({ showSocialLinks: footer.showSocialLinks === false })}
      >
        <div className="space-y-2">
          {ensureNavItems(footer.socialLinks, DEFAULT_FOOTER_SOCIAL_LINKS).map((item, index) => (
            <LayoutToggle
              key={item.id}
              label={item.label}
              hint={`ID: ${item.id} — URL from Website layout`}
              enabled={item.enabled !== false}
              onToggle={() => {
                const list = ensureNavItems(footer.socialLinks, DEFAULT_FOOTER_SOCIAL_LINKS).map(
                  (i) => ({ ...i })
                );
                list[index] = { ...list[index], enabled: list[index].enabled === false };
                setFooter({ socialLinks: list });
              }}
            />
          ))}
        </div>
      </LayoutSection>

      <LayoutSection
        title="Copyright"
        subtitle="Bottom copyright line"
        enabled={footer.showCopyright !== false}
        onToggle={() => setFooter({ showCopyright: footer.showCopyright === false })}
      >
        <LayoutField label="Copyright text" hint="Leave empty for © Year + restaurant name">
          <input
            value={footer.copyrightText ?? ""}
            onChange={(e) => setFooter({ copyrightText: e.target.value })}
            placeholder="Your Restaurant © 2026. All Rights Reserved"
            className={layoutInputCls}
          />
        </LayoutField>
        <LayoutField label="Extra line (optional)">
          <input
            value={footer.copyrightNote ?? ""}
            onChange={(e) => setFooter({ copyrightNote: e.target.value })}
            className={layoutInputCls}
          />
        </LayoutField>
      </LayoutSection>

      <LayoutField label="Help box title">
        <input
          value={footer.helpTitle ?? ""}
          onChange={(e) => setFooter({ helpTitle: e.target.value })}
          className={layoutInputCls}
        />
      </LayoutField>
      <LayoutField label="Help box subtitle">
        <input
          value={footer.helpSubtitle ?? ""}
          onChange={(e) => setFooter({ helpSubtitle: e.target.value })}
          className={layoutInputCls}
        />
      </LayoutField>

      <CmsSaveActions
        section="theme"
        saving={saving}
        onSaveDraft={() => onSaveDraft("theme", theme)}
        onPublish={() => onPublish("theme", theme)}
        publishLabel="Publish footer"
      />
    </div>
  );
}
