"use client";

import CmsImageField from "@/components/customer-site/CmsImageField";
import {
  AboutExtrasFields,
  BookingPageTab,
  ContactPageTab,
  HomeSectionsTab,
  MenuLabelsTab,
} from "@/components/customer-site/CustomerSiteExtendedTabs";
import CmsSaveActions from "@/components/customer-site/CmsSaveActions";
import CustomerSiteSidebar from "@/components/customer-site/CustomerSiteSidebar";
import CustomerSiteTabHeader from "@/components/customer-site/CustomerSiteTabHeader";
import WebsiteLayoutTab from "@/components/customer-site/WebsiteLayoutTab";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { publishHeadlineForSection } from "@/config/customerSiteDraft";
import {
  CUSTOMER_SITE_TABS,
  CUSTOMER_SITE_TAB_IDS,
  getCustomerSiteTab,
} from "@/config/customerSiteTabs";
import {
  CMS_EDITOR_SECTION,
  CMS_EDITOR_SECTION_TIGHT,
  CMS_MEDIA_FORM_ROW,
} from "@/config/customerSiteEditorClasses";
import {
  MANAGED_ELSEWHERE,
  SETTINGS_FOR_CUSTOMER_SITE,
} from "@/config/customerSiteGuide";
import { useToast } from "@/hooks/useToast";
import { invalidateRestaurantCmsCache } from "@/hooks/useRestaurantCms";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import {
  Globe, Loader2, Megaphone, Info, Sparkles,
  ToggleLeft, ToggleRight, ExternalLink, Plus, Trash2, Layers,
  UtensilsCrossed, Phone, ChevronRight, Home, Settings, Rocket, RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function emptyBanner(id) {
  return {
    id,
    enabled: true,
    title: "",
    subtitle: "",
    badge: "Offer",
    discount: "",
    image: "",
    ctaLabel: "Order Now",
    ctaLink: "/order/menu",
    secondaryCtaLabel: "",
    secondaryCtaLink: "",
  };
}

const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 transition-colors";
const textareaCls = inputCls + " resize-none";

function Field({ label, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function ensureHeroThumbnails(list) {
  const base = Array.isArray(list) ? [...list] : [];
  while (base.length < 3) base.push({ label: "", imageUrl: "" });
  return base.slice(0, 3);
}

function ensureAboutSideImages(list) {
  const base = Array.isArray(list) ? [...list] : [];
  while (base.length < 3) base.push({ imageUrl: "" });
  return base.slice(0, 3);
}

function ensureAboutStats(list) {
  const base = Array.isArray(list) ? [...list] : [];
  while (base.length < 3) base.push({ value: "", label: "" });
  return base.slice(0, 3);
}

function ToggleRow({ label, hint, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      <button type="button" onClick={onToggle} className="text-emerald-400">
        {enabled ? <ToggleRight className="size-8" /> : <ToggleLeft className="size-8 text-zinc-600" />}
      </button>
    </div>
  );
}

const OVERVIEW_SECTIONS = CUSTOMER_SITE_TABS.filter((t) => t.id !== "overview").map((t) => ({
  tab: t.id,
  label: t.label,
  page: t.pages?.join(", ") ?? "",
  icon: t.icon,
}));

export default function CustomerSitePage() {
  const { showToast, ToastUI } = useToast();
  const panelRef = useRef(null);
  const publishedRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [draftSections, setDraftSections] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState({ ...DEFAULTS.theme });

  const [hero, setHero] = useState(() => ({
    ...DEFAULTS.hero,
    thumbnails: ensureHeroThumbnails(DEFAULTS.hero.thumbnails),
  }));
  const [announcement, setAnnouncement] = useState({ ...DEFAULTS.announcement });
  const [about, setAbout] = useState(() => ({
    ...DEFAULTS.about,
    sideImages: ensureAboutSideImages(DEFAULTS.about.sideImages),
    stats: ensureAboutStats(DEFAULTS.about.stats),
  }));
  const [social, setSocial] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
    youtube: "",
  });
  const [banners, setBanners] = useState(DEFAULTS.banners);
  const [home, setHome] = useState({ ...DEFAULTS.home });
  const [contact, setContact] = useState({ ...DEFAULTS.contact });
  const [booking, setBooking] = useState({ ...DEFAULTS.booking });
  const [menu, setMenu] = useState({ ...DEFAULTS.menu });
  const activeTabMeta = getCustomerSiteTab(activeTab);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "social") setActiveTab("theme");
    else if (tab && CUSTOMER_SITE_TAB_IDS.includes(tab)) setActiveTab(tab);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [cmsRes, settingsRes] = await Promise.all([
          fetch("/api/restaurant-cms"),
          fetch("/api/settings"),
        ]);
        const [cmsData, settingsData] = await Promise.all([cmsRes.json(), settingsRes.json()]);
        if (cmsData.success && cmsData.content) {
          const c = cmsData.content;
          if (c.hero) {
            const merged = mergeCmsSection(DEFAULTS.hero, c.hero);
            setHero({
              ...merged,
              thumbnails: ensureHeroThumbnails(merged.thumbnails),
              quickPills:
                Array.isArray(merged.quickPills) && merged.quickPills.length > 0
                  ? merged.quickPills
                  : DEFAULTS.hero.quickPills,
            });
          }
          if (c.announcement) {
            setAnnouncement(mergeCmsSection(DEFAULTS.announcement, c.announcement));
          }
          if (c.about) {
            const merged = mergeCmsSection(DEFAULTS.about, c.about);
            setAbout({
              ...merged,
              sideImages: ensureAboutSideImages(merged.sideImages),
              stats: ensureAboutStats(merged.stats),
              promises:
                Array.isArray(merged.promises) && merged.promises.length > 0
                  ? merged.promises
                  : DEFAULTS.about.promises,
            });
          }
          if (c.social) setSocial((p) => ({ ...p, ...c.social }));
          if (Array.isArray(c.banners)) setBanners(c.banners);
          if (c.home) setHome(mergeCmsSection(DEFAULTS.home, c.home));
          if (c.contact) setContact(mergeCmsSection(DEFAULTS.contact, c.contact));
          if (c.booking) setBooking(mergeCmsSection(DEFAULTS.booking, c.booking));
          if (c.menu) setMenu(mergeCmsSection(DEFAULTS.menu, c.menu));
          if (c.theme) setTheme(mergeCmsSection(DEFAULTS.theme, c.theme));
        }
        if (cmsData.published) {
          publishedRef.current = cmsData.published;
        }
        if (Array.isArray(cmsData.draftSections)) {
          setDraftSections(cmsData.draftSections);
        }
        if (settingsData.success) {
          if (settingsData.restaurantSlug) {
            setSiteUrl(`${window.location.origin}/r/${settingsData.restaurantSlug}/home`);
          }
        }
      } catch {
        showToast("Failed to load content.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTab = useCallback((id) => {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", url.pathname + url.search);
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const resetActiveTab = useCallback(() => {
    const pub = publishedRef.current;
    const section = getCustomerSiteTab(activeTab)?.saveSection ?? activeTab;
    if (activeTab === "overview" || !section || section === "overview") {
      showToast("Open a content tab to reset changes.", "error");
      return;
    }
    if (!pub?.[section]) {
      showToast("No published version yet — use Publish to save first.", "error");
      return;
    }
    const p = pub[section];
    switch (section) {
      case "theme":
        setTheme(mergeCmsSection(DEFAULTS.theme, p));
        break;
      case "hero": {
        const merged = mergeCmsSection(DEFAULTS.hero, p);
        setHero({
          ...merged,
          thumbnails: ensureHeroThumbnails(merged.thumbnails),
          quickPills:
            Array.isArray(merged.quickPills) && merged.quickPills.length > 0
              ? merged.quickPills
              : DEFAULTS.hero.quickPills,
        });
        break;
      }
      case "announcement":
        setAnnouncement(mergeCmsSection(DEFAULTS.announcement, p));
        break;
      case "banners":
        setBanners(Array.isArray(p) && p.length > 0 ? p : DEFAULTS.banners);
        break;
      case "about": {
        const merged = mergeCmsSection(DEFAULTS.about, p);
        setAbout({
          ...merged,
          sideImages: ensureAboutSideImages(merged.sideImages),
          stats: ensureAboutStats(merged.stats),
          promises:
            Array.isArray(merged.promises) && merged.promises.length > 0
              ? merged.promises
              : DEFAULTS.about.promises,
        });
        break;
      }
      case "home":
        setHome(mergeCmsSection(DEFAULTS.home, p));
        break;
      case "contact":
        setContact(mergeCmsSection(DEFAULTS.contact, p));
        break;
      case "booking":
        setBooking(mergeCmsSection(DEFAULTS.booking, p));
        break;
      case "menu":
        setMenu(mergeCmsSection(DEFAULTS.menu, p));
        break;
      case "social":
        setSocial({ ...DEFAULTS.social, ...p });
        break;
      default:
        showToast("Cannot reset this tab.", "error");
        return;
    }
    showToast("Reset to last published version.");
  }, [activeTab, showToast]);

  const saveDraft = async (section, data) => {
    setSaving(`draft-${section}`);
    try {
      const res = await fetch("/api/restaurant-cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data, asDraft: true }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error ?? "Failed to save draft.", "error");
        return;
      }
      setDraftSections((prev) => [...new Set([...prev, section])]);
      showToast("Saved to draft — not live until you publish.");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(null);
    }
  };

  const publishNow = async (section, data) => {
    setSaving(`pub-${section}`);
    try {
      const res = await fetch("/api/restaurant-cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data, asDraft: false }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error ?? "Failed to publish.", "error");
        return;
      }
      invalidateRestaurantCmsCache();
      setDraftSections((prev) => prev.filter((s) => s !== section));
      showToast(`${publishHeadlineForSection(section)} is now live!`);
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(null);
    }
  };

  const publishAllDrafts = async () => {
    setSaving("publish-all");
    try {
      const res = await fetch("/api/restaurant-cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error ?? "Nothing to publish.", "error");
        return;
      }
      invalidateRestaurantCmsCache();
      setDraftSections([]);
      showToast("All drafts published to your live site!");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Globe className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Customer Site</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Edit your public ordering website section by section — draft & publish.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== "overview" && (
            <button
              type="button"
              disabled={!!saving}
              onClick={resetActiveTab}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
            >
              <RotateCcw className="size-4" /> Reset changes
            </button>
          )}
          {draftSections.length > 0 && (
            <button
              type="button"
              disabled={!!saving}
              onClick={publishAllDrafts}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/90 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving === "publish-all" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              Publish all drafts ({draftSections.length})
            </button>
          )}
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="size-4" /> Visit website
            </a>
          )}
        </div>
      </div>

      {siteUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
          <Globe className="size-4 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-300">Customer site URL</p>
            <p className="truncate font-mono text-xs text-emerald-400/80">{siteUrl}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
        <CustomerSiteSidebar
          activeTab={activeTab}
          onTabChange={switchTab}
          draftSections={draftSections}
        />

        <div
          ref={panelRef}
          className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
        >
          <CustomerSiteTabHeader tab={activeTabMeta} />

          {activeTab === "theme" && (
            <WebsiteLayoutTab
              theme={theme}
              setTheme={setTheme}
              social={social}
              setSocial={setSocial}
              saving={saving}
              onSaveDraft={saveDraft}
              onPublish={publishNow}
            />
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-400">
                Use the <strong className="text-zinc-200">left tabs</strong> for your public website text and images.
                <strong className="text-zinc-200"> Save to draft</strong> while editing; click{" "}
                <strong className="text-zinc-200">Publish</strong> (or Publish all drafts) to go live.
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-zinc-400">
                <p className="font-semibold text-amber-300/90">Where to edit what</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-500">
                  <li>
                    <strong className="text-zinc-300">Logo</strong> — Website layout → Header (image only on site).
                    Settings → General logo is only a fallback.
                  </li>
                  <li>
                    <strong className="text-zinc-300">Address, phone, hours</strong> — Settings (Contact & Hours).
                  </li>
                  <li>
                    <strong className="text-zinc-300">Menu dishes & prices</strong> — Menu admin, not Customer Site.
                  </li>
                  <li>
                    <strong className="text-zinc-300">Social URLs</strong> — Website layout (one place for header & footer).
                  </li>
                </ul>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-400 mb-2">Settings → customer site</p>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    {SETTINGS_FOR_CUSTOMER_SITE.map(({ tab, items }) => (
                      <li key={tab}>
                        <strong className="text-zinc-300">{tab}</strong>
                        <span className="text-zinc-500"> — {items}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/settings"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Settings className="size-3.5" /> Open Settings
                  </Link>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                  <p className="text-xs font-semibold text-zinc-500 mb-2">Also managed elsewhere</p>
                  <ul className="space-y-2 text-xs text-zinc-500">
                    {MANAGED_ELSEWHERE.map(({ module, items }) => (
                      <li key={module}>
                        <strong className="text-zinc-400">{module}</strong> — {items}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { href: siteUrl || "#", label: "Home", Icon: Home, path: "/home" },
                  { href: siteUrl?.replace(/\/home$/, "/order/menu") || "#", label: "Menu", Icon: UtensilsCrossed, path: "/order/menu" },
                  { href: siteUrl?.replace(/\/home$/, "/order/about") || "#", label: "About", Icon: Info, path: "/order/about" },
                  { href: siteUrl?.replace(/\/home$/, "/order/contact") || "#", label: "Contact", Icon: Phone, path: "/order/contact" },
                ].map(({ href, label, Icon, path }) => (
                  <a
                    key={path}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 transition-colors hover:border-emerald-500/30"
                  >
                    <Icon className="size-5 text-emerald-400" />
                    <span className="flex-1 text-sm font-medium text-zinc-200">{label}</span>
                    <ExternalLink className="size-3.5 text-zinc-600" />
                  </a>
                ))}
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  What each tab controls
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {OVERVIEW_SECTIONS.map(({ tab, label, page, icon: Icon }) => (
                    <li key={tab}>
                      <button
                        type="button"
                        onClick={() => switchTab(tab)}
                        className="flex h-full w-full cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3.5 text-left transition-colors hover:border-emerald-500/30 hover:bg-zinc-800/50"
                      >
                        <Icon className="size-4 shrink-0 text-zinc-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-200">{label}</p>
                          <p className="text-xs text-zinc-500">{page}</p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-zinc-600" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "hero" && (
            <div className={CMS_EDITOR_SECTION}>
              <p className="text-xs text-zinc-500">
                Full home hero — text, search, buttons, main image, 3 small images, and floating card.
              </p>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Text</p>
              <Field label="Badge text" hint="Small label above the heading">
                <input
                  value={hero.badge}
                  onChange={(e) => setHero((p) => ({ ...p, badge: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Main heading *">
                <textarea
                  rows={2}
                  value={hero.headline}
                  onChange={(e) => setHero((p) => ({ ...p, headline: e.target.value }))}
                  className={textareaCls}
                />
              </Field>
              <Field label="Sub heading">
                <textarea
                  rows={2}
                  value={hero.subheadline}
                  onChange={(e) => setHero((p) => ({ ...p, subheadline: e.target.value }))}
                  className={textareaCls}
                />
              </Field>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Search</p>
              <ToggleRow
                label="Show search bar"
                enabled={hero.searchEnabled !== false}
                onToggle={() => setHero((p) => ({ ...p, searchEnabled: !p.searchEnabled }))}
              />
              {hero.searchEnabled !== false && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Search placeholder">
                    <input
                      value={hero.searchPlaceholder ?? ""}
                      onChange={(e) => setHero((p) => ({ ...p, searchPlaceholder: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Search button">
                    <input
                      value={hero.searchButtonLabel ?? ""}
                      onChange={(e) => setHero((p) => ({ ...p, searchButtonLabel: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Quick tags</p>
              <ToggleRow
                label="Show quick search pills"
                enabled={hero.quickPillsEnabled !== false}
                onToggle={() => setHero((p) => ({ ...p, quickPillsEnabled: !p.quickPillsEnabled }))}
              />
              {hero.quickPillsEnabled !== false &&
                (hero.quickPills ?? []).map((pill, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2 rounded-xl border border-zinc-800/80 p-3">
                    <Field label={`Tag ${i + 1} label`}>
                      <input
                        value={pill.label}
                        onChange={(e) =>
                          setHero((p) => {
                            const pills = [...(p.quickPills ?? [])];
                            pills[i] = { ...pills[i], label: e.target.value };
                            return { ...p, quickPills: pills };
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Menu search query">
                      <input
                        value={pill.query}
                        onChange={(e) =>
                          setHero((p) => {
                            const pills = [...(p.quickPills ?? [])];
                            pills[i] = { ...pills[i], query: e.target.value };
                            return { ...p, quickPills: pills };
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>
                ))}

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Buttons</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primary button label">
                  <input
                    value={hero.ctaPrimaryLabel}
                    onChange={(e) => setHero((p) => ({ ...p, ctaPrimaryLabel: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Primary link" hint="Empty = open order type popup">
                  <input
                    value={hero.ctaPrimaryLink ?? ""}
                    onChange={(e) => setHero((p) => ({ ...p, ctaPrimaryLink: e.target.value }))}
                    placeholder="/order/menu"
                    className={inputCls}
                  />
                </Field>
                <Field label="Secondary button label">
                  <input
                    value={hero.ctaSecondaryLabel}
                    onChange={(e) => setHero((p) => ({ ...p, ctaSecondaryLabel: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Secondary link">
                  <input
                    value={hero.ctaSecondaryLink ?? ""}
                    onChange={(e) => setHero((p) => ({ ...p, ctaSecondaryLink: e.target.value }))}
                    placeholder="/order/table-booking"
                    className={inputCls}
                  />
                </Field>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Images</p>
              <div className={CMS_MEDIA_FORM_ROW}>
                <div className="min-w-0 space-y-3">
                  <CmsImageField
                    label="Main hero image (large)"
                    hint="Right side on desktop. Upload or paste URL."
                    value={hero.imageUrl}
                    onChange={(v) => setHero((p) => ({ ...p, imageUrl: v }))}
                    disabled={saving === "hero"}
                    previewClassName="h-36 w-full object-cover lg:h-44"
                  />
                  <Field label="Corner badge on main image">
                    <input
                      value={hero.overlayBadge ?? ""}
                      onChange={(e) => setHero((p) => ({ ...p, overlayBadge: e.target.value }))}
                      placeholder="Chef's Special"
                      className={inputCls}
                    />
                  </Field>
                  <ToggleRow
                    label="Show featured menu dish on main image"
                    hint="Uses your first featured menu item name & price"
                    enabled={Boolean(hero.showMenuDishOverlay)}
                    onToggle={() => setHero((p) => ({ ...p, showMenuDishOverlay: !p.showMenuDishOverlay }))}
                  />
                </div>
                <div className="min-w-0 space-y-3">
              <p className="text-xs text-zinc-500">Three small images below the main hero</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
              {ensureHeroThumbnails(hero.thumbnails).map((thumb, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-zinc-800 p-3">
                  <Field label={`Small image ${i + 1} label`}>
                    <input
                      value={thumb.label}
                      onChange={(e) =>
                        setHero((p) => {
                          const thumbs = ensureHeroThumbnails(p.thumbnails);
                          thumbs[i] = { ...thumbs[i], label: e.target.value };
                          return { ...p, thumbnails: thumbs };
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <CmsImageField
                    label="Image"
                    value={thumb.imageUrl}
                    onChange={(v) =>
                      setHero((p) => {
                        const thumbs = ensureHeroThumbnails(p.thumbnails);
                        thumbs[i] = { ...thumbs[i], imageUrl: v };
                        return { ...p, thumbnails: thumbs };
                      })
                    }
                    disabled={saving === "hero"}
                    previewClassName="h-20 w-full object-cover"
                  />
                </div>
              ))}
              </div>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Floating card</p>
              <ToggleRow
                label="Show floating stats card"
                enabled={hero.floatingCard?.enabled !== false}
                onToggle={() =>
                  setHero((p) => ({
                    ...p,
                    floatingCard: { ...p.floatingCard, enabled: !p.floatingCard?.enabled },
                  }))
                }
              />
              {hero.floatingCard?.enabled !== false && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Card title">
                    <input
                      value={hero.floatingCard?.title ?? ""}
                      onChange={(e) =>
                        setHero((p) => ({
                          ...p,
                          floatingCard: { ...p.floatingCard, title: e.target.value },
                        }))
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Card subtitle">
                    <input
                      value={hero.floatingCard?.subtitle ?? ""}
                      onChange={(e) =>
                        setHero((p) => ({
                          ...p,
                          floatingCard: { ...p.floatingCard, subtitle: e.target.value },
                        }))
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}

              <CmsSaveActions
                section="hero"
                saving={saving}
                onSaveDraft={() => saveDraft("hero", hero)}
                onPublish={() => publishNow("hero", hero)}
              />
            </div>
          )}

          {activeTab === "announcement" && (
            <div className={CMS_EDITOR_SECTION}>
              <p className="text-xs text-zinc-500">
                Colored text strip at the top of the home page (no image).
              </p>

              <ToggleRow
                label="Show top banner"
                hint="Appears above the hero on home"
                enabled={Boolean(announcement.enabled)}
                onToggle={() => setAnnouncement((p) => ({ ...p, enabled: !p.enabled }))}
              />

              <Field label="Banner text">
                <textarea
                  rows={2}
                  value={announcement.text}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, text: e.target.value }))}
                  placeholder="🎉 Special offer today!"
                  className={textareaCls}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Background color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={announcement.bgColor}
                      onChange={(e) => setAnnouncement((p) => ({ ...p, bgColor: e.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-1"
                    />
                    <input
                      value={announcement.bgColor}
                      onChange={(e) => setAnnouncement((p) => ({ ...p, bgColor: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </Field>
                <Field label="Text color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={announcement.textColor}
                      onChange={(e) => setAnnouncement((p) => ({ ...p, textColor: e.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-1"
                    />
                    <input
                      value={announcement.textColor}
                      onChange={(e) => setAnnouncement((p) => ({ ...p, textColor: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Link URL (optional)">
                  <input
                    value={announcement.link}
                    onChange={(e) => setAnnouncement((p) => ({ ...p, link: e.target.value }))}
                    placeholder="/order/menu"
                    className={inputCls}
                  />
                </Field>
                <Field label="Link label (optional)">
                  <input
                    value={announcement.linkLabel}
                    onChange={(e) => setAnnouncement((p) => ({ ...p, linkLabel: e.target.value }))}
                    placeholder="Shop now"
                    className={inputCls}
                  />
                </Field>
              </div>

              {announcement.text?.trim() && (
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500">Preview</p>
                  <div
                    className="rounded-xl px-4 py-2.5 text-center text-sm font-medium"
                    style={{
                      backgroundColor: announcement.bgColor || "#FF6B35",
                      color: announcement.textColor || "#ffffff",
                    }}
                  >
                    {announcement.text}
                    {announcement.linkLabel?.trim() && (
                      <span className="ml-2 underline">{announcement.linkLabel}</span>
                    )}
                  </div>
                </div>
              )}

              <CmsSaveActions
                section="announcement"
                saving={saving}
                onSaveDraft={() => saveDraft("announcement", announcement)}
                onPublish={() => publishNow("announcement", announcement)}
              />
            </div>
          )}

          {activeTab === "banners" && (
            <div className={CMS_EDITOR_SECTION}>
              <p className="text-xs text-zinc-500">
                Home page promo carousel — each slide: image (upload or URL), text, badges, and buttons. Max 8 slides.
              </p>
              {banners.map((ban, index) => (
                <div
                  key={ban.id ?? `banner-${index}`}
                  className={CMS_MEDIA_FORM_ROW}
                >
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-300">Slide {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setBanners((p) => {
                              const next = [...p];
                              next[index] = { ...next[index], enabled: !next[index].enabled };
                              return next;
                            })
                          }
                          className="text-emerald-400"
                        >
                          {ban.enabled !== false ? (
                            <ToggleRight className="size-7" />
                          ) : (
                            <ToggleLeft className="size-7 text-zinc-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={banners.length <= 1}
                          onClick={() => setBanners((p) => p.filter((_, i) => i !== index))}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <CmsImageField
                      label="Slide background image *"
                      hint="Wide image (1400×600 recommended). Upload or paste URL."
                      value={ban.image ?? ""}
                      onChange={(v) =>
                        setBanners((p) => {
                          const next = [...p];
                          next[index] = { ...next[index], image: v };
                          return next;
                        })
                      }
                      disabled={saving === "banners"}
                      previewClassName="h-36 w-full object-cover lg:h-44"
                    />
                  </div>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <Field label="Title *">
                      <input
                        value={ban.title}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], title: e.target.value };
                            return next;
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Badge">
                      <input
                        value={ban.badge}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], badge: e.target.value };
                            return next;
                          })
                        }
                        placeholder="Hot Deal"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Subtitle" className="sm:col-span-2">
                      <input
                        value={ban.subtitle}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], subtitle: e.target.value };
                            return next;
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Discount tag">
                      <input
                        value={ban.discount ?? ""}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], discount: e.target.value };
                            return next;
                          })
                        }
                        placeholder="20% OFF"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Button text">
                      <input
                        value={ban.ctaLabel}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], ctaLabel: e.target.value };
                            return next;
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Primary button link">
                      <input
                        value={ban.ctaLink}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], ctaLink: e.target.value };
                            return next;
                          })
                        }
                        placeholder="/order/menu"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Second button text" hint="Leave empty to hide">
                      <input
                        value={ban.secondaryCtaLabel ?? ""}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], secondaryCtaLabel: e.target.value };
                            return next;
                          })
                        }
                        placeholder="View Menu"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Second button link" className="sm:col-span-2">
                      <input
                        value={ban.secondaryCtaLink ?? ""}
                        onChange={(e) =>
                          setBanners((p) => {
                            const next = [...p];
                            next[index] = { ...next[index], secondaryCtaLink: e.target.value };
                            return next;
                          })
                        }
                        placeholder="/order/menu"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={banners.length >= 8}
                  onClick={() => setBanners((p) => [...p, emptyBanner(Date.now())])}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-emerald-500/40 disabled:opacity-40"
                >
                  <Plus className="size-4" /> Add slide
                </button>
                <CmsSaveActions
                  section="banners"
                  saving={saving}
                  onSaveDraft={() => saveDraft("banners", banners)}
                  onPublish={() => publishNow("banners", banners)}
                />
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className={CMS_EDITOR_SECTION}>
              <p className="text-xs text-zinc-500">
                About page story, images, promises, stats (stats also show on home hero), and buttons.
              </p>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Text</p>
              <Field label="Eyebrow label" hint="Small tag above the title on About page">
                <input
                  value={about.headline}
                  onChange={(e) => setAbout((p) => ({ ...p, headline: e.target.value }))}
                  placeholder="Our Story"
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={4}
                  value={about.description}
                  onChange={(e) => setAbout((p) => ({ ...p, description: e.target.value }))}
                  className={textareaCls}
                />
              </Field>
              <Field label="Promise bullets" hint="One per line (shown on About page)">
                <textarea
                  rows={6}
                  value={(about.promises ?? []).join("\n")}
                  onChange={(e) =>
                    setAbout((p) => ({
                      ...p,
                      promises: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  className={textareaCls}
                />
              </Field>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Images</p>
              <div className={CMS_MEDIA_FORM_ROW}>
                <CmsImageField
                  label="Main image (large)"
                  value={about.imageUrl ?? ""}
                  onChange={(v) => setAbout((p) => ({ ...p, imageUrl: v }))}
                  disabled={saving === "about"}
                  previewClassName="h-36 w-full object-cover lg:h-44"
                />
                <div className="min-w-0 space-y-3">
                  <p className="text-xs text-zinc-500">Three smaller images beside / below the main photo</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {ensureAboutSideImages(about.sideImages).map((img, i) => (
                      <CmsImageField
                        key={i}
                        label={`Side image ${i + 1}`}
                        value={img.imageUrl ?? ""}
                        onChange={(v) =>
                          setAbout((p) => {
                            const side = ensureAboutSideImages(p.sideImages);
                            side[i] = { imageUrl: v };
                            return { ...p, sideImages: side };
                          })
                        }
                        disabled={saving === "about"}
                        previewClassName="h-24 w-full object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Stats</p>
              <p className="text-[11px] text-zinc-600">Three boxes — also appear under the home hero.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {ensureAboutStats(about.stats).map((stat, i) => (
                  <div key={i} className="space-y-1.5 rounded-xl border border-zinc-800 p-3">
                    <input
                      value={stat.value}
                      onChange={(e) =>
                        setAbout((p) => {
                          const s = ensureAboutStats(p.stats);
                          s[i] = { ...s[i], value: e.target.value };
                          return { ...p, stats: s };
                        })
                      }
                      placeholder="50+"
                      className={inputCls}
                    />
                    <input
                      value={stat.label}
                      onChange={(e) =>
                        setAbout((p) => {
                          const s = ensureAboutStats(p.stats);
                          s[i] = { ...s[i], label: e.target.value };
                          return { ...p, stats: s };
                        })
                      }
                      placeholder="Menu Items"
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Buttons</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primary button">
                  <input
                    value={about.ctaPrimaryLabel ?? ""}
                    onChange={(e) => setAbout((p) => ({ ...p, ctaPrimaryLabel: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Primary link">
                  <input
                    value={about.ctaPrimaryLink ?? ""}
                    onChange={(e) => setAbout((p) => ({ ...p, ctaPrimaryLink: e.target.value }))}
                    placeholder="/order/menu"
                    className={inputCls}
                  />
                </Field>
                <Field label="Secondary button">
                  <input
                    value={about.ctaSecondaryLabel ?? ""}
                    onChange={(e) => setAbout((p) => ({ ...p, ctaSecondaryLabel: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Secondary link">
                  <input
                    value={about.ctaSecondaryLink ?? ""}
                    onChange={(e) => setAbout((p) => ({ ...p, ctaSecondaryLink: e.target.value }))}
                    placeholder="/order/table-booking"
                    className={inputCls}
                  />
                </Field>
              </div>

              <AboutExtrasFields about={about} setAbout={setAbout} />

              <CmsSaveActions
                section="about"
                saving={saving}
                onSaveDraft={() => saveDraft("about", about)}
                onPublish={() => publishNow("about", about)}
              />
            </div>
          )}

          {activeTab === "home" && (
            <HomeSectionsTab
              home={home}
              setHome={setHome}
              saving={saving}
              onSaveDraft={saveDraft}
              onPublish={publishNow}
            />
          )}

          {activeTab === "contact" && (
            <ContactPageTab
              contact={contact}
              setContact={setContact}
              saving={saving}
              onSaveDraft={saveDraft}
              onPublish={publishNow}
            />
          )}

          {activeTab === "booking" && (
            <BookingPageTab
              booking={booking}
              setBooking={setBooking}
              saving={saving}
              onSaveDraft={saveDraft}
              onPublish={publishNow}
            />
          )}

          {activeTab === "menu" && (
            <MenuLabelsTab
              menu={menu}
              setMenu={setMenu}
              saving={saving}
              onSaveDraft={saveDraft}
              onPublish={publishNow}
            />
          )}

        </div>
      </div>

      {ToastUI}
    </div>
  );
}
