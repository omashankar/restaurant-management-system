"use client";

import { useToast } from "@/hooks/useToast";
import { invalidateRestaurantCmsCache } from "@/hooks/useRestaurantCms";
import { Globe, Save, Loader2, Megaphone, Share2, Info, Sparkles, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

const inputCls = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 transition-colors";
const textareaCls = inputCls + " resize-none";

function SectionCard({ title, icon: Icon, children, badge }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {badge && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

export default function CustomerSitePage() {
  const { showToast, ToastUI } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [siteUrl, setSiteUrl] = useState("");

  const [hero, setHero] = useState({
    badge: "", headline: "", subheadline: "",
    ctaPrimaryLabel: "Order Now", ctaSecondaryLabel: "Book a Table", imageUrl: "",
  });
  const [announcement, setAnnouncement] = useState({
    enabled: false, text: "", bgColor: "#FF6B35", textColor: "#ffffff", link: "", linkLabel: "",
  });
  const [about, setAbout] = useState({
    headline: "", description: "", imageUrl: "",
    stats: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }],
  });
  const [social, setSocial] = useState({
    instagram: "", facebook: "", twitter: "", whatsapp: "", youtube: "",
  });

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
          if (c.hero)         setHero((p) => ({ ...p, ...c.hero }));
          if (c.announcement) setAnnouncement((p) => ({ ...p, ...c.announcement }));
          if (c.about)        setAbout((p) => ({ ...p, ...c.about }));
          if (c.social)       setSocial((p) => ({ ...p, ...c.social }));
        }
        if (settingsData.success && settingsData.restaurantSlug) {
          setSiteUrl(`${window.location.origin}/r/${settingsData.restaurantSlug}/home`);
        }
      } catch { showToast("Failed to load content.", "error"); }
      finally { setLoading(false); }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (section, data) => {
    setSaving(section);
    try {
      const res = await fetch("/api/restaurant-cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });
      const json = await res.json();
      if (!json.success) { showToast(json.error ?? "Failed to save.", "error"); return; }
      invalidateRestaurantCmsCache();
      showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved!`);
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(null); }
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <Globe className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Customer Site</h1>
            <p className="mt-1 text-sm text-zinc-500">Customize what customers see on your ordering website.</p>
          </div>
        </div>
        {siteUrl && (
          <a href={siteUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            <ExternalLink className="size-4" /> Preview Site
          </a>
        )}
      </div>

      {/* Site URL info */}
      {siteUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
          <Globe className="size-4 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-300">Your Customer Site URL</p>
            <p className="truncate font-mono text-xs text-emerald-400/80">{siteUrl}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── HERO SECTION ── */}
        <SectionCard title="Hero Section" icon={Sparkles} badge="Home Page">
          <div className="space-y-3">
            <Field label="Badge Text" hint="Small text above the heading">
              <input value={hero.badge} onChange={(e) => setHero((p) => ({ ...p, badge: e.target.value }))}
                placeholder="Chef Crafted · Fresh · Premium" className={inputCls} />
            </Field>
            <Field label="Main Heading *">
              <input value={hero.headline} onChange={(e) => setHero((p) => ({ ...p, headline: e.target.value }))}
                placeholder="Delicious Food, Delivered to Your Door" className={inputCls} />
            </Field>
            <Field label="Sub Heading">
              <textarea rows={2} value={hero.subheadline} onChange={(e) => setHero((p) => ({ ...p, subheadline: e.target.value }))}
                placeholder="Explore our kitchen specials..." className={textareaCls} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Primary Button Text">
                <input value={hero.ctaPrimaryLabel} onChange={(e) => setHero((p) => ({ ...p, ctaPrimaryLabel: e.target.value }))}
                  placeholder="Order Now" className={inputCls} />
              </Field>
              <Field label="Secondary Button Text">
                <input value={hero.ctaSecondaryLabel} onChange={(e) => setHero((p) => ({ ...p, ctaSecondaryLabel: e.target.value }))}
                  placeholder="Book a Table" className={inputCls} />
              </Field>
            </div>
            <button type="button" disabled={saving === "hero"} onClick={() => save("hero", hero)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {saving === "hero" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Hero
            </button>
          </div>
        </SectionCard>

        {/* ── ANNOUNCEMENT ── */}
        <SectionCard title="Announcement Banner" icon={Megaphone}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">Show Banner</p>
                <p className="text-xs text-zinc-500">Display announcement on customer site</p>
              </div>
              <button type="button" onClick={() => setAnnouncement((p) => ({ ...p, enabled: !p.enabled }))}
                className="text-emerald-400 hover:text-emerald-300 transition-colors">
                {announcement.enabled
                  ? <ToggleRight className="size-8" />
                  : <ToggleLeft className="size-8 text-zinc-600" />}
              </button>
            </div>
            <Field label="Announcement Text">
              <textarea rows={2} value={announcement.text} onChange={(e) => setAnnouncement((p) => ({ ...p, text: e.target.value }))}
                placeholder="🎉 Special offer today! Get 20% off on all orders above ₹500." className={textareaCls} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Background Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={announcement.bgColor} onChange={(e) => setAnnouncement((p) => ({ ...p, bgColor: e.target.value }))}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-1" />
                  <input value={announcement.bgColor} onChange={(e) => setAnnouncement((p) => ({ ...p, bgColor: e.target.value }))}
                    className={inputCls} />
                </div>
              </Field>
              <Field label="Text Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={announcement.textColor} onChange={(e) => setAnnouncement((p) => ({ ...p, textColor: e.target.value }))}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-1" />
                  <input value={announcement.textColor} onChange={(e) => setAnnouncement((p) => ({ ...p, textColor: e.target.value }))}
                    className={inputCls} />
                </div>
              </Field>
            </div>
            <Field label="Link URL (optional)" hint="Where to go when banner is clicked">
              <input value={announcement.link} onChange={(e) => setAnnouncement((p) => ({ ...p, link: e.target.value }))}
                placeholder="https://... or /order/menu" className={inputCls} />
            </Field>
            {/* Preview */}
            {announcement.text && (
              <div className="rounded-xl px-4 py-2.5 text-sm font-medium text-center"
                style={{ backgroundColor: announcement.bgColor, color: announcement.textColor }}>
                {announcement.text}
              </div>
            )}
            <button type="button" disabled={saving === "announcement"} onClick={() => save("announcement", announcement)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {saving === "announcement" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Announcement
            </button>
          </div>
        </SectionCard>

        {/* ── ABOUT SECTION ── */}
        <SectionCard title="About Section" icon={Info}>
          <div className="space-y-3">
            <Field label="Section Heading">
              <input value={about.headline} onChange={(e) => setAbout((p) => ({ ...p, headline: e.target.value }))}
                placeholder="Our Story" className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea rows={4} value={about.description} onChange={(e) => setAbout((p) => ({ ...p, description: e.target.value }))}
                placeholder="We started with a simple mission — to serve fresh, delicious food..." className={textareaCls} />
            </Field>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">Stats (3 items)</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {about.stats.map((stat, i) => (
                  <div key={i} className="space-y-1.5">
                    <input value={stat.value} onChange={(e) => setAbout((p) => {
                      const s = [...p.stats]; s[i] = { ...s[i], value: e.target.value }; return { ...p, stats: s };
                    })} placeholder="50+" className={inputCls} />
                    <input value={stat.label} onChange={(e) => setAbout((p) => {
                      const s = [...p.stats]; s[i] = { ...s[i], label: e.target.value }; return { ...p, stats: s };
                    })} placeholder="Menu Items" className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
            <button type="button" disabled={saving === "about"} onClick={() => save("about", about)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {saving === "about" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save About
            </button>
          </div>
        </SectionCard>

        {/* ── SOCIAL LINKS ── */}
        <SectionCard title="Social Media Links" icon={Share2}>
          <div className="space-y-3">
            {[
              { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourpage" },
              { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/yourpage" },
              { key: "twitter",   label: "Twitter/X", placeholder: "https://twitter.com/yourpage" },
              { key: "whatsapp",  label: "WhatsApp",  placeholder: "https://wa.me/919876543210" },
              { key: "youtube",   label: "YouTube",   placeholder: "https://youtube.com/@yourpage" },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <input value={social[key]} onChange={(e) => setSocial((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder} className={inputCls} />
              </Field>
            ))}
            <button type="button" disabled={saving === "social"} onClick={() => save("social", social)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {saving === "social" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Social Links
            </button>
          </div>
        </SectionCard>

      </div>
      {ToastUI}
    </div>
  );
}
