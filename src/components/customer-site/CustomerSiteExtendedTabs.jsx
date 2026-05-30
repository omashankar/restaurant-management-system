"use client";

import CmsSaveActions from "@/components/customer-site/CmsSaveActions";
import { CMS_EDITOR_SECTION, CMS_EDITOR_SECTION_TIGHT } from "@/config/customerSiteEditorClasses";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";

const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-ra-primary placeholder:text-zinc-600";
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

function HeaderBlock({ title, headers, onChange, showAction = false }) {
  const h = headers ?? {};
  return (
    <div className="rounded-xl border border-zinc-800/80 p-3 space-y-2">
      <p className="text-xs font-semibold text-zinc-300">{title}</p>
      <input
        value={h.badge ?? ""}
        onChange={(e) => onChange({ ...h, badge: e.target.value })}
        placeholder="Badge"
        className={inputCls}
      />
      <input
        value={h.title ?? ""}
        onChange={(e) => onChange({ ...h, title: e.target.value })}
        placeholder="Title"
        className={inputCls}
      />
      <input
        value={h.subtitle ?? ""}
        onChange={(e) => onChange({ ...h, subtitle: e.target.value })}
        placeholder="Subtitle"
        className={inputCls}
      />
      {showAction && (
        <input
          value={h.actionLabel ?? ""}
          onChange={(e) => onChange({ ...h, actionLabel: e.target.value })}
          placeholder="Link button label"
          className={inputCls}
        />
      )}
    </div>
  );
}

export function HomeSectionsTab({ home, setHome, saving, onSaveDraft, onPublish }) {
  const setHeader = (key, val) =>
    setHome((p) => ({
      ...p,
      sectionHeaders: { ...p.sectionHeaders, [key]: val },
    }));

  return (
    <div className={CMS_EDITOR_SECTION}>
      <p className="text-xs text-zinc-500">
        Lower home page: order types, categories title, featured, menu preview, steps, reviews, and bottom CTA.
      </p>

      <HeaderBlock title="Order types section" headers={home.sectionHeaders?.orderTypes} onChange={(v) => setHeader("orderTypes", v)} />
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-400">Order type cards (do not change IDs)</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(home.orderTypes ?? []).map((t, i) => (
          <div key={t.id} className="rounded-xl border border-zinc-800 p-3 space-y-2">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase">{t.id}</p>
            <input
              value={t.title}
              onChange={(e) =>
                setHome((p) => {
                  const o = [...p.orderTypes];
                  o[i] = { ...o[i], title: e.target.value };
                  return { ...p, orderTypes: o };
                })
              }
              placeholder="Title"
              className={inputCls}
            />
            <textarea
              rows={2}
              value={t.description}
              onChange={(e) =>
                setHome((p) => {
                  const o = [...p.orderTypes];
                  o[i] = { ...o[i], description: e.target.value };
                  return { ...p, orderTypes: o };
                })
              }
              className={textareaCls}
            />
          </div>
        ))}
        </div>
      </div>

      <HeaderBlock title="Categories row" headers={home.sectionHeaders?.categories} onChange={(v) => setHeader("categories", v)} showAction />
      <HeaderBlock title="Chef's favorites" headers={home.sectionHeaders?.featured} onChange={(v) => setHeader("featured", v)} showAction />
      <HeaderBlock title="Menu preview" headers={home.sectionHeaders?.menuPreview} onChange={(v) => setHeader("menuPreview", v)} showAction />

      <HeaderBlock title="How it works" headers={home.sectionHeaders?.steps} onChange={(v) => setHeader("steps", v)} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(home.steps ?? []).map((step, i) => (
          <div key={step.n} className="rounded-xl border border-zinc-800 p-3 space-y-2">
            <p className="text-xs text-zinc-500">Step {step.n}</p>
            <input
              value={step.title}
              onChange={(e) =>
                setHome((p) => {
                  const s = [...p.steps];
                  s[i] = { ...s[i], title: e.target.value };
                  return { ...p, steps: s };
                })
              }
              className={inputCls}
            />
            <textarea
              rows={2}
              value={step.text}
              onChange={(e) =>
                setHome((p) => {
                  const s = [...p.steps];
                  s[i] = { ...s[i], text: e.target.value };
                  return { ...p, steps: s };
                })
              }
              className={textareaCls}
            />
          </div>
        ))}
      </div>

      <HeaderBlock title="Reviews" headers={home.sectionHeaders?.reviews} onChange={(v) => setHeader("reviews", v)} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(home.reviews ?? []).map((r, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 p-3 space-y-2">
            <input
              value={r.name}
              onChange={(e) =>
                setHome((p) => {
                  const arr = [...p.reviews];
                  arr[i] = { ...arr[i], name: e.target.value };
                  return { ...p, reviews: arr };
                })
              }
              placeholder="Name"
              className={inputCls}
            />
            <input
              value={r.role}
              onChange={(e) =>
                setHome((p) => {
                  const arr = [...p.reviews];
                  arr[i] = { ...arr[i], role: e.target.value };
                  return { ...p, reviews: arr };
                })
              }
              placeholder="Role"
              className={inputCls}
            />
            <textarea
              rows={2}
              value={r.quote}
              onChange={(e) =>
                setHome((p) => {
                  const arr = [...p.reviews];
                  arr[i] = { ...arr[i], quote: e.target.value };
                  return { ...p, reviews: arr };
                })
              }
              className={textareaCls}
            />
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2">Bottom CTA</p>
      <Field label="Title">
        <input
          value={home.cta?.title ?? ""}
          onChange={(e) => setHome((p) => ({ ...p, cta: { ...p.cta, title: e.target.value } }))}
          className={inputCls}
        />
      </Field>
      <Field label="Subtitle">
        <textarea
          rows={2}
          value={home.cta?.subtitle ?? ""}
          onChange={(e) => setHome((p) => ({ ...p, cta: { ...p.cta, subtitle: e.target.value } }))}
          className={textareaCls}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Primary button">
          <input
            value={home.cta?.primaryLabel ?? ""}
            onChange={(e) => setHome((p) => ({ ...p, cta: { ...p.cta, primaryLabel: e.target.value } }))}
            className={inputCls}
          />
        </Field>
        <Field label="Primary link" hint="Empty + modal = order popup">
          <input
            value={home.cta?.primaryLink ?? ""}
            onChange={(e) =>
              setHome((p) => ({
                ...p,
                cta: { ...p.cta, primaryLink: e.target.value, primaryOpensModal: !e.target.value.trim() },
              }))
            }
            className={inputCls}
          />
        </Field>
        <Field label="Secondary button">
          <input
            value={home.cta?.secondaryLabel ?? ""}
            onChange={(e) => setHome((p) => ({ ...p, cta: { ...p.cta, secondaryLabel: e.target.value } }))}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary link">
          <input
            value={home.cta?.secondaryLink ?? ""}
            onChange={(e) => setHome((p) => ({ ...p, cta: { ...p.cta, secondaryLink: e.target.value } }))}
            className={inputCls}
          />
        </Field>
      </div>

      <CmsSaveActions
        section="home"
        saving={saving}
        onSaveDraft={() => onSaveDraft("home", home)}
        onPublish={() => onPublish("home", home)}
      />
    </div>
  );
}

export function AboutExtrasFields({ about, setAbout }) {
  const setFh = (val) => setAbout((p) => ({ ...p, featuresHeader: val }));

  return (
    <div className="space-y-4 border-t border-zinc-800 pt-5 mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">About page — extra sections</p>
      <HeaderBlock title="Features block" headers={about.featuresHeader} onChange={setFh} />
      {(about.features ?? DEFAULTS.about.features).map((f, i) => (
        <div key={i} className="rounded-xl border border-zinc-800 p-3 space-y-2">
          <input
            value={f.title}
            onChange={(e) =>
              setAbout((p) => {
                const arr = [...(p.features ?? [])];
                arr[i] = { ...arr[i], title: e.target.value };
                return { ...p, features: arr };
              })
            }
            placeholder="Feature title"
            className={inputCls}
          />
          <textarea
            rows={2}
            value={f.description}
            onChange={(e) =>
              setAbout((p) => {
                const arr = [...(p.features ?? [])];
                arr[i] = { ...arr[i], description: e.target.value };
                return { ...p, features: arr };
              })
            }
            className={textareaCls}
          />
        </div>
      ))}
      <HeaderBlock title="Visit us" headers={about.visitHeader} onChange={(v) => setAbout((p) => ({ ...p, visitHeader: v }))} />
      <p className="text-xs text-zinc-600">Address / phone / hours come from Settings.</p>
      <p className="text-xs font-medium text-zinc-400">Bottom CTA on About</p>
      <Field label="Title">
        <input
          value={about.bottomCta?.title ?? ""}
          onChange={(e) => setAbout((p) => ({ ...p, bottomCta: { ...p.bottomCta, title: e.target.value } }))}
          className={inputCls}
        />
      </Field>
      <Field label="Subtitle">
        <textarea
          rows={2}
          value={about.bottomCta?.subtitle ?? ""}
          onChange={(e) => setAbout((p) => ({ ...p, bottomCta: { ...p.bottomCta, subtitle: e.target.value } }))}
          className={textareaCls}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Primary button">
          <input
            value={about.bottomCta?.primaryLabel ?? ""}
            onChange={(e) => setAbout((p) => ({ ...p, bottomCta: { ...p.bottomCta, primaryLabel: e.target.value } }))}
            className={inputCls}
          />
        </Field>
        <Field label="Primary link">
          <input
            value={about.bottomCta?.primaryLink ?? ""}
            onChange={(e) => setAbout((p) => ({ ...p, bottomCta: { ...p.bottomCta, primaryLink: e.target.value } }))}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary button">
          <input
            value={about.bottomCta?.secondaryLabel ?? ""}
            onChange={(e) => setAbout((p) => ({ ...p, bottomCta: { ...p.bottomCta, secondaryLabel: e.target.value } }))}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary link">
          <input
            value={about.bottomCta?.secondaryLink ?? ""}
            onChange={(e) => setAbout((p) => ({ ...p, bottomCta: { ...p.bottomCta, secondaryLink: e.target.value } }))}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

export function ContactPageTab({ contact, setContact, saving, onSaveDraft, onPublish }) {
  const fields = [
    "eyebrow",
    "title",
    "subtitle",
    "formTitle",
    "submitLabel",
    "successTitle",
    "successMessage",
  ];
  return (
    <div className={`${CMS_EDITOR_SECTION} space-y-4`}>
      <p className="text-xs text-zinc-500">Contact page headings and form labels. Address/phone/email → Settings.</p>
      {fields.map((key) => (
        <Field key={key} label={key}>
          {key.includes("subtitle") || key.includes("Message") ? (
            <textarea
              rows={key.includes("Message") ? 3 : 2}
              value={contact[key] ?? ""}
              onChange={(e) => setContact((p) => ({ ...p, [key]: e.target.value }))}
              className={textareaCls}
            />
          ) : (
            <input
              value={contact[key] ?? ""}
              onChange={(e) => setContact((p) => ({ ...p, [key]: e.target.value }))}
              className={inputCls}
            />
          )}
        </Field>
      ))}
      <CmsSaveActions
        section="contact"
        saving={saving}
        onSaveDraft={() => onSaveDraft("contact", contact)}
        onPublish={() => onPublish("contact", contact)}
      />
    </div>
  );
}

export function BookingPageTab({ booking, setBooking, saving, onSaveDraft, onPublish }) {
  const fields = Object.keys(DEFAULTS.booking);
  return (
    <div className={CMS_EDITOR_SECTION_TIGHT}>
      <p className="text-xs text-zinc-500">Table booking page labels. Tables/areas → Tables admin.</p>
      {fields.map((key) => (
        <Field key={key} label={key}>
          <input
            value={booking[key] ?? ""}
            onChange={(e) => setBooking((p) => ({ ...p, [key]: e.target.value }))}
            className={inputCls}
          />
        </Field>
      ))}
      <CmsSaveActions
        section="booking"
        saving={saving}
        onSaveDraft={() => onSaveDraft("booking", booking)}
        onPublish={() => onPublish("booking", booking)}
      />
    </div>
  );
}

export function MenuLabelsTab({ menu, setMenu, saving, onSaveDraft, onPublish }) {
  const fields = Object.keys(DEFAULTS.menu);
  return (
    <div className={CMS_EDITOR_SECTION_TIGHT}>
      <p className="text-xs text-zinc-500">Menu page text only. Dishes & prices → Menu → Items.</p>
      {fields.map((key) => (
        <Field key={key} label={key}>
          <input
            value={menu[key] ?? ""}
            onChange={(e) => setMenu((p) => ({ ...p, [key]: e.target.value }))}
            className={inputCls}
          />
        </Field>
      ))}
      <CmsSaveActions
        section="menu"
        saving={saving}
        onSaveDraft={() => onSaveDraft("menu", menu)}
        onPublish={() => onPublish("menu", menu)}
      />
    </div>
  );
}
