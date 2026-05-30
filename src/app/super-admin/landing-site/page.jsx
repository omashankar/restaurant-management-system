"use client";

import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saTabActiveIconCls } from "@/config/superAdminTheme";
import { formatLandingCurrency } from "@/lib/formatLandingCurrency";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconPicker from "@/components/ui/IconPicker";
import Modal from "@/components/ui/Modal";
import { getIcon } from "@/lib/iconMap";
import { useToast } from "@/hooks/useToast";
import {
  AlertCircle, BarChart3, CreditCard, Globe,
  Info, LayoutTemplate, Link2, Mail, MessageSquare, Search,
  Pencil, Plus, Save, Star, Trash2, Users,
} from "lucide-react";
import Link from "next/link";
import { decimalInputProps, phoneInputProps } from "@/lib/formInputTypes";
import { validateLandingSection } from "@/lib/landingValidation";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── shared input class ── */
const ic = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-sa-primary placeholder:text-zinc-600 transition-colors";

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
        className={`cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-sa-primary" : "bg-zinc-700"}`}>
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
        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-sa-primary px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 transition-colors">
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
  { id: "navbar",       label: "Navbar",       Icon: Link2          },
  { id: "hero",         label: "Hero",         Icon: LayoutTemplate },
  { id: "features",     label: "Features",     Icon: Star           },
  { id: "roles",        label: "Roles",        Icon: Users          },
  { id: "pricing",      label: "Pricing",      Icon: CreditCard     },
  { id: "testimonials", label: "Testimonials", Icon: MessageSquare  },
  { id: "about",        label: "About",        Icon: Info           },
  { id: "contact",      label: "Contact",      Icon: Mail           },
  { id: "brands",       label: "Brands",       Icon: Star           },
  { id: "problemSolution", label: "Problem/Solution", Icon: AlertCircle },
  { id: "howItWorks",   label: "How It Works", Icon: BarChart3      },
  { id: "benefits",     label: "Benefits",     Icon: Users          },
  { id: "demo",         label: "Demo",         Icon: Globe          },
  { id: "cta",          label: "CTA",          Icon: LayoutTemplate },
  { id: "footer",       label: "Footer",       Icon: Mail           },
  { id: "seo",          label: "SEO",          Icon: Search         },
];

function NavbarPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  const links = Array.isArray(data.links) ? data.links : [];
  const logo = data.logo ?? {};
  const ctaPrimary = data.ctaPrimary ?? {};
  const ctaSecondary = data.ctaSecondary ?? {};

  const updateLink = (i, k, v) => onChange("links", links.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLink = () => onChange("links", [...links, { label: "", href: "", external: false }]);
  const removeLink = (i) => onChange("links", links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionHeader icon={Link2} title="Navbar" description="Customize logo text, links, and top navigation CTAs." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Logo Text" required error={fieldErrors.logoText}>
          <input
            value={logo.text ?? ""}
            onChange={(e) => {
              onChange("logo", { ...logo, text: e.target.value });
              onClearError?.("logoText");
            }}
            placeholder="Restaurant OS"
            maxLength={80}
            aria-invalid={fieldErrors.logoText ? true : undefined}
            className={ic}
          />
        </Field>
        <Field label="Logo Icon URL" error={fieldErrors.logoIconUrl}>
          <input
            value={logo.iconUrl ?? ""}
            onChange={(e) => {
              onChange("logo", { ...logo, iconUrl: e.target.value });
              onClearError?.("logoIconUrl");
            }}
            placeholder="https://..."
            aria-invalid={fieldErrors.logoIconUrl ? true : undefined}
            className={ic}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary CTA Label" error={fieldErrors.ctaPrimaryLabel}>
          <input
            value={ctaPrimary.label ?? ""}
            onChange={(e) => {
              onChange("ctaPrimary", { ...ctaPrimary, label: e.target.value });
              onClearError?.("ctaPrimaryLabel");
            }}
            placeholder="Get Started"
            maxLength={40}
            className={ic}
          />
        </Field>
        <Field label="Primary CTA URL" error={fieldErrors.ctaPrimaryHref} hint="Internal path or https://…">
          <input
            value={ctaPrimary.href ?? ""}
            onChange={(e) => {
              onChange("ctaPrimary", { ...ctaPrimary, href: e.target.value });
              onClearError?.("ctaPrimaryHref");
            }}
            placeholder="/signup"
            className={ic}
          />
        </Field>
        <Field label="Secondary CTA Label" error={fieldErrors.ctaSecondaryLabel}>
          <input
            value={ctaSecondary.label ?? ""}
            onChange={(e) => {
              onChange("ctaSecondary", { ...ctaSecondary, label: e.target.value });
              onClearError?.("ctaSecondaryLabel");
            }}
            placeholder="Login"
            maxLength={40}
            className={ic}
          />
        </Field>
        <Field label="Secondary CTA URL" error={fieldErrors.ctaSecondaryHref}>
          <input
            value={ctaSecondary.href ?? ""}
            onChange={(e) => {
              onChange("ctaSecondary", { ...ctaSecondary, href: e.target.value });
              onClearError?.("ctaSecondaryHref");
            }}
            placeholder="/login"
            className={ic}
          />
        </Field>
      </div>

      <div>
        <p className="block text-xs font-medium text-zinc-400 mb-2">Navigation Links</p>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:grid-cols-3">
              <input value={l.label ?? ""} onChange={e => updateLink(i, "label", e.target.value)} placeholder="Label" className={ic} />
              <input value={l.href ?? ""} onChange={e => updateLink(i, "href", e.target.value)} placeholder="#features or /page" className={ic} />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input type="checkbox" checked={!!l.external} onChange={e => updateLink(i, "external", e.target.checked)} />
                  External
                </label>
                <button type="button" onClick={() => removeLink(i)} className="cursor-pointer ml-auto rounded-lg p-2 text-zinc-600 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addLink} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm text-zinc-500 hover-border-sa-primary-40 hover-sa-primary transition-colors">
            <Plus className="size-4" /> Add Nav Link
          </button>
        </div>
      </div>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

/* ════════════════════════════════════════
   HERO PANEL
════════════════════════════════════════ */
function HeroPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={LayoutTemplate} title="Hero Section" description="Headline, subheading, and CTA buttons." />
      <Field label="Badge Text" hint="Small pill shown above the headline." error={fieldErrors.badge}>
        <input
          value={data.badge ?? ""}
          onChange={(e) => {
            onChange("badge", e.target.value);
            onClearError?.("badge");
          }}
          placeholder="Built for modern restaurants"
          maxLength={80}
          className={ic}
        />
      </Field>
      <Field label="Headline" required error={fieldErrors.headline}>
        <input
          value={data.headline ?? ""}
          onChange={(e) => {
            onChange("headline", e.target.value);
            onClearError?.("headline");
          }}
          placeholder="All-in-One Restaurant Management System"
          maxLength={120}
          aria-invalid={fieldErrors.headline ? true : undefined}
          className={ic}
        />
      </Field>
      <Field label="Sub-headline" error={fieldErrors.subheadline}>
        <textarea
          rows={2}
          value={data.subheadline ?? ""}
          onChange={(e) => {
            onChange("subheadline", e.target.value);
            onClearError?.("subheadline");
          }}
          placeholder="Manage billing, inventory, staff, and analytics…"
          maxLength={500}
          className={`${ic} resize-none`}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary CTA Text" error={fieldErrors.ctaPrimary}>
          <input
            value={data.ctaPrimary ?? ""}
            onChange={(e) => {
              onChange("ctaPrimary", e.target.value);
              onClearError?.("ctaPrimary");
            }}
            placeholder="Start Free Trial"
            maxLength={40}
            className={ic}
          />
        </Field>
        <Field label="Secondary CTA Text" error={fieldErrors.ctaSecondary}>
          <input
            value={data.ctaSecondary ?? ""}
            onChange={(e) => {
              onChange("ctaSecondary", e.target.value);
              onClearError?.("ctaSecondary");
            }}
            placeholder="Book a Demo"
            maxLength={40}
            className={ic}
          />
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
      <SaveBtn saving={saving} onClick={onSave} />
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
    fields.forEach((f) => {
      if (f.required && !form[f.key]?.toString().trim()) {
        e[f.key] = `${f.label} is required.`;
      }
      if (f.type === "number" && form[f.key] !== "" && form[f.key] != null) {
        const n = Number(form[f.key]);
        if (!Number.isFinite(n) || n < 0) {
          e[f.key] = `${f.label} must be 0 or greater.`;
        }
      }
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
        className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover-border-sa-primary-40 hover-sa-primary transition-colors">
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
              className="cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 transition-colors">
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
                <input
                  {...decimalInputProps({ min: 0, step: "0.01" })}
                  value={form[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, [f.key]: e.target.value }));
                    setErrors((p) => ({ ...p, [f.key]: "" }));
                  }}
                  className={ic}
                />
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
function FooterPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  const links = Array.isArray(data.links) ? data.links : [];
  const updateLink = (i, k, v) => onChange("links", links.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLink    = () => onChange("links", [...links, { label: "", href: "" }]);
  const removeLink = (i) => onChange("links", links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionHeader icon={Mail} title="Footer" description="Company info, contact details, and footer links." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" required error={fieldErrors.companyName}>
          <input
            value={data.companyName ?? ""}
            onChange={(e) => {
              onChange("companyName", e.target.value);
              onClearError?.("companyName");
            }}
            placeholder="Restaurant OS"
            maxLength={80}
            aria-invalid={fieldErrors.companyName ? true : undefined}
            className={ic}
          />
        </Field>
        <Field label="Tagline" error={fieldErrors.tagline}>
          <input
            value={data.tagline ?? ""}
            onChange={(e) => {
              onChange("tagline", e.target.value);
              onClearError?.("tagline");
            }}
            placeholder="All-in-one platform…"
            maxLength={80}
            className={ic}
          />
        </Field>
        <Field label="Support Email" error={fieldErrors.email}>
          <input
            type="email"
            value={data.email ?? ""}
            onChange={(e) => {
              onChange("email", e.target.value);
              onClearError?.("email");
            }}
            placeholder="support@rms.com"
            className={ic}
          />
        </Field>
        <Field label="Phone" error={fieldErrors.phone}>
          <input
            {...phoneInputProps()}
            value={data.phone ?? ""}
            onChange={(e) => {
              onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10));
              onClearError?.("phone");
            }}
            placeholder="9876543210"
            maxLength={10}
            className={ic}
          />
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
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm text-zinc-500 hover-border-sa-primary-40 hover-sa-primary transition-colors">
            <Plus className="size-4" /> Add Link
          </button>
        </div>
      </div>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function AboutPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Info} title="About Section" description="Control about headline, text, and media details." />
      <Field label="Headline" required error={fieldErrors.headline}>
        <input
          value={data.headline ?? ""}
          onChange={(e) => {
            onChange("headline", e.target.value);
            onClearError?.("headline");
          }}
          placeholder="Built by people who understand restaurants"
          maxLength={120}
          aria-invalid={fieldErrors.headline ? true : undefined}
          className={ic}
        />
      </Field>
      <Field label="Description" error={fieldErrors.description}>
        <textarea
          rows={4}
          value={data.description ?? ""}
          onChange={(e) => {
            onChange("description", e.target.value);
            onClearError?.("description");
          }}
          placeholder="About your product and mission..."
          maxLength={500}
          className={`${ic} resize-none`}
        />
      </Field>
      <Field label="Image URL" error={fieldErrors.imageUrl}>
        <input
          value={data.imageUrl ?? ""}
          onChange={(e) => {
            onChange("imageUrl", e.target.value);
            onClearError?.("imageUrl");
          }}
          placeholder="https://..."
          className={ic}
        />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function ContactPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Mail} title="Contact Section" description="Set support contact details shown on landing page." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={fieldErrors.email}>
          <input
            type="email"
            value={data.email ?? ""}
            onChange={(e) => {
              onChange("email", e.target.value);
              onClearError?.("email");
            }}
            placeholder="support@restaurantos.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            className={ic}
          />
        </Field>
        <Field label="Phone" error={fieldErrors.phone}>
          <input
            {...phoneInputProps()}
            value={data.phone ?? ""}
            onChange={(e) => {
              onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10));
              onClearError?.("phone");
            }}
            placeholder="9876543210"
            maxLength={10}
            className={ic}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" error={fieldErrors.address}>
            <input
              value={data.address ?? ""}
              onChange={(e) => {
                onChange("address", e.target.value);
                onClearError?.("address");
              }}
              placeholder="123 Main Street, City, Country"
              maxLength={200}
              className={ic}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Map URL" error={fieldErrors.mapUrl} hint="Internal path or https://…">
            <input
              value={data.mapUrl ?? ""}
              onChange={(e) => {
                onChange("mapUrl", e.target.value);
                onClearError?.("mapUrl");
              }}
              placeholder="https://maps.google.com/..."
              className={ic}
            />
          </Field>
        </div>
      </div>
      <Toggle
        checked={!!data.formEnabled}
        onChange={(v) => onChange("formEnabled", v)}
        label="Contact form enabled"
        description="Show/Hide lead capture form on public page."
      />
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function SeoPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Search} title="SEO Settings" description="Manage metadata for search and social previews." />
      <Field label="Meta Title" error={fieldErrors.title}>
        <input
          value={data.title ?? ""}
          onChange={(e) => {
            onChange("title", e.target.value);
            onClearError?.("title");
          }}
          placeholder="Restaurant OS — All-in-One Restaurant Management System"
          maxLength={70}
          className={ic}
        />
      </Field>
      <Field label="Meta Description" error={fieldErrors.description}>
        <textarea
          rows={3}
          value={data.description ?? ""}
          onChange={(e) => {
            onChange("description", e.target.value);
            onClearError?.("description");
          }}
          placeholder="Manage billing, inventory, staff, and analytics..."
          maxLength={160}
          className={`${ic} resize-none`}
        />
      </Field>
      <Field label="Keywords" error={fieldErrors.keywords}>
        <input
          value={data.keywords ?? ""}
          onChange={(e) => {
            onChange("keywords", e.target.value);
            onClearError?.("keywords");
          }}
          placeholder="restaurant management, POS, inventory, SaaS"
          maxLength={200}
          className={ic}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Open Graph Image URL" error={fieldErrors.ogImage}>
          <input
            value={data.ogImage ?? ""}
            onChange={(e) => {
              onChange("ogImage", e.target.value);
              onClearError?.("ogImage");
            }}
            placeholder="https://..."
            className={ic}
          />
        </Field>
        <Field label="Twitter Card Type">
          <input
            value={data.twitterCard ?? ""}
            onChange={(e) => onChange("twitterCard", e.target.value)}
            placeholder="summary_large_image"
            maxLength={40}
            className={ic}
          />
        </Field>
      </div>
      <Field
        label="Pricing currency (ISO 4217)"
        hint="Used on public pricing cards — e.g. INR, USD, EUR."
        error={fieldErrors.priceCurrency}
      >
        <input
          value={data.priceCurrency ?? ""}
          onChange={(e) => {
            onChange("priceCurrency", e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
            onClearError?.("priceCurrency");
          }}
          placeholder="INR"
          maxLength={3}
          className={ic}
        />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

const toLines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const fromLines = (txt) => String(txt ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

function BrandsPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Star} title="Brand Strip" description="Trusted-by label and brand chips." />
      <Field label="Eyebrow">
        <input value={data.eyebrow ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} placeholder="Trusted by" className={ic} />
      </Field>
      <Field label="Brands (one per line)">
        <textarea
          rows={6}
          value={toLines(data.items)}
          onChange={(e) => onChange("items", fromLines(e.target.value))}
          className={`${ic} resize-none`}
        />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function ProblemSolutionPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={AlertCircle} title="Problem / Solution" description="Edit both cards shown under hero." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Problem Eyebrow"><input value={data.problemEyebrow ?? ""} onChange={(e) => onChange("problemEyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Problem Title"><input value={data.problemTitle ?? ""} onChange={(e) => onChange("problemTitle", e.target.value)} className={ic} /></Field>
        <Field label="Solution Eyebrow"><input value={data.solutionEyebrow ?? ""} onChange={(e) => onChange("solutionEyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Solution Title"><input value={data.solutionTitle ?? ""} onChange={(e) => onChange("solutionTitle", e.target.value)} className={ic} /></Field>
      </div>
      <Field label="Solution Description">
        <textarea rows={3} value={data.solutionDescription ?? ""} onChange={(e) => onChange("solutionDescription", e.target.value)} className={`${ic} resize-none`} />
      </Field>
      <Field label="Problem Points (one per line)">
        <textarea rows={5} value={toLines(data.problems)} onChange={(e) => onChange("problems", fromLines(e.target.value))} className={`${ic} resize-none`} />
      </Field>
      <Field label="Solution Points (one per line)">
        <textarea rows={5} value={toLines(data.solutionPoints)} onChange={(e) => onChange("solutionPoints", fromLines(e.target.value))} className={`${ic} resize-none`} />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function HowItWorksPanel({ data, onChange, onSave, saving }) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const textValue = steps.map((s) => `${s.n}|${s.title}|${s.text}|${s.icon ?? "Circle"}`).join("\n");
  return (
    <div className="space-y-5">
      <SectionHeader icon={BarChart3} title="How It Works" description="Flow steps. Format: number|title|text|icon" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Eyebrow"><input value={data.eyebrow ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Title"><input value={data.title ?? ""} onChange={(e) => onChange("title", e.target.value)} className={ic} /></Field>
        <Field label="Subtext"><input value={data.subtext ?? ""} onChange={(e) => onChange("subtext", e.target.value)} className={ic} /></Field>
      </div>
      <Field label="Steps (one per line)">
        <textarea
          rows={8}
          value={textValue}
          onChange={(e) => {
            const parsed = fromLines(e.target.value).map((line) => {
              const [n = "", title = "", text = "", icon = "Circle"] = line.split("|");
              return { n: n.trim(), title: title.trim(), text: text.trim(), icon: icon.trim() || "Circle" };
            });
            onChange("steps", parsed);
          }}
          className={`${ic} resize-none`}
        />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function BenefitsPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Users} title="Benefits Block" description="Device card + Why RMS card content." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Device Badge"><input value={data.deviceBadge ?? ""} onChange={(e) => onChange("deviceBadge", e.target.value)} className={ic} /></Field>
        <Field label="Why Badge"><input value={data.whyBadge ?? ""} onChange={(e) => onChange("whyBadge", e.target.value)} className={ic} /></Field>
        <Field label="Device Title"><input value={data.deviceTitle ?? ""} onChange={(e) => onChange("deviceTitle", e.target.value)} className={ic} /></Field>
        <Field label="Why Title"><input value={data.whyTitle ?? ""} onChange={(e) => onChange("whyTitle", e.target.value)} className={ic} /></Field>
      </div>
      <Field label="Device Description">
        <textarea rows={3} value={data.deviceDescription ?? ""} onChange={(e) => onChange("deviceDescription", e.target.value)} className={`${ic} resize-none`} />
      </Field>
      <Field label="Benefit points (one per line)">
        <textarea rows={6} value={toLines(data.items)} onChange={(e) => onChange("items", fromLines(e.target.value))} className={`${ic} resize-none`} />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function DemoSectionPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Globe} title="Demo Section" description="Dashboard-style preview strip and section copy." />
      <Toggle checked={data.enabled !== false} onChange={(v) => onChange("enabled", v)} label="Section enabled" />
      <Field label="Section anchor ID" hint="Navbar “Demo” should match this ID." error={fieldErrors.sectionId}>
        <input
          value={data.sectionId ?? ""}
          onChange={(e) => {
            onChange("sectionId", e.target.value);
            onClearError?.("sectionId");
          }}
          placeholder="demo"
          maxLength={40}
          className={ic}
        />
      </Field>
      <Field label="Eyebrow">
        <input value={data.eyebrow ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} maxLength={80} className={ic} />
      </Field>
      <Field label="Title" error={fieldErrors.title}>
        <input
          value={data.title ?? ""}
          onChange={(e) => {
            onChange("title", e.target.value);
            onClearError?.("title");
          }}
          maxLength={120}
          className={ic}
        />
      </Field>
      <Field label="Subtext" error={fieldErrors.subtext}>
        <textarea
          rows={3}
          value={data.subtext ?? ""}
          onChange={(e) => {
            onChange("subtext", e.target.value);
            onClearError?.("subtext");
          }}
          maxLength={500}
          className={`${ic} resize-none`}
        />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function CTASectionPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={LayoutTemplate} title="CTA banner" description="Gradient call-to-action block before the footer." />
      <Toggle checked={data.enabled !== false} onChange={(v) => onChange("enabled", v)} label="Section enabled" />
      <Field label="Section anchor ID">
        <input value={data.sectionId ?? ""} onChange={(e) => onChange("sectionId", e.target.value)} placeholder="cta" maxLength={40} className={ic} />
      </Field>
      <Field label="Eyebrow">
        <input value={data.eyebrow ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} maxLength={80} className={ic} />
      </Field>
      <Field label="Title" error={fieldErrors.title}>
        <input
          value={data.title ?? ""}
          onChange={(e) => {
            onChange("title", e.target.value);
            onClearError?.("title");
          }}
          maxLength={120}
          className={ic}
        />
      </Field>
      <Field label="Description" error={fieldErrors.description}>
        <textarea
          rows={3}
          value={data.description ?? ""}
          onChange={(e) => {
            onChange("description", e.target.value);
            onClearError?.("description");
          }}
          maxLength={500}
          className={`${ic} resize-none`}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary button label" error={fieldErrors.primaryCtaLabel}>
          <input
            value={data.primaryCtaLabel ?? ""}
            onChange={(e) => {
              onChange("primaryCtaLabel", e.target.value);
              onClearError?.("primaryCtaLabel");
            }}
            maxLength={40}
            className={ic}
          />
        </Field>
        <Field label="Primary URL" hint="Internal path or https://…" error={fieldErrors.primaryCtaHref}>
          <input
            value={data.primaryCtaHref ?? ""}
            onChange={(e) => {
              onChange("primaryCtaHref", e.target.value);
              onClearError?.("primaryCtaHref");
            }}
            placeholder="/signup"
            className={ic}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Secondary button label" error={fieldErrors.secondaryCtaLabel}>
          <input
            value={data.secondaryCtaLabel ?? ""}
            onChange={(e) => {
              onChange("secondaryCtaLabel", e.target.value);
              onClearError?.("secondaryCtaLabel");
            }}
            maxLength={40}
            className={ic}
          />
        </Field>
        <Field label="Secondary URL" hint="Use #demo for same-page anchors." error={fieldErrors.secondaryCtaHref}>
          <input
            value={data.secondaryCtaHref ?? ""}
            onChange={(e) => {
              onChange("secondaryCtaHref", e.target.value);
              onClearError?.("secondaryCtaHref");
            }}
            placeholder="#demo"
            className={ic}
          />
        </Field>
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
  { key: "monthlyPrice",label: "Monthly Price",   type: "number",    placeholder: "79", required: true },
  { key: "yearlyPrice", label: "Yearly Price",    type: "number",    placeholder: "63" },
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
  const [pricingView, setPricingView] = useState("monthly");
  const [content, setContent]     = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving]       = useState(false);
  const [sectionErrors, setSectionErrors] = useState({});
  const { showToast, ToastUI }    = useToast();
  const panelRef                  = useRef(null);

  const clearSectionError = useCallback((key) => {
    setSectionErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  const normalizePricingForEditor = useCallback((rawContent) => {
    if (!rawContent) return rawContent;
    const pricing = Array.isArray(rawContent.pricing)
      ? rawContent.pricing.map((plan) => ({
          ...plan,
          monthlyPrice: plan?.price?.monthly ?? 0,
          yearlyPrice: plan?.price?.yearly ?? plan?.price?.monthly ?? 0,
        }))
      : [];
    return { ...rawContent, pricing };
  }, []);

  const mapPlansToLandingPricing = useCallback((plans = [], fallbackPricing = []) => {
    const fallbackBySlug = Object.fromEntries((fallbackPricing ?? []).map((p) => [p.slug, p]));
    return plans.map((plan) => {
      const fallback = fallbackBySlug[plan.slug] ?? {};
      const normalizedPrice = Number(plan.price) || 0;
      const monthly = Number.isFinite(Number(plan.monthlyPrice))
        ? Number(plan.monthlyPrice)
        : (plan.billingCycle === "yearly"
          ? Number((normalizedPrice / 12).toFixed(2))
          : normalizedPrice);
      const yearly = Number.isFinite(Number(plan.yearlyPrice))
        ? Number(plan.yearlyPrice)
        : (plan.billingCycle === "yearly"
          ? normalizedPrice
          : Number((normalizedPrice * 12).toFixed(2)));
      return {
        id: plan.slug ?? plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description || fallback.description || "",
        highlight: typeof fallback.highlight === "boolean" ? fallback.highlight : plan.slug === "pro",
        badge: fallback.badge ?? (plan.slug === "pro" ? "Most Popular" : null),
        cta: fallback.cta ?? "Start Free Trial",
        features: Array.isArray(plan.features)
          ? plan.features.map((feature) => ({ text: String(feature), included: true }))
          : (fallback.features ?? []),
        price: { monthly, yearly },
        monthlyPrice: monthly,
        yearlyPrice: yearly,
      };
    });
  }, []);

  /* ── Fetch all content on mount ── */
  useEffect(() => {
    (async () => {
      setLoadError("");
      try {
        const [landingRes, plansRes] = await Promise.all([
          fetch("/api/super-admin/landing"),
          fetch("/api/super-admin/plans"),
        ]);
        const [landingData, plansData] = await Promise.all([landingRes.json(), plansRes.json()]);
        if (!landingData.success) {
          const msg = landingData.error ?? "Failed to load landing content.";
          setLoadError(msg);
          showToast(msg, "error");
          return;
        }
        const baseContent = normalizePricingForEditor(landingData.content);
        const syncedPricing = plansData.success
          ? mapPlansToLandingPricing(plansData.plans ?? [], baseContent?.pricing ?? [])
          : baseContent?.pricing ?? [];
        setContent({ ...baseContent, pricing: syncedPricing });
        if (!plansData.success) {
          showToast("Plans sync failed. Showing saved landing pricing.", "error");
        }
      } catch {
        setLoadError("Network error loading landing site.");
        showToast("Network error.", "error");
      }
      finally { setFetching(false); }
    })();
  }, [mapPlansToLandingPricing, normalizePricingForEditor, showToast]);

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
    if (activeTab === "pricing") {
      showToast("Pricing is synced from Plans. Please update /super-admin/plans.", "error");
      return;
    }
    const payload = overrideData !== undefined ? overrideData : content[activeTab];
    const validation = validateLandingSection(activeTab, payload);
    if (!validation.valid) {
      setSectionErrors(validation.errors);
      showToast(validation.message ?? "Please fix the highlighted fields.", "error");
      return;
    }
    setSectionErrors({});
    setSaving(true);
    try {
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
    setSectionErrors({});
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const panelValidationProps = {
    fieldErrors: sectionErrors,
    onClearError: clearSectionError,
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
        <Link href="/?preview=1" target="_blank"
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
          <Globe className="size-3.5" /> Preview Site
        </Link>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

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
                <Icon className={`size-4 shrink-0 ${active ? saTabActiveIconCls : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* ── Content panel ── */}
        <div ref={panelRef} className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          {fetching ? (
            <SuperAdminPageSkeleton rows={4} />
          ) : !content ? (
            <div className="py-20 text-center text-sm text-zinc-600">Failed to load content.</div>
          ) : (
            <>
              {activeTab === "hero" && (
                <HeroPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "navbar" && (
                <NavbarPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2">
                    <p className="text-xs text-indigo-200">
                      Pricing here is synced from Plans and is read-only.
                    </p>
                    <Link
                      href="/super-admin/plans"
                      className="cursor-pointer rounded-lg border border-indigo-400/40 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:border-indigo-300 hover:text-white"
                    >
                      Open Plans
                    </Link>
                  </div>
                  <div className="flex justify-end">
                    <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                      <button
                        type="button"
                        onClick={() => setPricingView("monthly")}
                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          pricingView === "monthly" ? "bg-sa-primary text-zinc-950" : "text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingView("yearly")}
                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          pricingView === "yearly" ? "bg-sa-primary text-zinc-950" : "text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        Yearly
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(content.pricing ?? []).map((item) => (
                      <div key={item.id ?? item.slug ?? item.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                          {item.badge && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{item.badge}</span>}
                          {item.highlight && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">Featured</span>}
                        </div>
                        <p className="text-xs font-semibold text-zinc-300">
                          {formatLandingCurrency(
                            pricingView === "yearly"
                              ? (item.yearlyPrice ?? item.price?.yearly ?? item.monthlyPrice ?? item.price?.monthly ?? 0)
                              : (item.monthlyPrice ?? item.price?.monthly ?? 0),
                            content?.seo?.priceCurrency ?? "INR",
                          )}
                          <span className="ml-1 text-zinc-500">/{pricingView === "yearly" ? "yr" : "mo"}</span>
                        </p>
                        <p className="text-xs text-zinc-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
                <FooterPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "about" && (
                <AboutPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "contact" && (
                <ContactPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "brands" && (
                <BrandsPanel data={sectionData} onChange={handleChange} onSave={() => handleSave()} saving={saving} />
              )}
              {activeTab === "problemSolution" && (
                <ProblemSolutionPanel data={sectionData} onChange={handleChange} onSave={() => handleSave()} saving={saving} />
              )}
              {activeTab === "howItWorks" && (
                <HowItWorksPanel data={sectionData} onChange={handleChange} onSave={() => handleSave()} saving={saving} />
              )}
              {activeTab === "benefits" && (
                <BenefitsPanel data={sectionData} onChange={handleChange} onSave={() => handleSave()} saving={saving} />
              )}
              {activeTab === "demo" && (
                <DemoSectionPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "cta" && (
                <CTASectionPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "seo" && (
                <SeoPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
            </>
          )}
        </div>
      </div>

      {ToastUI}
    </div>
  );
}
