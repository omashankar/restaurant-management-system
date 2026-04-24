"use client";

import { useToast } from "@/hooks/useToast";
import {
  Bell, CreditCard, DollarSign, Globe,
  Key, Palette, Save, Settings,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── Shared styles ── */
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

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="cursor-pointer flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`cursor-pointer relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-zinc-700"}`}>
        <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
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
        {saving ? <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> : <Save className="size-4" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ── Section panels ── */
function AppSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Settings} title="App Settings" description="Platform identity and contact information." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Platform Name">
            <input value={data.name ?? ""} onChange={(e) => onChange("name", e.target.value)}
              placeholder="RMS Platform" className={inputCls} />
          </Field>
        </div>
        <Field label="Logo URL">
          <input value={data.logoUrl ?? ""} onChange={(e) => onChange("logoUrl", e.target.value)}
            placeholder="https://cdn.example.com/logo.png" className={inputCls} />
        </Field>
        <Field label="Favicon URL">
          <input value={data.faviconUrl ?? ""} onChange={(e) => onChange("faviconUrl", e.target.value)}
            placeholder="https://cdn.example.com/favicon.ico" className={inputCls} />
        </Field>
        <Field label="Support Email">
          <input type="email" value={data.supportEmail ?? ""} onChange={(e) => onChange("supportEmail", e.target.value)}
            placeholder="support@rms.com" className={inputCls} />
        </Field>
        <Field label="Contact Phone">
          <input value={data.contactPhone ?? ""} onChange={(e) => onChange("contactPhone", e.target.value)}
            placeholder="+1 555 000 0000" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Business Address">
            <input value={data.address ?? ""} onChange={(e) => onChange("address", e.target.value)}
              placeholder="123 Main St, City, Country" className={inputCls} />
          </Field>
        </div>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function EmailSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Key} title="Email / SMTP" description="Outbound email configuration." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SMTP Host">
          <input value={data.smtpHost ?? ""} onChange={(e) => onChange("smtpHost", e.target.value)}
            placeholder="smtp.gmail.com" className={inputCls} />
        </Field>
        <Field label="SMTP Port">
          <input type="number" value={data.smtpPort ?? 587} onChange={(e) => onChange("smtpPort", Number(e.target.value))}
            className={inputCls} />
        </Field>
        <Field label="SMTP Username">
          <input value={data.smtpUser ?? ""} onChange={(e) => onChange("smtpUser", e.target.value)}
            placeholder="user@gmail.com" className={inputCls} />
        </Field>
        <Field label="SMTP Password">
          <input type="password" value={data.smtpPassword ?? ""} onChange={(e) => onChange("smtpPassword", e.target.value)}
            placeholder="••••••••" autoComplete="new-password" className={inputCls} />
        </Field>
        <Field label="From Name">
          <input value={data.fromName ?? ""} onChange={(e) => onChange("fromName", e.target.value)}
            placeholder="RMS Platform" className={inputCls} />
        </Field>
        <Field label="From Email">
          <input type="email" value={data.fromEmail ?? ""} onChange={(e) => onChange("fromEmail", e.target.value)}
            placeholder="noreply@rms.com" className={inputCls} />
        </Field>
      </div>
      <Toggle checked={!!data.secure} onChange={(v) => onChange("secure", v)}
        label="Use SSL/TLS" description="Enable for port 465. Use STARTTLS for port 587." />
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function LanguageSection({ data, onChange, onSave, saving }) {
  const LANGUAGES = [["en","English"],["es","Spanish"],["fr","French"],["de","German"],["ar","Arabic"],["hi","Hindi"]];
  const TIMEZONES = ["UTC","America/New_York","America/Chicago","America/Los_Angeles","Europe/London","Europe/Paris","Asia/Kolkata","Asia/Tokyo","Australia/Sydney"];
  const DATE_FMTS = ["MM/DD/YYYY","DD/MM/YYYY","YYYY-MM-DD"];
  return (
    <div className="space-y-5">
      <SectionHeader icon={Globe} title="Language & Locale" description="Default language, timezone, and date format." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Default Language">
          <select value={data.defaultLanguage ?? "en"} onChange={(e) => onChange("defaultLanguage", e.target.value)}
            className={`cursor-pointer ${inputCls}`}>
            {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Timezone">
          <select value={data.timezone ?? "UTC"} onChange={(e) => onChange("timezone", e.target.value)}
            className={`cursor-pointer ${inputCls}`}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Field>
        <Field label="Date Format">
          <select value={data.dateFormat ?? "MM/DD/YYYY"} onChange={(e) => onChange("dateFormat", e.target.value)}
            className={`cursor-pointer ${inputCls}`}>
            {DATE_FMTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Time Format">
          <select value={data.timeFormat ?? "12h"} onChange={(e) => onChange("timeFormat", e.target.value)}
            className={`cursor-pointer ${inputCls}`}>
            <option value="12h">12-hour (AM/PM)</option>
            <option value="24h">24-hour</option>
          </select>
        </Field>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function PaymentSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={CreditCard} title="Payment Settings" description="Payment gateway keys and billing defaults." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stripe Publishable Key">
          <input value={data.stripePublicKey ?? ""} onChange={(e) => onChange("stripePublicKey", e.target.value)}
            placeholder="pk_live_…" className={`${inputCls} font-mono text-xs`} />
        </Field>
        <Field label="Stripe Secret Key">
          <input type="password" value={data.stripeSecretKey ?? ""} onChange={(e) => onChange("stripeSecretKey", e.target.value)}
            placeholder="sk_live_…" autoComplete="new-password" className={`${inputCls} font-mono text-xs`} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Webhook Secret" hint="From your Stripe dashboard → Webhooks.">
            <input type="password" value={data.webhookSecret ?? ""} onChange={(e) => onChange("webhookSecret", e.target.value)}
              placeholder="whsec_…" autoComplete="new-password" className={`${inputCls} font-mono text-xs`} />
          </Field>
        </div>
        <Field label="Default Currency">
          <select value={data.currency ?? "USD"} onChange={(e) => onChange("currency", e.target.value)}
            className={`cursor-pointer ${inputCls}`}>
            {["USD","EUR","GBP","INR","AUD","CAD","SGD","JPY"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tax Rate (%)" hint="Applied to all invoices.">
          <input type="number" min={0} max={100} step={0.01} value={data.taxPercent ?? 0}
            onChange={(e) => onChange("taxPercent", Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Trial Period (days)" hint="0 = no trial.">
          <input type="number" min={0} max={90} value={data.trialDays ?? 14}
            onChange={(e) => onChange("trialDays", Number(e.target.value))} className={inputCls} />
        </Field>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function ThemeSection({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Palette} title="Theme" description="Brand colors and UI preferences." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary Color">
          <div className="flex items-center gap-3">
            <input type="color" value={data.primaryColor ?? "#10b981"} onChange={(e) => onChange("primaryColor", e.target.value)}
              className="cursor-pointer size-10 shrink-0 rounded-lg border border-zinc-700 bg-transparent p-0.5" />
            <input value={data.primaryColor ?? "#10b981"} onChange={(e) => onChange("primaryColor", e.target.value)}
              placeholder="#10b981" className={`${inputCls} font-mono`} />
          </div>
        </Field>
        <Field label="Accent Color">
          <div className="flex items-center gap-3">
            <input type="color" value={data.accentColor ?? "#f43f5e"} onChange={(e) => onChange("accentColor", e.target.value)}
              className="cursor-pointer size-10 shrink-0 rounded-lg border border-zinc-700 bg-transparent p-0.5" />
            <input value={data.accentColor ?? "#f43f5e"} onChange={(e) => onChange("accentColor", e.target.value)}
              placeholder="#f43f5e" className={`${inputCls} font-mono`} />
          </div>
        </Field>
      </div>
      <Toggle checked={!!data.darkMode} onChange={(v) => onChange("darkMode", v)}
        label="Dark Mode" description="Use dark theme across the platform." />
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function NotificationsSection({ data, onChange, onSave, saving }) {
  const alerts = [
    { key: "newRestaurantAlert", label: "New restaurant registered",  desc: "Alert when a new tenant signs up." },
    { key: "paymentFailAlert",   label: "Payment failure alert",      desc: "Alert when a subscription payment fails." },
    { key: "weeklyReport",       label: "Weekly summary report",      desc: "Receive a weekly digest every Monday." },
    { key: "systemAlerts",       label: "System health alerts",       desc: "Critical errors and downtime notifications." },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader icon={Bell} title="Notifications" description="Email alerts and push notification settings." />
      <div className="space-y-2">
        {alerts.map(({ key, label, desc }) => (
          <Toggle key={key} checked={!!data[key]} onChange={(v) => onChange(key, v)} label={label} description={desc} />
        ))}
      </div>
      <div className="border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Push Notifications (Web Push)</p>
        <Toggle checked={!!data.pushEnabled} onChange={(v) => onChange("pushEnabled", v)}
          label="Enable Push Notifications" description="Send browser push notifications to admins." />
        {data.pushEnabled && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="VAPID Public Key">
              <input value={data.pushVapidPublicKey ?? ""} onChange={(e) => onChange("pushVapidPublicKey", e.target.value)}
                placeholder="BN…" className={`${inputCls} font-mono text-xs`} />
            </Field>
            <Field label="VAPID Private Key">
              <input type="password" value={data.pushVapidPrivateKey ?? ""} onChange={(e) => onChange("pushVapidPrivateKey", e.target.value)}
                placeholder="••••••••" autoComplete="new-password" className={`${inputCls} font-mono text-xs`} />
            </Field>
          </div>
        )}
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function CurrenciesSection({ data, onChange, onSave, saving }) {
  const ALL_CURRENCIES = ["USD","EUR","GBP","INR","AUD","CAD","SGD","JPY","CHF","MXN","BRL","ZAR","AED","SAR","NGN","KES"];
  const supported = Array.isArray(data.supported) ? data.supported : [];

  const toggle = (c) => {
    const next = supported.includes(c) ? supported.filter((x) => x !== c) : [...supported, c];
    onChange("supported", next);
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={DollarSign} title="Currencies" description="Default currency and supported currencies." />
      <Field label="Default Currency">
        <select value={data.default ?? "USD"} onChange={(e) => onChange("default", e.target.value)}
          className={`cursor-pointer ${inputCls}`}>
          {ALL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <div>
        <p className={labelCls}>Supported Currencies</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_CURRENCIES.map((c) => {
            const active = supported.includes(c);
            return (
              <button key={c} type="button" onClick={() => toggle(c)}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-700 bg-zinc-900/40 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                }`}>
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

/* ── Tab definitions ── */
const TABS = [
  { id: "app",           label: "App",           Icon: Settings    },
  { id: "email",         label: "Email",         Icon: Key         },
  { id: "language",      label: "Language",      Icon: Globe       },
  { id: "payment",       label: "Payment",       Icon: CreditCard  },
  { id: "theme",         label: "Theme",         Icon: Palette     },
  { id: "notifications", label: "Notifications", Icon: Bell        },
  { id: "currencies",    label: "Currencies",    Icon: DollarSign  },
];

/* ── Main page ── */
export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("app");
  const [settings, setSettings]   = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const { showToast, ToastUI }    = useToast();
  const panelRef                  = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/super-admin/settings");
        const data = await res.json();
        if (data.success) setSettings(data.settings);
        else showToast(data.error ?? "Failed to load.", "error");
      } catch { showToast("Network error.", "error"); }
      finally { setFetching(false); }
    })();
  }, [showToast]);

  const handleChange = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value },
    }));
  }, [activeTab]);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, data: settings[activeTab] }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to save.", "error"); return; }
      showToast("Settings saved.");
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(false); }
  }, [activeTab, settings, showToast]);

  const switchTab = (id) => {
    setActiveTab(id);
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionData = settings?.[activeTab] ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">
          <Settings className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Centralized platform configuration.</p>
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
                <Icon className={`size-4 shrink-0 ${active ? "text-emerald-400" : ""}`} />
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
          ) : !settings ? null : (
            <>
              {activeTab === "app"           && <AppSection           data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "email"         && <EmailSection         data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "language"      && <LanguageSection      data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "payment"       && <PaymentSection       data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "theme"         && <ThemeSection         data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "notifications" && <NotificationsSection data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "currencies"    && <CurrenciesSection    data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
            </>
          )}
        </div>
      </div>

      {ToastUI}
    </div>
  );
}
