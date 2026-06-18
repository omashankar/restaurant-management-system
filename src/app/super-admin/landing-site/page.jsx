"use client";

import { raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import AdminSectionHeader from "@/components/ui/AdminSectionHeader";
import { AdminSideNav, AdminSideNavItem, AdminSideNavList } from "@/components/ui/AdminSideNav";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { saBtnPrimaryCls, saIconBadgeCls, saInputCls, saSideNavActiveCls } from "@/config/superAdminTheme";
import { formatLandingCurrency } from "@/lib/formatLandingCurrency";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconPicker from "@/components/ui/IconPicker";
import Modal from "@/components/ui/Modal";
import { getIcon, getRoleIcon } from "@/lib/iconMap";
import { useToast } from "@/hooks/useToast";
import {
  AlertCircle, BarChart3, CreditCard, Globe, HelpCircle,
  Info, LayoutTemplate, Link2, Mail, MessageSquare, Search,
  Pencil, Plus, Save, Star, Trash2, Users,
} from "lucide-react";
import Link from "next/link";
import { decimalInputProps, phoneInputProps } from "@/lib/formInputTypes";
import { validateLandingSection } from "@/lib/landingValidation";
import { sanitizeLandingSectionPayload } from "@/lib/landingSanitize";
import { extractIndianMobileDigits, isValidIndianMobile } from "@/lib/phoneUtils";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── shared input class ── */
const ic = saInputCls;

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
    <label className="cursor-pointer flex min-w-0 items-center justify-between gap-4 admin-surface-card px-4 py-3 transition-colors hover:border-[var(--admin-border)]">
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium admin-shell-text">{label}</p>
        {description && <p className="mt-0.5 break-words text-xs admin-surface-muted">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-sa-primary" : "bg-[var(--admin-border)]"}`}>
        <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

/* ── Save button ── */
function SaveBtn({ saving, onClick }) {
  return (
    <div className="flex justify-stretch pt-2 sm:justify-end">
      <button type="button" onClick={() => onClick?.()} disabled={saving}
        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 sm:w-auto ${saBtnPrimaryCls} disabled:opacity-50`}>
        {saving
          ? <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
          : <Save className="size-4" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ── String list editor (one input per row) ── */
function StringListEditor({
  label,
  hint,
  required,
  error,
  items = [],
  onChange,
  placeholder = "",
  addLabel = "Add item",
  emptyMessage = "No items yet. Add your first one.",
}) {
  const list = Array.isArray(items) ? items : [];
  const update = (i, v) => onChange(list.map((x, idx) => (idx === i ? v : x)));
  const add = () => onChange([...list, ""]);
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <div className="space-y-2">
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed admin-shell-border py-8 text-center text-sm admin-surface-faint">
            {emptyMessage}
          </div>
        )}
        {list.map((item, i) => (
          <div key={i} className="flex min-w-0 gap-2">
            <input
              value={item ?? ""}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className={`${ic} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove item ${i + 1}`}
              className="cursor-pointer shrink-0 rounded-lg p-2 admin-icon-hover-danger transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm admin-surface-muted hover-border-sa-primary-40 hover-sa-primary transition-colors"
        >
          <Plus className="size-4" /> {addLabel}
        </button>
      </div>
      {error && <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400"><AlertCircle className="size-3" />{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

/* ── Structured list editor (multiple fields per row) ── */
function NestedListEditor({
  label,
  hint,
  required,
  error,
  items = [],
  fields,
  onChange,
  maxItems,
  addLabel = "Add item",
  emptyMessage = "No items yet. Add your first one.",
  getItemKey,
}) {
  const list = Array.isArray(items) ? items : [];

  const makeEmptyItem = () => {
    const item = { id: Date.now().toString(36) };
    fields.forEach((f) => {
      if (f.type === "iconpicker") item[f.key] = f.default ?? "Circle";
      else item[f.key] = f.default ?? "";
    });
    return item;
  };

  const updateItem = (i, key, val) => {
    onChange(list.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));
  };

  const add = () => {
    if (maxItems != null && list.length >= maxItems) return;
    const next = makeEmptyItem();
    const stepField = fields.find((f) => f.key === "n");
    if (stepField) {
      next.n = String(list.length + 1).padStart(2, "0");
    }
    onChange([...list, next]);
  };

  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));

  const canAdd = maxItems == null || list.length < maxItems;

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <div className="space-y-3">
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed admin-shell-border py-8 text-center text-sm admin-surface-faint">
            {emptyMessage}
          </div>
        )}
        {list.map((item, i) => (
          <div
            key={getItemKey?.(item, i) ?? item.id ?? i}
            className="space-y-3 admin-surface-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">
                Item {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove item ${i + 1}`}
                className="cursor-pointer rounded-lg p-1.5 admin-icon-hover-danger transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.fullWidth ? "sm:col-span-2" : f.narrow ? "sm:col-span-1 max-w-[6rem]" : ""}>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                    {f.label}{f.required && <span className="ml-0.5 text-red-400">*</span>}
                  </label>
                  {f.type === "iconpicker" ? (
                    <IconPicker
                      value={item[f.key] ?? f.default ?? "Circle"}
                      onChange={(v) => updateItem(i, f.key, v)}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={f.rows ?? 3}
                      value={item[f.key] ?? ""}
                      placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      onChange={(e) => updateItem(i, f.key, e.target.value)}
                      className={`${ic} resize-none`}
                    />
                  ) : (
                    <input
                      value={item[f.key] ?? ""}
                      placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      onChange={(e) => updateItem(i, f.key, e.target.value)}
                      className={ic}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={add}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm admin-surface-muted hover-border-sa-primary-40 hover-sa-primary transition-colors"
          >
            <Plus className="size-4" /> {addLabel}
          </button>
        )}
      </div>
      {error && <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400"><AlertCircle className="size-3" />{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
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
  { id: "faq",          label: "FAQ",          Icon: HelpCircle     },
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

function isSavePayloadOverride(value) {
  if (value === undefined) return false;
  if (value == null) return true;
  if (Array.isArray(value)) return true;
  if (typeof value !== "object") return true;
  if (typeof value.preventDefault === "function" && value.nativeEvent != null) return false;
  return true;
}

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
      <AdminSectionHeader icon={Link2} title="Navbar" description="Customize logo text, links, and top navigation CTAs." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Logo Text" required error={fieldErrors.logoText}>
          <input
            value={logo.text ?? ""}
            onChange={(e) => {
              onChange("logo", { ...logo, text: e.target.value });
              onClearError?.("logoText");
            }}
            placeholder="BhojDesk"
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
        {Object.entries(fieldErrors).some(([k, v]) => k.startsWith("link_") && v) && (
          <p className="mb-2 flex items-center gap-1 text-[11px] text-red-400">
            <AlertCircle className="size-3 shrink-0" />
            {Object.entries(fieldErrors).find(([k, v]) => k.startsWith("link_") && v)?.[1]}
          </p>
        )}
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="grid gap-2 admin-surface-card p-3 sm:grid-cols-3">
              <input value={l.label ?? ""} onChange={e => updateLink(i, "label", e.target.value)} placeholder="Label" className={ic} />
              <input value={l.href ?? ""} onChange={e => updateLink(i, "href", e.target.value)} placeholder="#features or /page" className={ic} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-zinc-400">
                  <input type="checkbox" checked={!!l.external} onChange={e => updateLink(i, "external", e.target.checked)} />
                  External
                </label>
                <button type="button" onClick={() => removeLink(i)} className="cursor-pointer ml-auto shrink-0 rounded-lg p-2 admin-icon-hover-danger transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addLink} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm admin-surface-muted hover-border-sa-primary-40 hover-sa-primary transition-colors">
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
      <AdminSectionHeader icon={LayoutTemplate} title="Hero Section" description="Headline, subheading, and CTA buttons." />
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
      <Field
        label="Trial note"
        hint="Shown under CTA buttons and on the mobile sticky bar."
        error={fieldErrors.trialNote}
      >
        <input
          value={data.trialNote ?? ""}
          onChange={(e) => {
            onChange("trialNote", e.target.value);
            onClearError?.("trialNote");
          }}
          placeholder="14-day free trial · No credit card required"
          maxLength={80}
          className={ic}
        />
      </Field>
      <NestedListEditor
        label="Hero stats"
        hint="Up to 3 stats shown under the headline."
        error={fieldErrors.stats}
        items={Array.isArray(data.stats) ? data.stats : []}
        maxItems={3}
        addLabel="Add stat"
        emptyMessage="No stats yet. Add up to 3."
        getItemKey={(item, i) => item.id ?? `stat-${i}`}
        onChange={(stats) => {
          onChange("stats", stats);
          onClearError?.("stats");
        }}
        fields={[
          { key: "value", label: "Value", placeholder: "500+", required: true, narrow: true, maxLength: 20 },
          { key: "label", label: "Label", placeholder: "Restaurants onboarded", required: true, fullWidth: false },
        ]}
      />

      {/* Live preview */}
      {(data.headline || data.badge) && (
        <div className="rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest admin-surface-faint">Live Preview</p>
          {data.badge && (
            <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              {data.badge}
            </span>
          )}
          {data.headline && <h3 className="mt-3 break-words text-lg font-bold admin-shell-text sm:text-xl">{data.headline}</h3>}
          {data.subheadline && <p className="mt-2 break-words text-sm admin-surface-muted">{data.subheadline}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {data.ctaPrimary && <span className="rounded-xl bg-sa-primary px-4 py-2 text-xs font-semibold text-zinc-950">{data.ctaPrimary}</span>}
            {data.ctaSecondary && (
              <span className="rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-control)] px-4 py-2 text-xs font-semibold admin-surface-body">
                {data.ctaSecondary}
              </span>
            )}
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
    try {
      const updated = editIdx === -1
        ? [...items, { id: Date.now().toString(36), ...form }]
        : items.map((x, i) => i === editIdx ? { ...x, ...form } : x);
      const ok = await onSave(updated);
      if (ok !== false) setEditIdx(null);
    } finally {
      setItemSaving(false);
    }
  };

  const handleDelete = async () => {
    setItemSaving(true);
    try {
      const ok = await onSave(items.filter((_, i) => i !== deleteIdx));
      if (ok !== false) setDeleteIdx(null);
    } finally {
      setItemSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={Icon} title={title} description={description} />

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed admin-shell-border py-10 text-center text-sm admin-surface-faint">
            No items yet. Add your first one.
          </div>
        )}
        {items.map((item, i) => (
          <div key={item.id ?? i} className="flex min-w-0 flex-col gap-2 admin-surface-card px-4 py-3 transition-colors hover:border-[var(--admin-border)] sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1">{renderCard(item)}</div>
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
              <button type="button" onClick={() => openEdit(i)}
                className="cursor-pointer rounded-lg p-1.5 admin-icon-hover-edit transition-colors">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={() => setDeleteIdx(i)}
                className="cursor-pointer rounded-lg p-1.5 admin-icon-hover-danger transition-colors">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={openAdd}
        className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm admin-surface-muted hover-border-sa-primary-40 hover-sa-primary transition-colors">
        <Plus className="size-4" /> Add {title.replace(/s$/, "")}
      </button>

      {/* Add / Edit modal */}
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)}
        title={editIdx === -1 ? `Add ${title.replace(/s$/, "")}` : `Edit ${title.replace(/s$/, "")}`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setEditIdx(null)}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body transition-colors hover:border-zinc-500 sm:w-auto">
              Cancel
            </button>
            <button type="button" disabled={itemSaving} onClick={handleSave}
              className="w-full cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-40 sm:w-auto">
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
      <AdminSectionHeader icon={Mail} title="Footer" description="Company info, contact details, and footer links." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" required error={fieldErrors.companyName}>
          <input
            value={data.companyName ?? ""}
            onChange={(e) => {
              onChange("companyName", e.target.value);
              onClearError?.("companyName");
            }}
            placeholder="BhojDesk"
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
            placeholder="support@bhojdesk.com"
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
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input value={l.label ?? ""} onChange={e => updateLink(i, "label", e.target.value)}
                placeholder="Label" className={`${ic} min-w-0 sm:flex-1`} />
              <input value={l.href ?? ""} onChange={e => updateLink(i, "href", e.target.value)}
                placeholder="/url or #anchor" className={`${ic} min-w-0 sm:flex-1`} />
              <button type="button" onClick={() => removeLink(i)}
                className="cursor-pointer shrink-0 self-end rounded-lg p-2 admin-icon-hover-danger transition-colors sm:self-auto">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addLink}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm admin-surface-muted hover-border-sa-primary-40 hover-sa-primary transition-colors">
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
      <AdminSectionHeader icon={Info} title="About Section" description="Control about headline, text, and media details." />
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
      <AdminSectionHeader icon={Mail} title="Contact Section" description="Set support contact details shown on landing page." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={fieldErrors.email}>
          <input
            type="email"
            value={data.email ?? ""}
            onChange={(e) => {
              onChange("email", e.target.value);
              onClearError?.("email");
            }}
            placeholder="support@bhojdesk.com"
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
      <AdminSectionHeader icon={Search} title="SEO Settings" description="Manage metadata for search and social previews." />
      <Field label="Meta Title" error={fieldErrors.title}>
        <input
          value={data.title ?? ""}
          onChange={(e) => {
            onChange("title", e.target.value);
            onClearError?.("title");
          }}
          placeholder="BhojDesk Restaurant Management System"
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

function BrandsPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={Star} title="Brand Strip" description="Trusted-by label and brand chips." />
      <Field label="Eyebrow">
        <input value={data.eyebrow ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} placeholder="Trusted by" className={ic} />
      </Field>
      <StringListEditor
        label="Brands"
        hint="Brand names shown in the trust strip."
        required
        items={data.items}
        onChange={(items) => onChange("items", items)}
        placeholder="Restaurant name"
        addLabel="Add brand"
        emptyMessage="No brands yet."
      />
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function ProblemSolutionPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={AlertCircle} title="Problem / Solution" description="Edit both cards shown under hero." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Section Eyebrow"><input value={data.sectionEyebrow ?? ""} onChange={(e) => onChange("sectionEyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Section Title"><input value={data.sectionTitle ?? ""} onChange={(e) => onChange("sectionTitle", e.target.value)} className={ic} /></Field>
        <Field label="Section Subtext"><input value={data.sectionSubtext ?? ""} onChange={(e) => onChange("sectionSubtext", e.target.value)} className={ic} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Problem Eyebrow"><input value={data.problemEyebrow ?? ""} onChange={(e) => onChange("problemEyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Problem Title"><input value={data.problemTitle ?? ""} onChange={(e) => onChange("problemTitle", e.target.value)} className={ic} /></Field>
        <Field label="Solution Eyebrow"><input value={data.solutionEyebrow ?? ""} onChange={(e) => onChange("solutionEyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Solution Title"><input value={data.solutionTitle ?? ""} onChange={(e) => onChange("solutionTitle", e.target.value)} className={ic} /></Field>
      </div>
      <Field label="Solution Description">
        <textarea rows={3} value={data.solutionDescription ?? ""} onChange={(e) => onChange("solutionDescription", e.target.value)} className={`${ic} resize-none`} />
      </Field>
      <StringListEditor
        label="Problem points"
        hint="Pain points listed on the problem card."
        required
        items={data.problems}
        onChange={(problems) => onChange("problems", problems)}
        placeholder="e.g. Orders get lost between counter and kitchen"
        addLabel="Add problem point"
        emptyMessage="No problem points yet."
      />
      <StringListEditor
        label="Solution points"
        hint="Benefits listed on the solution card."
        required
        items={data.solutionPoints}
        onChange={(solutionPoints) => onChange("solutionPoints", solutionPoints)}
        placeholder="e.g. One POS for dine-in, takeaway, and delivery"
        addLabel="Add solution point"
        emptyMessage="No solution points yet."
      />
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function HowItWorksPanel({ data, onChange, onSave, saving }) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={BarChart3} title="How It Works" description="Step-by-step flow shown on the landing page." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Eyebrow"><input value={data.eyebrow ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Title"><input value={data.title ?? ""} onChange={(e) => onChange("title", e.target.value)} className={ic} /></Field>
        <Field label="Subtext"><input value={data.subtext ?? ""} onChange={(e) => onChange("subtext", e.target.value)} className={ic} /></Field>
      </div>
      <NestedListEditor
        label="Steps"
        hint="Each step needs a number, title, description, and icon."
        required
        items={steps}
        onChange={(next) => onChange("steps", next)}
        addLabel="Add step"
        emptyMessage="No steps yet."
        getItemKey={(item, i) => item.id ?? `step-${i}`}
        fields={[
          { key: "n", label: "Step #", placeholder: "01", required: true, narrow: true, maxLength: 4 },
          { key: "title", label: "Title", placeholder: "Setup Restaurant", required: true },
          { key: "text", label: "Description", type: "textarea", rows: 2, placeholder: "Configure menu, pricing, taxes…", required: true, fullWidth: true, maxLength: 300 },
          { key: "icon", label: "Icon", type: "iconpicker", default: "Circle", fullWidth: true },
        ]}
      />
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function BenefitsPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={Users} title="Benefits Block" description="Device card + Why BhojDesk card content." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Section Eyebrow"><input value={data.sectionEyebrow ?? ""} onChange={(e) => onChange("sectionEyebrow", e.target.value)} className={ic} /></Field>
        <Field label="Section Title"><input value={data.sectionTitle ?? ""} onChange={(e) => onChange("sectionTitle", e.target.value)} className={ic} /></Field>
        <Field label="Section Subtext"><input value={data.sectionSubtext ?? ""} onChange={(e) => onChange("sectionSubtext", e.target.value)} className={ic} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Device Badge"><input value={data.deviceBadge ?? ""} onChange={(e) => onChange("deviceBadge", e.target.value)} className={ic} /></Field>
        <Field label="Why Badge"><input value={data.whyBadge ?? ""} onChange={(e) => onChange("whyBadge", e.target.value)} className={ic} /></Field>
        <Field label="Device Title"><input value={data.deviceTitle ?? ""} onChange={(e) => onChange("deviceTitle", e.target.value)} className={ic} /></Field>
        <Field label="Why Title"><input value={data.whyTitle ?? ""} onChange={(e) => onChange("whyTitle", e.target.value)} className={ic} /></Field>
      </div>
      <Field label="Device Description">
        <textarea rows={3} value={data.deviceDescription ?? ""} onChange={(e) => onChange("deviceDescription", e.target.value)} className={`${ic} resize-none`} />
      </Field>
      <StringListEditor
        label="Benefit points"
        hint="Bullet points on the “Why BhojDesk” card."
        required
        items={data.items}
        onChange={(items) => onChange("items", items)}
        placeholder="e.g. Real-time kitchen display"
        addLabel="Add benefit"
        emptyMessage="No benefit points yet."
      />
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function DemoSectionPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={Globe} title="Demo Section" description="Dashboard-style preview strip and section copy." />
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

function FaqPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={HelpCircle} title="FAQ Section" description="Accordion questions shown before the contact form." />
      <Toggle
        checked={data.enabled !== false}
        onChange={(v) => onChange("enabled", v)}
        label="Section enabled"
        description="Hide the FAQ block on the public landing page."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Eyebrow" error={fieldErrors.eyebrow}>
          <input
            value={data.eyebrow ?? ""}
            onChange={(e) => {
              onChange("eyebrow", e.target.value);
              onClearError?.("eyebrow");
            }}
            placeholder="FAQ"
            maxLength={80}
            className={ic}
          />
        </Field>
        <Field label="Title" error={fieldErrors.title}>
          <input
            value={data.title ?? ""}
            onChange={(e) => {
              onChange("title", e.target.value);
              onClearError?.("title");
            }}
            placeholder="Questions before you sign up?"
            maxLength={120}
            className={ic}
          />
        </Field>
        <Field label="Subtext" error={fieldErrors.subtext}>
          <input
            value={data.subtext ?? ""}
            onChange={(e) => {
              onChange("subtext", e.target.value);
              onClearError?.("subtext");
            }}
            placeholder="Quick answers about setup and pricing."
            maxLength={500}
            className={ic}
          />
        </Field>
      </div>
      <NestedListEditor
        label="FAQ items"
        required
        items={items}
        onChange={(next) => onChange("items", next)}
        addLabel="Add FAQ"
        emptyMessage="No FAQs yet. Add your first question."
        getItemKey={(item, i) => item.id ?? `faq-${i}`}
        fields={[
          { key: "q", label: "Question", placeholder: "How long does setup take?", required: true, fullWidth: true, maxLength: 200 },
          { key: "a", label: "Answer", type: "textarea", rows: 3, placeholder: "Most restaurants go live in about 15 minutes…", required: true, fullWidth: true, maxLength: 1000 },
        ]}
      />
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function CTASectionPanel({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <AdminSectionHeader icon={LayoutTemplate} title="CTA banner" description="Gradient call-to-action block before the footer." />
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
  { key: "icon",        label: "Icon",        type: "iconpicker", required: true, default: "Users" },
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
  { key: "quote", label: "Quote", placeholder: "BhojDesk helped us…", required: true, type: "textarea" },
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
  const activeTabRef              = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const clearSectionError = useCallback((key) => {
    setSectionErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  const normalizePhoneForEditor = (phone) => {
    const digits = extractIndianMobileDigits(phone);
    return digits && isValidIndianMobile(digits) ? digits : "";
  };

  const normalizePricingForEditor = useCallback((rawContent) => {
    if (!rawContent) return rawContent;
    const pricing = Array.isArray(rawContent.pricing)
      ? rawContent.pricing.map((plan) => ({
          ...plan,
          monthlyPrice: plan?.price?.monthly ?? 0,
          yearlyPrice: plan?.price?.yearly ?? plan?.price?.monthly ?? 0,
        }))
      : [];
    const contact = rawContent.contact
      ? { ...rawContent.contact, phone: normalizePhoneForEditor(rawContent.contact.phone) }
      : rawContent.contact;
    const footer = rawContent.footer
      ? {
          ...sanitizeLandingSectionPayload("footer", rawContent.footer),
          phone: normalizePhoneForEditor(rawContent.footer.phone),
        }
      : rawContent.footer;
    const navbar = rawContent.navbar
      ? sanitizeLandingSectionPayload("navbar", rawContent.navbar)
      : rawContent.navbar;
    return { ...rawContent, pricing, contact, footer, navbar };
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
    setContent((prev) => {
      const tab = activeTabRef.current;
      const arrSections = ["features", "roles", "pricing", "testimonials"];
      if (arrSections.includes(tab)) return { ...prev, [tab]: keyOrArr };
      return { ...prev, [tab]: { ...(prev[tab] ?? {}), [keyOrArr]: val } };
    });
  }, []);

  /* ── Save active section (optionally with override data) ── */
  const handleSave = useCallback(async (overrideData) => {
    if (!content) return false;
    const tab = activeTabRef.current;
    if (tab === "pricing") {
      showToast("Pricing is synced from Plans. Please update /super-admin/plans.", "error");
      return false;
    }
    const rawPayload = isSavePayloadOverride(overrideData) ? overrideData : content[tab];
    const payload = sanitizeLandingSectionPayload(tab, rawPayload);
    const validation = validateLandingSection(tab, payload);
    if (!validation.valid) {
      setSectionErrors(validation.errors);
      const tabLabel = TABS.find((t) => t.id === tab)?.label ?? tab;
      showToast(
        validation.message
          ? `${tabLabel}: ${validation.message}`
          : "Please fix the highlighted fields.",
        "error",
      );
      return false;
    }
    setSectionErrors({});
    setSaving(true);
    try {
      const res     = await fetch("/api/super-admin/landing", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ section: tab, data: payload }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error ?? "Failed to save.", "error");
        return false;
      }
      setContent((prev) => ({ ...prev, [tab]: payload }));
      showToast("Saved successfully.");
      return true;
    } catch {
      showToast("Network error.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [content, showToast]);

  const switchTab = (id) => {
    setActiveTab(id);
    setSectionErrors({});
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => {
        document.getElementById(`landing-tab-${id}`)?.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: "smooth",
        });
      });
    }
  };

  const panelValidationProps = {
    fieldErrors: sectionErrors,
    onClearError: clearSectionError,
  };

  const sectionData = content?.[activeTab] ?? {};

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-10">

      {/* ── Page header ── */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 flex shrink-0 items-center justify-center ${saIconBadgeCls}`}>
            <Globe className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Landing Site</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">
              Manage your public-facing website content. Changes go live immediately.
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
        <Link
          href="/?preview=1"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preview landing site in new tab"
          className={raPageRefreshBtnCls}
        >
          <Globe className="size-3.5" /> Preview Site
        </Link>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">

        <AdminSideNav className="min-w-0 w-full lg:w-52">
          <p className={`px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>
            Sections
          </p>
          <AdminSideNavList className="scroll-px-2 snap-x snap-mandatory lg:snap-none lg:gap-0.5">
            {TABS.map(({ id, label, Icon }) => (
              <AdminSideNavItem
                key={id}
                id={`landing-tab-${id}`}
                active={id === activeTab}
                activeClassName={id === activeTab ? saSideNavActiveCls : ""}
                onClick={() => switchTab(id)}
                icon={Icon}
                className="snap-start"
              >
                {label}
              </AdminSideNavItem>
            ))}
          </AdminSideNavList>
        </AdminSideNav>

        {/* ── Content panel ── */}
        <div ref={panelRef} className="min-w-0 flex-1 overflow-x-hidden admin-surface-card p-4 sm:p-6">
          {fetching ? (
            <SuperAdminPageSkeleton rows={4} />
          ) : !content ? (
            <div className="py-20 text-center text-sm admin-surface-faint">Failed to load content.</div>
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
                      <p className="break-words text-sm font-medium admin-shell-text">{item.title}</p>
                      <p className="break-words text-xs admin-surface-muted sm:truncate">{item.description}</p>
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
                    const RoleIcon = getRoleIcon(item.role, item.icon, item.id);
                    return (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                          <RoleIcon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium admin-shell-text">{item.role}</p>
                          <p className="break-words text-xs admin-surface-muted sm:truncate">{item.description}</p>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
              {activeTab === "pricing" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-xs text-indigo-200">
                      Pricing here is synced from Plans and is read-only.
                    </p>
                    <Link
                      href="/super-admin/plans"
                      className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center rounded-lg border border-indigo-400/40 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:border-indigo-300 hover:text-white sm:w-auto"
                    >
                      Open Plans
                    </Link>
                  </div>
                  <div className="flex w-full justify-stretch sm:justify-end">
                    <div className="inline-flex w-full max-w-xs rounded-xl border admin-shell-border admin-surface-segment-track p-1 sm:w-auto sm:max-w-none">
                      <button
                        type="button"
                        onClick={() => setPricingView("monthly")}
                        className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                          pricingView === "monthly" ? "bg-sa-primary text-zinc-950" : "text-zinc-400 hover:bg-[var(--admin-hover)]"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingView("yearly")}
                        className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                          pricingView === "yearly" ? "bg-sa-primary text-zinc-950" : "text-zinc-400 hover:bg-[var(--admin-hover)]"
                        }`}
                      >
                        Yearly
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(content.pricing ?? []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border py-12 text-center">
                        <CreditCard className="size-10 text-zinc-700" />
                        <p className="text-sm admin-surface-muted">No plans synced yet.</p>
                        <Link
                          href="/super-admin/plans"
                          className="inline-flex cursor-pointer rounded-xl bg-sa-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110"
                        >
                          Open Plans
                        </Link>
                      </div>
                    ) : (
                    (content.pricing ?? []).map((item) => (
                      <div key={item.id ?? item.slug ?? item.name} className="min-w-0 admin-surface-card px-4 py-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="break-words text-sm font-medium admin-shell-text">{item.name}</p>
                          {item.badge && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{item.badge}</span>}
                          {item.highlight && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">Featured</span>}
                        </div>
                        <p className="break-words text-xs font-semibold admin-surface-body">
                          {formatLandingCurrency(
                            pricingView === "yearly"
                              ? (item.yearlyPrice ?? item.price?.yearly ?? item.monthlyPrice ?? item.price?.monthly ?? 0)
                              : (item.monthlyPrice ?? item.price?.monthly ?? 0),
                            content?.seo?.priceCurrency ?? "INR",
                          )}
                          <span className="ml-1 text-zinc-500">/{pricingView === "yearly" ? "yr" : "mo"}</span>
                        </p>
                        <p className="break-words text-xs admin-surface-muted">{item.description}</p>
                      </div>
                    ))
                    )}
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
                      <p className="break-words text-sm font-medium admin-shell-text">
                        {item.name}
                        {item.role && <span className="ml-1.5 text-xs font-normal text-zinc-500">— {item.role}</span>}
                      </p>
                      <p className="break-words text-xs admin-surface-muted sm:truncate">{item.quote}</p>
                    </>
                  )}
                />
              )}
              {activeTab === "faq" && (
                <FaqPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
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
                <BrandsPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "problemSolution" && (
                <ProblemSolutionPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "howItWorks" && (
                <HowItWorksPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
              )}
              {activeTab === "benefits" && (
                <BenefitsPanel data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />
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
