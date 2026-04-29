"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconPicker from "@/components/ui/IconPicker";
import Modal from "@/components/ui/Modal";
import { getIcon } from "@/lib/iconMap";
import { useToast } from "@/hooks/useToast";
import {
  AlertCircle, CreditCard, Globe,
  LayoutTemplate, Mail, MessageSquare,
  Pencil, Plus, Save, Star, Trash2, Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── shared input class ── */
const ic = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 transition-colors";

/* ── Field wrapper ── */
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400"><AlertCircle className="size-3" />{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="cursor-pointer flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-zinc-700"}`}>
        <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

/* ── Section header ── */
function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-5 border-b border-zinc-800">
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

/* ── Save button ── */
function SaveBtn({ saving, onClick }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="button" onClick={onClick} disabled={saving}
        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
        {saving
          ? <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
          : <Save className="size-4" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ── Tabs ── */
const TABS = [
  { id: "hero",         label: "Hero",         Icon: LayoutTemplate },
  { id: "features",     label: "Features",     Icon: Star           },
  { id: "roles",        label: "Roles",        Icon: Users          },
  { id: "pricing",      label: "Pricing",      Icon: CreditCard     },
  { id: "testimonials", label: "Testimonials", Icon: MessageSquare  },
  { id: "footer",       label: "Footer",       Icon: Mail           },
];

/* ════════════════════════════════════════
   HERO PANEL
════════════════════════════════════════ */
function HeroPanel({ data, onChange, onSave, saving }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!data.headline?.trim()) e.headline = "Headline is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={LayoutTemplate} title="Hero Section" description="Headline, subheading, and CTA buttons." />
      <Field label="Badge Text" hint="Small pill shown above the headline.">
        <input value={data.badge ?? ""} onChange={e => onChange("badge", e.target.value)}
          placeholder="Built for modern restaurants" className={ic} />
      </Field>
      <Field label="Headline" required error={errors.headline}>
        <input value={data.headline ?? ""} onChange={e => { onChange("headline", e.target.value); setErrors(p => ({ ...p, headline: "" })); }}
          placeholder="All-in-One Restaurant Management System" className={ic} />
      </Field>
      <Field label="Sub-headline">
        <textarea rows={2} value={data.subheadline ?? ""} onChange={e => onChange("subheadline", e.target.value)}
          placeholder="Manage billing, inventory, staff, and analytics…" className={`${ic} resize-none`} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary CTA Text">
          <input value={data.ctaPrimary ?? ""} onChange={e => onChange("ctaPrimary", e.target.value)}
            placeholder="Start Free Trial" className={ic} />
        </Field>
        <Field label="Secondary CTA Text">
          <input value={data.ctaSecondary ?? ""} onChange={e => onChange("ctaSecondary", e.target.value)}
            placeholder="Book a Demo" className={ic} />
        </Field>
      </div>

      {/* Live preview */}
      {(data.headline || data.badge) && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Live Preview</p>
          {data.badge && (
            <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              {data.badge}
            </span>
          )}
          {data.headline && <h3 className="mt-3 text-xl font-bold text-zinc-100">{data.headline}</h3>}
          {data.subheadline && <p className="mt-2 text-sm text-zinc-400">{data.subheadline}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {data.ctaPrimary && <span className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">{data.ctaPrimary}</span>}
            {data.ctaSecondary && <span className="rounded-xl border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-300">{data.ctaSecondary}</span>}
          </div>
        </div>
      )}
      <SaveBtn saving={saving} onClick={() => { if (validate()) onSave(); }} />
    </div>
  );
}

/* ════════════════════════════════════════
   GENERIC ARRAY PANEL
   Reused by Features, Roles, Pricing, Testimonials
════════════════════════════════════════ */
function ArrayPanel({ items, fields, onSave, saving, icon: Icon, title, description, renderCard }) {
  const [editIdx, setEditIdx]       = useState(null);
  const [deleteIdx, setDeleteIdx]   = useState(null);
  const [form, setForm]             = useState({});
  const [errors, setErrors]         = useState({});
  const [itemSaving, setItemSaving] = useState(false);

  const defaultForm = () => {
    const defaults = {};
    fields.forEach(f => { if (f.type === "iconpicker") defaults[f.key] = f.default ?? "Circle"; });
    return defaults;
  };

  const openAdd  = () => { setForm(defaultForm()); setErrors({}); setEditIdx(-1); };
  const openEdit = (i) => {
    const item = { ...items[i] };
    // fill missing iconpicker fields with their default
    fields.forEach(f => { if (f.type === "iconpicker" && !item[f.key]) item[f.key] = f.default ?? "Circle"; });
    setForm(item);
    setErrors({});
    setEditIdx(i);
  };

  const handleSave = async () => {
    const e = {};
    fields.forEach(f => {
      if (f.required && !form[f.key]?.toString().trim()) e[f.key] = `${f.label} is required.`;
    });
    if (Object.keys(e).length) { setErrors(e); return; }
    setItemSaving(true);
    const updated = editIdx === -1
      ? [...items, { id: Date.now().toString(36), ...form }]
      : items.map((x, i) => i === editIdx ? { ...x, ...form } : x);
    await onSave(updated);
    setEditIdx(null);
    setItemSaving(false);
  };

  const handleDelete = async () => {
    await onSave(items.filter((_, i) => i !== deleteIdx));
    setDeleteIdx(null);
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon} title={title} description={description} />

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-600">
            No items yet. Add your first one.
          </div>
        )}
        {items.map((item, i) => (
          <div key={item.id ?? i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors">
            <div className="min-w-0 flex-1">{renderCard(item)}</div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => openEdit(i)}
                className="cursor-pointer rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700/60 hover:text-zinc-200 transition-colors">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={() => setDeleteIdx(i)}
                className="cursor-pointer rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={openAdd}
        className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
        <Plus className="size-4" /> Add {title.replace(/s$/, "")}
      </button>

      {/* Add / Edit modal */}
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)}
        title={editIdx === -1 ? `Add ${title.replace(/s$/, "")}` : `Edit ${title.replace(/s$/, "")}`}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditIdx(null)}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="button" disabled={itemSaving} onClick={handleSave}
              className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">
              {itemSaving ? "Saving…" : "Save"}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {fields.map(f => (
            <Field key={f.key} label={f.label} required={f.required} error={errors[f.key]} hint={f.hint}>
              {f.type === "iconpicker" ? (
                <IconPicker
                  value={form[f.key] ?? "Star"}
                  onChange={v => { setForm(p => ({ ...p, [f.key]: v })); setErrors(p => ({ ...p, [f.key]: "" })); }}
                />
              ) : f.type === "textarea" ? (
                <textarea rows={2} value={form[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: "" })); }}
                  className={`${ic} resize-none`} />
              ) : f.type === "toggle" ? (
                <Toggle checked={!!form[f.key]} onChange={v => setForm(p => ({ ...p, [f.key]: v }))}
                  label={f.toggleLabel ?? ""} />
              ) : f.type === "number" ? (
                <input type="number" min="0" value={form[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={e => { setForm(p => ({ ...p, [f.key]: Number(e.target.value) })); setErrors(p => ({ ...p, [f.key]: "" })); }}
                  className={ic} />
              ) : (
                <input value={form[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: "" })); }}
                  className={ic} />
              )}
            </Field>
          ))}
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteIdx !== null}
        title="Delete item?"
        message={deleteIdx !== null ? `"${items[deleteIdx]?.[fields[0]?.key]}" will be permanently removed.` : ""}
        confirmLabel="Delete"
        onCancel={() => setDeleteIdx(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ════════════════════════════════════════
   FOOTER PANEL
════════════════════════════════════════ */
function FooterPanel({ data, onChange, onSave, saving }) {
  const links = Array.isArray(data.links) ? data.links : [];
  const updateLink = (i, k, v) => onChange("links", links.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLink    = () => onChange("links", [...links, { label: "", href: "" }]);
  const removeLink = (i) => onChange("links", links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionHeader icon={Mail} title="Footer" description="Company info, contact details, and footer links." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" required>
          <input value={data.companyName ?? ""} onChange={e => onChange("companyName", e.target.value)}
            placeholder="Restaurant OS" className={ic} />
        </Field>
        <Field label="Tagline">
          <input value={data.tagline ?? ""} onChange={e => onChange("tagline", e.target.value)}
            placeholder="All-in-one platform…" className={ic} />
        </Field>
        <Field label="Support Email">
          <input type="email" value={data.email ?? ""} onChange={e => onChange("email", e.target.value)}
            placeholder="support@rms.com" className={ic} />
        </Field>
        <Field label="Phone">
          <input value={data.phone ?? ""} onChange={e => onChange("phone", e.target.value)}
            placeholder="+1 555 000 0000" className={ic} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input value={data.address ?? ""} onChange={e => onChange("address", e.target.value)}
              placeholder="123 Main St, City, Country" className={ic} />
          </Field>
        </div>
      </div>

      <div>
        <p className="block text-xs font-medium text-zinc-400 mb-2">Footer Links</p>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={l.label ?? ""} onChange={e => updateLink(i, "label", e.target.value)}
                placeholder="Label" className={`${ic} flex-1`} />
              <input value={l.href ?? ""} onChange={e => updateLink(i, "href", e.target.value)}
                placeholder="/url or #anchor" className={`${ic} flex-1`} />
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
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

/* ════════════════════════════════════════
   FIELD DEFINITIONS FOR ARRAY PANELS
════════════════════════════════════════ */
const FEATURE_FIELDS = [
  { key: "icon",        label: "Icon",        type: "iconpicker", required: true, default: "Star" },
  { key: "title",       label: "Title",       placeholder: "POS System",        required: true },
  { key: "description", label: "Description", placeholder: "Short description", type: "textarea" },
];

const ROLE_FIELDS = [
  { key: "icon",        label: "Icon",        type: "iconpicker", required: true, default: "Circle" },
  { key: "role",        label: "Role Name",   placeholder: "Admin",         required: true },
  { key: "description", label: "Description", placeholder: "Full control…", type: "textarea" },
];

const PRICING_FIELDS = [
  { key: "name",        label: "Plan Name",       placeholder: "Pro",                required: true },
  { key: "description", label: "Description",     placeholder: "For growing teams.", type: "textarea" },
  { key: "cta",         label: "CTA Button Text", placeholder: "Start Free Trial" },
  { key: "badge",       label: "Badge",           placeholder: "Most Popular",       hint: "Optional label on card" },
  { key: "highlight",   label: "Highlighted",     type: "toggle",                    toggleLabel: "Show as featured plan" },
];

const TESTIMONIAL_FIELDS = [
  { key: "name",  label: "Name",  placeholder: "Rahul Mehta",       required: true },
  { key: "role",  label: "Role",  placeholder: "Operations Manager" },
  { key: "quote", label: "Quote", placeholder: "RMS helped us…",    required: true, type: "textarea" },
];

/* ════════════════════════════════════════
   MAIN PAGE — export default
════════════════════════════════════════ */
export default function LandingSitePage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent]     = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const { showToast, ToastUI }    = useToast();
  const panelRef                  = useRef(null);

  /* ── Fetch all content on mount ── */
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

  /* ── Update a field in the active section ── */
  const handleChange = useCallback((keyOrArr, val) => {
    setContent(prev => {
      const arrSections = ["features", "roles", "pricing", "testimonials"];
      if (arrSections.includes(activeTab)) return { ...prev, [activeTab]: keyOrArr };
      return { ...prev, [activeTab]: { ...prev[activeTab], [keyOrArr]: val } };
    });
  }, [activeTab]);

  /* ── Save active section (optionally with override data) ── */
  const handleSave = useCallback(async (overrideData) => {
    if (!content) return;
    setSaving(true);
    try {
      const payload = overrideData !== undefined ? overrideData : content[activeTab];
      const res     = await fetch("/api/super-admin/landing", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ section: activeTab, data: payload }),
      });
      const json = await res.json();
      if (!json.success) { showToast(json.error ?? "Failed to save.", "error"); return; }
      if (overrideData !== undefined) {
        setContent(prev => ({ ...prev, [activeTab]: overrideData }));
      }
      showToast("Saved successfully.");
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

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25">
            <Globe className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Landing Site</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your public-facing website content. Changes go live immediately.
            </p>
          </div>
        </div>
        <Link href="/" target="_blank"
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
          <Globe className="size-3.5" /> Preview Site
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">

        {/* ── Tab sidebar ── */}
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
                <Icon className={`size-4 shrink-0 ${active ? "text-emerald-400" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* ── Content panel ── */}
        <div ref={panelRef} className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          {fetching ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-800/60" />
              ))}
            </div>
          ) : !content ? (
            <div className="py-20 text-center text-sm text-zinc-600">Failed to load content.</div>
          ) : (
            <>
              {activeTab === "hero" && (
                <HeroPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />
              )}
              {activeTab === "features" && (
                <ArrayPanel
                  items={content.features ?? []}
                  fields={FEATURE_FIELDS}
                  onSave={handleSave}
                  saving={saving}
                  icon={Star}
                  title="Features"
                  description="Highlight the key capabilities of your platform."
                  renderCard={item => (
                    <>
                      <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{item.description}</p>
                    </>
                  )}
                />
              )}
              {activeTab === "roles" && (
                <ArrayPanel
                  items={content.roles ?? []}
                  fields={ROLE_FIELDS}
                  onSave={handleSave}
                  saving={saving}
                  icon={Users}
                  title="Roles"
                  description="Describe each role and their access level."
                  renderCard={item => {
                    const RoleIcon = getIcon(item.icon);
                    return (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                          <RoleIcon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100">{item.role}</p>
                          <p className="text-xs text-zinc-500 truncate">{item.description}</p>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
              {activeTab === "pricing" && (
                <ArrayPanel
                  items={content.pricing ?? []}
                  fields={PRICING_FIELDS}
                  onSave={handleSave}
                  saving={saving}
                  icon={CreditCard}
                  title="Pricing Plans"
                  description="Manage subscription tiers shown on the landing page."
                  renderCard={item => (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                        {item.badge && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{item.badge}</span>}
                        {item.highlight && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">Featured</span>}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{item.description}</p>
                    </>
                  )}
                />
              )}
              {activeTab === "testimonials" && (
                <ArrayPanel
                  items={content.testimonials ?? []}
                  fields={TESTIMONIAL_FIELDS}
                  onSave={handleSave}
                  saving={saving}
                  icon={MessageSquare}
                  title="Testimonials"
                  description="Customer reviews shown on the landing page."
                  renderCard={item => (
                    <>
                      <p className="text-sm font-medium text-zinc-100">
                        {item.name}
                        {item.role && <span className="ml-1.5 text-xs font-normal text-zinc-500">— {item.role}</span>}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{item.quote}</p>
                    </>
                  )}
                />
              )}
              {activeTab === "footer" && (
                <FooterPanel data={sectionData} onChange={handleChange} onSave={() => handleSave()} saving={saving} />
              )}
            </>
          )}
        </div>
      </div>

      {ToastUI}
    </div>
  );
}
