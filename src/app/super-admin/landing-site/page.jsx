"use client";

import { useToast } from "@/hooks/useToast";
import {
  Globe, Image, LayoutTemplate, Mail,
  MessageSquare, Plus, Save, Star, Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── Shared input styles ── */
const inputCls = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 transition-colors";
const labelCls = "block text-xs font-medium text-zinc-400 mb-1";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-zinc-800">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function SaveButton({ saving, onClick }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="button" onClick={onClick} disabled={saving}
        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
        {saving ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
        ) : <Save className="size-4" />}
        {saving ? "Saving…" : "Save Section"}
      </button>
    </div>
  );
}

const TABS = [
  { id: "hero",     label: "Hero",     Icon: LayoutTemplate },
  { id: "features", label: "Features", Icon: Star           },
  { id: "pricing",  label: "Pricing",  Icon: Globe          },
  { id: "contact",  label: "Contact",  Icon: Mail           },
  { id: "footer",   label: "Footer",   Icon: MessageSquare  },
];

/* ── Section panels ── */
function HeroSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={LayoutTemplate} title="Hero Section" description="The first thing visitors see on your landing page." />
      <div className="grid gap-4">
        <Field label="Headline">
          <input value={data.headline ?? ""} onChange={(e) => onChange("headline", e.target.value)}
            placeholder="The All-in-One Restaurant Management Platform" className={inputCls} />
        </Field>
        <Field label="Sub-headline">
          <textarea rows={2} value={data.subheadline ?? ""} onChange={(e) => onChange("subheadline", e.target.value)}
            placeholder="Streamline operations, manage staff, and grow your restaurant business."
            className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA Button Text">
            <input value={data.ctaText ?? ""} onChange={(e) => onChange("ctaText", e.target.value)}
              placeholder="Get Started Free" className={inputCls} />
          </Field>
          <Field label="CTA Button URL">
            <input value={data.ctaUrl ?? ""} onChange={(e) => onChange("ctaUrl", e.target.value)}
              placeholder="/signup" className={inputCls} />
          </Field>
        </div>
        <Field label="Hero Image URL" hint="Hosted image URL for the hero background or illustration.">
          <input value={data.imageUrl ?? ""} onChange={(e) => onChange("imageUrl", e.target.value)}
            placeholder="https://cdn.example.com/hero.png" className={inputCls} />
        </Field>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function FeaturesSection({ data, onChange, onSave, saving }) {
  const features = Array.isArray(data) ? data : [];

  const update = (i, key, val) => {
    const next = features.map((f, idx) => idx === i ? { ...f, [key]: val } : f);
    onChange(next);
  };
  const add = () => onChange([...features, { icon: "⭐", title: "", description: "" }]);
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionHeader icon={Star} title="Features Section" description="Highlight the key features of your platform." />
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400">Feature {i + 1}</p>
              <button type="button" onClick={() => remove(i)}
                className="cursor-pointer rounded-lg p-1.5 text-zinc-600 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Icon (emoji)">
                <input value={f.icon ?? ""} onChange={(e) => update(i, "icon", e.target.value)}
                  placeholder="🍽️" className={inputCls} />
              </Field>
              <Field label="Title">
                <input value={f.title ?? ""} onChange={(e) => update(i, "title", e.target.value)}
                  placeholder="Feature title" className={inputCls} />
              </Field>
              <Field label="Description">
                <input value={f.description ?? ""} onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="Short description" className={inputCls} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={add}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
          <Plus className="size-4" /> Add Feature
        </button>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function PricingSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Globe} title="Pricing Section" description="Headline text shown above the pricing plans." />
      <div className="grid gap-4">
        <Field label="Section Headline">
          <input value={data.headline ?? ""} onChange={(e) => onChange("headline", e.target.value)}
            placeholder="Simple, Transparent Pricing" className={inputCls} />
        </Field>
        <Field label="Sub-headline">
          <textarea rows={2} value={data.subheadline ?? ""} onChange={(e) => onChange("subheadline", e.target.value)}
            placeholder="Choose the plan that fits your restaurant."
            className={`${inputCls} resize-none`} />
        </Field>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">
        ℹ️ Pricing cards are pulled automatically from the <span className="text-zinc-300">Plans</span> module.
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function ContactSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Mail} title="Contact Section" description="Contact details shown on the landing page." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Support Email">
          <input type="email" value={data.email ?? ""} onChange={(e) => onChange("email", e.target.value)}
            placeholder="support@rms.com" className={inputCls} />
        </Field>
        <Field label="Phone Number">
          <input value={data.phone ?? ""} onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+1 (555) 000-0000" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input value={data.address ?? ""} onChange={(e) => onChange("address", e.target.value)}
              placeholder="123 Main Street, City, Country" className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Google Maps Embed URL" hint="Paste the embed URL from Google Maps.">
            <input value={data.mapUrl ?? ""} onChange={(e) => onChange("mapUrl", e.target.value)}
              placeholder="https://maps.google.com/maps?..." className={inputCls} />
          </Field>
        </div>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function FooterSection({ data, onChange, onSave, saving }) {
  const links = Array.isArray(data.links) ? data.links : [];

  const updateLink = (i, key, val) => {
    const next = links.map((l, idx) => idx === i ? { ...l, [key]: val } : l);
    onChange("links", next);
  };
  const addLink    = () => onChange("links", [...links, { label: "", url: "" }]);
  const removeLink = (i) => onChange("links", links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionHeader icon={MessageSquare} title="Footer" description="Company name, tagline, and footer links." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name">
          <input value={data.companyName ?? ""} onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="RMS Platform" className={inputCls} />
        </Field>
        <Field label="Tagline">
          <input value={data.tagline ?? ""} onChange={(e) => onChange("tagline", e.target.value)}
            placeholder="Built for restaurants, by restaurant people." className={inputCls} />
        </Field>
      </div>
      <div>
        <p className={labelCls}>Footer Links</p>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={l.label ?? ""} onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="Label" className={`${inputCls} flex-1`} />
              <input value={l.url ?? ""} onChange={(e) => updateLink(i, "url", e.target.value)}
                placeholder="/url" className={`${inputCls} flex-1`} />
              <button type="button" onClick={() => removeLink(i)}
                className="cursor-pointer rounded-lg p-2 text-zinc-600 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addLink}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            <Plus className="size-4" /> Add Link
          </button>
        </div>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

/* ── Main page ── */
export default function LandingSitePage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent]     = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const { showToast, ToastUI }    = useToast();
  const panelRef                  = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/super-admin/landing");
        const data = await res.json();
        if (data.success) setContent(data.content);
        else showToast(data.error ?? "Failed to load.", "error");
      } catch { showToast("Network error.", "error"); }
      finally { setFetching(false); }
    })();
  }, [showToast]);

  const handleChange = useCallback((keyOrValue, val) => {
    setContent((prev) => {
      if (activeTab === "features") {
        return { ...prev, features: keyOrValue };
      }
      return { ...prev, [activeTab]: { ...prev[activeTab], [keyOrValue]: val } };
    });
  }, [activeTab]);

  const handleSave = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/super-admin/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, data: content[activeTab] }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to save.", "error"); return; }
      showToast("Section saved.");
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(false); }
  }, [activeTab, content, showToast]);

  const switchTab = (id) => {
    setActiveTab(id);
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionData = content?.[activeTab] ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25">
          <Globe className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Landing Site</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your public-facing website content.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Tab list */}
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:w-44 lg:shrink-0 lg:pb-0">
          {TABS.map(({ id, label, Icon }) => {
            const active = id === activeTab;
            return (
              <button key={id} type="button" onClick={() => switchTab(id)}
                className={`cursor-pointer flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap lg:w-full ${
                  active
                    ? "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}>
                <Icon className={`size-4 shrink-0 ${active ? "text-sky-400" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div ref={panelRef} className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          {fetching ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-800/60" />
              ))}
            </div>
          ) : !content ? null : (
            <>
              {activeTab === "hero"     && <HeroSection     data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "features" && <FeaturesSection data={content.features ?? []} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "pricing"  && <PricingSection  data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "contact"  && <ContactSection  data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "footer"   && <FooterSection   data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
            </>
          )}
        </div>
      </div>

      {ToastUI}
    </div>
  );
}
