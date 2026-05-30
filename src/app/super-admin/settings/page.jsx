"use client";

import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import PushNotificationEnable from "@/components/PushNotificationEnable";
import { useToast } from "@/hooks/useToast";
import { invalidatePlatformConfigCache, updateSuperAdminThemeCache } from "@/hooks/usePlatformConfig";
import { decimalInputProps, intInputProps, phoneInputProps } from "@/lib/formInputTypes";
import { validatePlatformSettingsSection } from "@/lib/platformSettingsValidation";
import {
  Bell, CheckCircle2, Copy, CreditCard, Database, DollarSign, Globe,
  Key, Loader2, Lock, Palette, Save, Settings, Settings2, Shield, Smartphone,
  ToggleLeft, Webhook, XCircle, Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { saBtnPrimaryCls, saInputCls, saSpinnerCls, SUPER_ADMIN_ACCENT, SUPER_ADMIN_PRIMARY } from "@/config/superAdminTheme";
import {
  clearSuperAdminThemePreview,
  dispatchSuperAdminThemePreview,
} from "@/lib/superAdminThemeRuntime";

/* ── Shared styles ── */
const inputCls = saInputCls;
const labelCls = "block text-xs font-medium text-zinc-400 mb-1";

function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
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
        className={`cursor-pointer relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-sa-primary" : "bg-zinc-700"}`}>
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
        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-sa-primary px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 transition-colors">
        {saving ? <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> : <Save className="size-4" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ── Section panels ── */
function AppSection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Settings} title="App Settings" description="Platform identity and contact information." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Platform Name" required error={fieldErrors.name}>
            <input
              value={data.name ?? ""}
              onChange={(e) => {
                onChange("name", e.target.value);
                onClearError?.("name");
              }}
              placeholder="RMS Platform"
              maxLength={80}
              aria-invalid={fieldErrors.name ? true : undefined}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Legal / Registered Business Name"
            hint="Printed on receipts and invoices (optional)."
            error={fieldErrors.legalName}
          >
            <input
              value={data.legalName ?? ""}
              onChange={(e) => {
                onChange("legalName", e.target.value);
                onClearError?.("legalName");
              }}
              placeholder="ABC Restaurant Tech Pvt Ltd"
              maxLength={120}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Logo URL" error={fieldErrors.logoUrl}>
          <input
            value={data.logoUrl ?? ""}
            onChange={(e) => {
              onChange("logoUrl", e.target.value);
              onClearError?.("logoUrl");
            }}
            placeholder="https://cdn.example.com/logo.png"
            className={inputCls}
          />
        </Field>
        <Field label="Favicon URL" error={fieldErrors.faviconUrl}>
          <input
            value={data.faviconUrl ?? ""}
            onChange={(e) => {
              onChange("faviconUrl", e.target.value);
              onClearError?.("faviconUrl");
            }}
            placeholder="https://cdn.example.com/favicon.ico"
            className={inputCls}
          />
        </Field>
        <Field label="Support Email" required error={fieldErrors.supportEmail}>
          <input
            type="email"
            value={data.supportEmail ?? ""}
            onChange={(e) => {
              onChange("supportEmail", e.target.value);
              onClearError?.("supportEmail");
            }}
            placeholder="support@rms.com"
            aria-invalid={fieldErrors.supportEmail ? true : undefined}
            className={inputCls}
          />
        </Field>
        <Field label="Contact Phone" error={fieldErrors.contactPhone} hint="10-digit Indian mobile (optional).">
          <input
            {...phoneInputProps()}
            value={data.contactPhone ?? ""}
            onChange={(e) => {
              onChange("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10));
              onClearError?.("contactPhone");
            }}
            placeholder="9876543210"
            maxLength={10}
            aria-invalid={fieldErrors.contactPhone ? true : undefined}
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Business Address" error={fieldErrors.address}>
            <input
              value={data.address ?? ""}
              onChange={(e) => {
                onChange("address", e.target.value);
                onClearError?.("address");
              }}
              placeholder="123 Main St, City, Country"
              maxLength={200}
              className={inputCls}
            />
          </Field>
        </div>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function EmailSection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  const [testing, setTesting] = useState(false);
  const { showToast } = useToast();

  async function sendTestEmail() {
    if (!data.smtpHost || !data.smtpUser) {
      showToast("Fill in SMTP Host and Username first.", "error");
      return;
    }
    setTesting(true);
    try {
      const res  = await fetch("/api/super-admin/settings/test-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ smtp: data }),
      });
      const json = await res.json();
      if (json.success) showToast("Test email sent successfully.");
      else showToast(json.error ?? "Failed to send test email.", "error");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={Key} title="Email / SMTP" description="Outbound email configuration." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SMTP Host" error={fieldErrors.smtpHost}>
          <input
            value={data.smtpHost ?? ""}
            onChange={(e) => {
              onChange("smtpHost", e.target.value);
              onClearError?.("smtpHost");
            }}
            placeholder="smtp.gmail.com"
            className={inputCls}
          />
        </Field>
        <Field label="SMTP Port" error={fieldErrors.smtpPort}>
          <input
            {...intInputProps({ min: 1, max: 65535, step: 1 })}
            value={data.smtpPort ?? 587}
            onChange={(e) => {
              onChange("smtpPort", e.target.value === "" ? "" : Number(e.target.value));
              onClearError?.("smtpPort");
            }}
            className={inputCls}
          />
        </Field>
        <Field label="SMTP Username" error={fieldErrors.smtpUser}>
          <input
            value={data.smtpUser ?? ""}
            onChange={(e) => {
              onChange("smtpUser", e.target.value);
              onClearError?.("smtpUser");
            }}
            placeholder="user@gmail.com"
            className={inputCls}
          />
        </Field>
        <Field label="SMTP Password">
          <input type="password" value={data.smtpPassword ?? ""} onChange={(e) => onChange("smtpPassword", e.target.value)}
            placeholder="••••••••" autoComplete="new-password" className={inputCls} />
        </Field>
        <Field label="From Name" error={fieldErrors.fromName}>
          <input
            value={data.fromName ?? ""}
            onChange={(e) => {
              onChange("fromName", e.target.value);
              onClearError?.("fromName");
            }}
            placeholder="RMS Platform"
            maxLength={80}
            className={inputCls}
          />
        </Field>
        <Field label="From Email" error={fieldErrors.fromEmail}>
          <input
            type="email"
            value={data.fromEmail ?? ""}
            onChange={(e) => {
              onChange("fromEmail", e.target.value);
              onClearError?.("fromEmail");
            }}
            placeholder="noreply@rms.com"
            className={inputCls}
          />
        </Field>
      </div>
      <Toggle checked={!!data.secure} onChange={(v) => onChange("secure", v)}
        label="Use SSL/TLS" description="Enable for port 465. Use STARTTLS for port 587." />

      {/* Test email */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">Send Test Email</p>
          <p className="mt-0.5 text-xs text-zinc-500">Verify your SMTP config by sending a test message.</p>
        </div>
        <button
          type="button"
          onClick={sendTestEmail}
          disabled={testing}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-400 disabled:opacity-50 transition-colors"
        >
          {testing
            ? <span className="size-3 animate-spin rounded-full border-2 border-zinc-500/30 border-t-zinc-400" />
            : <Key className="size-3.5" />}
          {testing ? "Sending…" : "Send Test"}
        </button>
      </div>

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

/* ════════════════════════════════════════
   PAYMENT SECTION — Multi-gateway + Restaurant Settings
════════════════════════════════════════ */

const PLATFORM_GATEWAYS = [
  { id: "razorpay", label: "Razorpay",  logo: "/logos/razorpay.svg",  desc: "India — UPI, Cards, Net Banking", popular: true,  fields: ["apiKey","secretKey","webhookSecret"] },
  { id: "stripe",   label: "Stripe",    logo: "/logos/stripe.svg",    desc: "International payments",          popular: false, fields: ["publicKey","secretKey","webhookSecret"] },
  { id: "cashfree", label: "Cashfree",  logo: "/logos/cashfree.svg",  desc: "India — Fast settlements",        popular: false, fields: ["apiKey","secretKey","webhookSecret"] },
  { id: "paypal",   label: "PayPal",    logo: "/logos/paypal.svg",    desc: "Global — 200+ countries",         popular: false, fields: ["clientId","secretKey","webhookSecret"] },
  { id: "paytm",    label: "Paytm",     logo: "/logos/paytm.svg",     desc: "India — Wallet & UPI",            popular: false, fields: ["merchantId","apiKey","webhookSecret"] },
  { id: "phonepe",  label: "PhonePe",   logo: "/logos/phonepe.svg",   desc: "India — UPI payments",            popular: false, fields: ["merchantId","apiKey","webhookSecret"] },
  { id: "payu",     label: "PayU",      logo: "/logos/payu.svg",      desc: "India — All payment modes",       popular: false, fields: ["apiKey","secretKey","webhookSecret"] },
  { id: "ccavenue", label: "CCAvenue",  logo: "/logos/ccavenue.svg",  desc: "India — Enterprise gateway",      popular: false, fields: ["merchantId","apiKey","webhookSecret"] },
  { id: "offline",  label: "Offline",   logo: null,                   desc: "Bank Transfer / Manual / UPI",    popular: false, fields: ["instructions","upiId","bankDetails"], icon: "🏦" },
];

const FIELD_LABELS = {
  apiKey:        "API Key",
  publicKey:     "Publishable Key",
  secretKey:     "Secret Key",
  merchantId:    "Merchant ID",
  clientId:      "Client ID",
  webhookSecret: "Webhook Secret",
  instructions:  "Payment Instructions",
  upiId:         "UPI ID",
  bankDetails:   "Bank Details",
};

const FIELD_PLACEHOLDERS = {
  razorpay: { apiKey: "rzp_live_XXXXXXXXXX", secretKey: "••••••••", webhookSecret: "••••••••" },
  stripe:   { publicKey: "pk_live_XXXXXXXXXX", secretKey: "sk_live_••••••••", webhookSecret: "whsec_••••••••" },
  cashfree: { apiKey: "CF_APP_ID", secretKey: "••••••••", webhookSecret: "••••••••" },
  paypal:   { clientId: "AXxx…", secretKey: "••••••••", webhookSecret: "••••••••" },
  paytm:    { merchantId: "MID_XXXX", apiKey: "••••••••", webhookSecret: "••••••••" },
  phonepe:  { merchantId: "PGTESTPAYUAT", apiKey: "••••••••", webhookSecret: "••••••••" },
  payu:     { apiKey: "PAYU_KEY", secretKey: "••••••••", webhookSecret: "••••••••" },
  ccavenue: { merchantId: "MID_XXXX", apiKey: "••••••••", webhookSecret: "••••••••" },
  offline:  { instructions: "Transfer to account and share screenshot", upiId: "yourname@upi", bankDetails: "Acc: 1234… IFSC: HDFC…" },
};

function GatewayLogo({ gateway }) {
  const [imgError, setImgError] = useState(false);

  if (!gateway.logo || imgError) {
    if (gateway.icon) {
      return (
        <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-xl">
          {gateway.icon}
        </div>
      );
    }
    return <Settings2 className="size-6 text-zinc-500" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={gateway.logo}
      alt={gateway.label}
      width={64}
      height={32}
      className="max-h-8 w-auto object-contain"
      onError={() => setImgError(true)}
    />
  );
}

function PaymentSection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  const [activeGw, setActiveGw] = useState("razorpay");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { showToast } = useToast();

  // Gateway data stored under data.gateways[gwId]
  const gateways = data.gateways ?? {};

  const gw = gateways[activeGw] ?? { enabled: false, testMode: true };
  const gwInfo = PLATFORM_GATEWAYS.find((g) => g.id === activeGw);
  const isOffline = activeGw === "offline";

  function updateGw(patch) {
    onChange("gateways", { ...gateways, [activeGw]: { ...gw, ...patch } });
    setTestResult(null);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/super-admin/settings/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: activeGw, credentials: gw }),
      });
      const json = await res.json();
      setTestResult({ success: json.success, message: json.message ?? json.error ?? "Unknown." });
    } catch {
      setTestResult({ success: false, message: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  function copyWebhookUrl(gwId) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const urls = {
      razorpay: `${origin}/api/webhooks/razorpay`,
      stripe:   `${origin}/api/webhooks/stripe`,
    };
    const url = urls[gwId] ?? `${origin}/api/webhooks/${gwId}`;
    navigator.clipboard.writeText(url).then(() => showToast("Webhook URL copied!"));
  }

  const enabledCount = PLATFORM_GATEWAYS.filter((g) => gateways[g.id]?.enabled).length;

  return (
    <div className="space-y-5">
      <SectionHeader icon={CreditCard} title="Payment Settings"
        description="Configure payment gateways for subscription billing and restaurant payments." />

      {/* No tab bar needed — single tab, just show content directly */}

      {/* Payment Settings content */}
      <div className="space-y-4">
          {/* Status bar */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
            <CheckCircle2 className="size-4 text-sa-accent" />
            <span className="text-xs text-zinc-400">
              {enabledCount > 0
                ? <><span className="font-semibold text-sa-accent">{enabledCount} gateway{enabledCount > 1 ? "s" : ""} active</span> — {PLATFORM_GATEWAYS.filter((g) => gateways[g.id]?.enabled).map((g) => g.label).join(", ")}</>
                : <span className="text-zinc-500">No gateways configured yet</span>}
            </span>
          </div>

          {/* Gateway selector */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PLATFORM_GATEWAYS.map((g) => {
              const isEnabled = Boolean(gateways[g.id]?.enabled);
              const isActive = activeGw === g.id;
              return (
                <button key={g.id} type="button"
                  onClick={() => { setActiveGw(g.id); setTestResult(null); }}
                  className={`cursor-pointer relative rounded-xl border p-3 text-center transition-all ${
                    isActive
                      ? "border-sa-primary-50 bg-sa-primary-10 ring-1 ring-sa-primary-25"
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                  }`}>
                  {isEnabled && (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-sa-primary" />
                  )}
                  <div className="flex h-8 items-center justify-center mb-1.5">
                    <GatewayLogo gateway={g} />
                  </div>
                  <p className={`text-xs font-semibold ${isActive ? "text-sa-primary" : "text-zinc-300"}`}>
                    {g.label}
                  </p>
                  {g.popular && (
                    <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Gateway config form */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-100">{gwInfo?.label}</p>
                <p className="text-xs text-zinc-500">{gwInfo?.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                {!isOffline && gw.enabled && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    gw.testMode ? "bg-amber-500/15 text-amber-400" : "bg-sa-accent-15 text-sa-accent"
                  }`}>
                    {gw.testMode ? "Test Mode" : "Live Mode"}
                  </span>
                )}
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="text-sm text-zinc-400">Enable</span>
                  <button type="button" role="switch" aria-checked={Boolean(gw.enabled)}
                    onClick={() => updateGw({ enabled: !gw.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gw.enabled ? "bg-sa-primary" : "bg-zinc-700"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${gw.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </label>
              </div>
            </div>

            {!gw.enabled ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Lock className="size-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">Enable {gwInfo?.label} to configure credentials</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Test/Live toggle */}
                {!isOffline && (
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Environment</p>
                      <p className="text-xs text-zinc-500">{gw.testMode ? "Test mode — no real charges" : "Live mode — real payments"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${gw.testMode ? "text-amber-400" : "text-zinc-500"}`}>TEST</span>
                      <button type="button" role="switch" aria-checked={!gw.testMode}
                        onClick={() => updateGw({ testMode: !gw.testMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!gw.testMode ? "bg-sa-primary" : "bg-amber-500"}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${!gw.testMode ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                      <span className={`text-xs font-semibold ${!gw.testMode ? "text-sa-accent" : "text-zinc-500"}`}>LIVE</span>
                    </div>
                  </div>
                )}

                {/* Credential fields */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(gwInfo?.fields ?? []).map((fieldKey) => {
                    const isSecret = ["secretKey","webhookSecret"].includes(fieldKey);
                    return (
                      <Field key={fieldKey} label={FIELD_LABELS[fieldKey] ?? fieldKey}
                        hint={fieldKey === "webhookSecret" ? "From gateway dashboard → Webhooks" : ""}>
                        <input
                          type={isSecret ? "password" : "text"}
                          value={gw[fieldKey] ?? ""}
                          onChange={(e) => updateGw({ [fieldKey]: e.target.value })}
                          placeholder={FIELD_PLACEHOLDERS[activeGw]?.[fieldKey] ?? ""}
                          autoComplete="new-password"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </Field>
                    );
                  })}
                </div>

                {/* Webhook URL */}
                {!isOffline && ["razorpay","stripe"].includes(activeGw) && (
                  <div>
                    <label className={labelCls}>Webhook URL <span className="text-zinc-600">(copy to gateway dashboard)</span></label>
                    <div className="flex gap-2">
                      <input readOnly
                        value={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/${activeGw}` : `/api/webhooks/${activeGw}`}
                        className={`${inputCls} font-mono text-xs text-zinc-500`} />
                      <button type="button" onClick={() => copyWebhookUrl(activeGw)}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover-border-sa-primary-40 hover-sa-primary transition-colors">
                        <Copy className="size-3.5" /> Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Test result */}
                {testResult && (
                  <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    testResult.success
                      ? "border-sa-primary-25 bg-sa-primary-10 text-sa-primary"
                      : "border-red-500/25 bg-red-500/10 text-red-400"
                  }`}>
                    {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
                    {testResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={testConnection}
              disabled={testing || !gw.enabled || isOffline}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
              {testing ? <Loader2 className={saSpinnerCls} /> : <Zap className="size-4" />}
              {testing ? "Testing…" : "Test Connection"}
            </button>
            <SaveButton saving={saving} onClick={onSave} />
          </div>

          {/* GST / Billing settings */}
          <div className="border-t border-zinc-800 pt-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Billing & Tax Settings</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default Currency">
                <select value={data.currency ?? "INR"} onChange={(e) => onChange("currency", e.target.value)}
                  className={`cursor-pointer ${inputCls}`}>
                  {["INR","USD","EUR","GBP","AUD","CAD","SGD","JPY"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Tax Rate (%)" hint="Applied to invoices and receipts." error={fieldErrors.taxPercent}>
                <input
                  {...decimalInputProps({ min: 0, max: 100, step: "0.01" })}
                  value={data.taxPercent ?? 0}
                  onChange={(e) => {
                    onChange("taxPercent", e.target.value === "" ? "" : Number(e.target.value));
                    onClearError?.("taxPercent");
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="GSTIN / Tax ID" hint="Printed on subscription PDF receipts.">
                <input value={data.gstNumber ?? ""} onChange={(e) => onChange("gstNumber", e.target.value)}
                  placeholder="22AAAAA0000A1Z5" className={inputCls} />
              </Field>
              <Field label="HSN / SAC Code">
                <input value={data.gstHsnSac ?? ""} onChange={(e) => onChange("gstHsnSac", e.target.value)}
                  placeholder="998314" className={inputCls} />
              </Field>
              <Field label="GST Supply Type">
                <select value={data.gstSupplyType === "inter_state" ? "inter_state" : "intra_state"}
                  onChange={(e) => onChange("gstSupplyType", e.target.value)}
                  className={`cursor-pointer ${inputCls}`}>
                  <option value="intra_state">Intra-state (CGST + SGST)</option>
                  <option value="inter_state">Inter-state (IGST)</option>
                </select>
              </Field>
              <Field label="Trial Period (days)" hint="0 = no trial." error={fieldErrors.trialDays}>
                <input
                  {...intInputProps({ min: 0, max: 90, step: 1 })}
                  value={data.trialDays ?? 14}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "");
                    onChange("trialDays", v === "" ? "" : Number(v));
                    onClearError?.("trialDays");
                  }}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </div>
    </div>
  );
}

function ThemeSection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  const primary = data.primaryColor ?? SUPER_ADMIN_PRIMARY;
  const accent = data.accentColor ?? SUPER_ADMIN_ACCENT;

  useEffect(() => {
    dispatchSuperAdminThemePreview({
      primaryColor: primary,
      accentColor: accent,
      darkMode: data.darkMode,
    });
  }, [primary, accent, data.darkMode]);

  useEffect(() => () => clearSuperAdminThemePreview(), []);

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Palette}
        title="Theme"
        description="Primary Color drives the Super Admin panel — sidebar, buttons, loaders. Accent is for success states (paid, active, online)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary Color (Super Admin brand)" error={fieldErrors.primaryColor}>
          <div className="flex items-center gap-3">
            <input type="color" value={primary} onChange={(e) => onChange("primaryColor", e.target.value)}
              className="cursor-pointer size-10 shrink-0 rounded-lg border border-zinc-700 bg-transparent p-0.5" />
            <input
              value={primary}
              onChange={(e) => {
                onChange("primaryColor", e.target.value);
                onClearError?.("primaryColor");
              }}
              placeholder={SUPER_ADMIN_PRIMARY}
              className={`${inputCls} font-mono`}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-600">Default: {SUPER_ADMIN_PRIMARY} — sidebar, buttons, focus rings</p>
        </Field>
        <Field label="Accent Color (success / status)" error={fieldErrors.accentColor}>
          <div className="flex items-center gap-3">
            <input type="color" value={accent} onChange={(e) => onChange("accentColor", e.target.value)}
              className="cursor-pointer size-10 shrink-0 rounded-lg border border-zinc-700 bg-transparent p-0.5" />
            <input
              value={accent}
              onChange={(e) => {
                onChange("accentColor", e.target.value);
                onClearError?.("accentColor");
              }}
              placeholder={SUPER_ADMIN_ACCENT}
              className={`${inputCls} font-mono`}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-600">Default: {SUPER_ADMIN_ACCENT} — paid, active tenant, online</p>
        </Field>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Live preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="sa-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
            Primary button
          </button>
          <span className="sa-status-badge rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Active / Paid
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-sa-primary-40 bg-sa-primary-10 px-3 py-1.5 text-xs text-sa-primary ring-1 ring-sa-primary-25">
            Nav active
          </span>
        </div>
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
            <div className="sm:col-span-2">
              <PushNotificationEnable vapidPublicKey={data.pushVapidPublicKey} />
            </div>
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
                    ? "border-sa-primary-40 bg-sa-primary-15 text-sa-primary-muted"
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

/* ════════════════════════════════════════
   SMS SETTINGS
════════════════════════════════════════ */
function SmsSection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Smartphone} title="SMS Settings" description="Configure SMS provider for OTPs and alerts." />
      <Toggle
        checked={!!data.enabled}
        onChange={(v) => onChange("enabled", v)}
        label="Enable SMS"
        description="Send SMS notifications and OTPs to users."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="SMS Provider">
            <select
              value={data.provider ?? "twilio"}
              onChange={(e) => onChange("provider", e.target.value)}
              className={`cursor-pointer ${inputCls}`}
            >
              <option value="twilio">Twilio</option>
              <option value="fast2sms">Fast2SMS</option>
              <option value="msg91">MSG91</option>
              <option value="vonage">Vonage</option>
            </select>
          </Field>
        </div>
        <Field label="API Key / Account SID" hint="Twilio: Account SID. Fast2SMS: API key." error={fieldErrors.apiKey}>
          <input
            value={data.apiKey ?? ""}
            onChange={(e) => {
              onChange("apiKey", e.target.value);
              onClearError?.("apiKey");
            }}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className={`${inputCls} font-mono text-xs`}
          />
        </Field>
        <Field label="Auth Token / API Secret" hint="Twilio: Auth Token. Fast2SMS: leave blank.">
          <input
            type="password"
            value={data.authToken ?? ""}
            onChange={(e) => onChange("authToken", e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={`${inputCls} font-mono text-xs`}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Sender ID / From Number" hint="Twilio: +1XXXXXXXXXX. Fast2SMS: registered sender ID." error={fieldErrors.senderId}>
            <input
              value={data.senderId ?? ""}
              onChange={(e) => {
                onChange("senderId", e.target.value);
                onClearError?.("senderId");
              }}
              placeholder="+15550001234"
              className={inputCls}
            />
          </Field>
        </div>
      </div>
      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

/* ════════════════════════════════════════
   SECURITY SETTINGS
════════════════════════════════════════ */
function SecuritySection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Shield} title="Security" description="Password policy, login limits, and 2FA." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum Password Length" error={fieldErrors.minPasswordLength}>
          <input
            {...intInputProps({ min: 6, max: 32, step: 1 })}
            value={data.minPasswordLength ?? 8}
            onChange={(e) => {
              onChange("minPasswordLength", e.target.value === "" ? "" : Number(e.target.value));
              onClearError?.("minPasswordLength");
            }}
            className={inputCls}
          />
        </Field>
        <Field label="Login Attempt Limit" hint="Consecutive failures before block." error={fieldErrors.loginAttemptLimit}>
          <input
            {...intInputProps({ min: 1, max: 20, step: 1 })}
            value={data.loginAttemptLimit ?? 5}
            onChange={(e) => {
              onChange("loginAttemptLimit", e.target.value === "" ? "" : Number(e.target.value));
              onClearError?.("loginAttemptLimit");
            }}
            className={inputCls}
          />
        </Field>
        <Field label="Block Duration (minutes)" hint="How long to block after limit reached." error={fieldErrors.blockDurationMinutes}>
          <input
            {...intInputProps({ min: 1, max: 1440, step: 1 })}
            value={data.blockDurationMinutes ?? 30}
            onChange={(e) => {
              onChange("blockDurationMinutes", e.target.value === "" ? "" : Number(e.target.value));
              onClearError?.("blockDurationMinutes");
            }}
            className={inputCls}
          />
        </Field>
        <Field label="Session Timeout (minutes)" hint="Idle session expiry. 0 = never." error={fieldErrors.sessionTimeoutMinutes}>
          <input
            {...intInputProps({ min: 0, max: 10080, step: 1 })}
            value={data.sessionTimeoutMinutes ?? 60}
            onChange={(e) => {
              onChange("sessionTimeoutMinutes", e.target.value === "" ? "" : Number(e.target.value));
              onClearError?.("sessionTimeoutMinutes");
            }}
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="IP Whitelist" hint="Comma-separated IPs. Leave blank to allow all.">
            <input
              value={data.ipWhitelist ?? ""}
              onChange={(e) => onChange("ipWhitelist", e.target.value)}
              placeholder="192.168.1.1, 10.0.0.0/24"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Password Policy</p>
        <Toggle
          checked={!!data.requireSpecialChars}
          onChange={(v) => onChange("requireSpecialChars", v)}
          label="Require Special Characters"
          description="Password must contain at least one special character."
        />
        <Toggle
          checked={!!data.requireNumbers}
          onChange={(v) => onChange("requireNumbers", v)}
          label="Require Numbers"
          description="Password must contain at least one number."
        />
      </div>

      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Two-Factor Authentication</p>
        <Toggle
          checked={!!data.enable2FA}
          onChange={(v) => onChange("enable2FA", v)}
          label="Enable 2FA for Super Admin"
          description="Require TOTP verification on every super admin login."
        />
      </div>

      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

/* ════════════════════════════════════════
   BACKUP & RESTORE
════════════════════════════════════════ */
function BackupSection({ data, onChange, onSave, saving, showToast }) {
  const [backups, setBackups]         = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [triggering, setTriggering]   = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/settings/backup")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBackups(d.backups); })
      .catch(() => {})
      .finally(() => setLoadingBackups(false));
  }, []);

  async function triggerBackup() {
    setTriggering(true);
    try {
      const res  = await fetch("/api/super-admin/settings/backup", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setBackups(json.backups ?? []);
        showToast("Backup completed successfully.");
      } else {
        showToast(json.error ?? "Backup failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={Database} title="Backup & Restore" description="Manual and scheduled database backups." />

      {/* Manual backup */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">Manual Backup</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {data.lastBackupAt
              ? `Last backup: ${new Date(data.lastBackupAt).toLocaleString()}`
              : "No backup taken yet."}
          </p>
        </div>
        <button
          type="button"
          onClick={triggerBackup}
          disabled={triggering}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {triggering
            ? <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <Database className="size-3.5" />}
          {triggering ? "Running…" : "Run Backup"}
        </button>
      </div>

      {/* Auto backup settings */}
      <div className="space-y-3">
        <Toggle
          checked={!!data.autoBackup}
          onChange={(v) => onChange("autoBackup", v)}
          label="Auto Backup"
          description="Automatically back up the database on a schedule."
        />
        {data.autoBackup && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Backup Schedule">
              <select
                value={data.backupSchedule ?? "daily"}
                onChange={(e) => onChange("backupSchedule", e.target.value)}
                className={`cursor-pointer ${inputCls}`}
              >
                <option value="daily">Daily (midnight)</option>
                <option value="weekly">Weekly (Sunday midnight)</option>
              </select>
            </Field>
            <Field label="Retention (days)" hint="Backups older than this are deleted.">
              <input
                type="number" min={1} max={365}
                value={data.retentionDays ?? 30}
                onChange={(e) => onChange("retentionDays", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </div>

      {/* Backup history */}
      <div className="border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent Backups</p>
        {loadingBackups ? (
          <SuperAdminPageSkeleton rows={3} rowClassName="h-10" />
        ) : backups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-600">
            No backups yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {backups.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className={`size-2 rounded-full ${b.status === "completed" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div>
                    <p className="text-xs font-medium text-zinc-200">
                      {b.type === "manual" ? "Manual" : "Auto"} backup
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400 capitalize">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

/* ════════════════════════════════════════
   INTEGRATIONS
════════════════════════════════════════ */
function IntegrationsSection({ data, onChange, onSave, saving, fieldErrors = {}, onClearError }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Webhook} title="Integrations" description="Analytics, pixels, webhooks, and payment gateways." />

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Analytics & Tracking</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Google Analytics ID" hint="e.g. G-XXXXXXXXXX or UA-XXXXXXXX-X">
            <input
              value={data.googleAnalyticsId ?? ""}
              onChange={(e) => onChange("googleAnalyticsId", e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className={`${inputCls} font-mono text-xs`}
            />
          </Field>
          <Field label="Meta Pixel ID" hint="From Facebook Events Manager.">
            <input
              value={data.metaPixelId ?? ""}
              onChange={(e) => onChange("metaPixelId", e.target.value)}
              placeholder="1234567890123456"
              className={`${inputCls} font-mono text-xs`}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-800 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Webhook</p>
        <Field label="Webhook URL" hint="POST events will be sent here." error={fieldErrors.webhookUrl}>
          <input
            value={data.webhookUrl ?? ""}
            onChange={(e) => {
              onChange("webhookUrl", e.target.value);
              onClearError?.("webhookUrl");
            }}
            placeholder="https://your-server.com/webhook"
            className={inputCls}
          />
        </Field>
        <Field label="Webhook Secret" hint="Used to verify incoming webhook signatures.">
          <input
            type="password"
            value={data.webhookSecret ?? ""}
            onChange={(e) => onChange("webhookSecret", e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={`${inputCls} font-mono text-xs`}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-sm font-medium text-zinc-200">💡 Razorpay & Stripe</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Razorpay and Stripe keys are now managed in the <strong className="text-zinc-300">Payment Settings</strong> tab above.
        </p>
      </div>

      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

/* ════════════════════════════════════════
   ADVANCED SETTINGS
════════════════════════════════════════ */
function AdvancedSection({ data, onChange, onSave, saving, showToast }) {
  const [clearing, setClearing] = useState(false);

  async function clearCache() {
    setClearing(true);
    try {
      const res  = await fetch("/api/super-admin/settings/cache", { method: "POST" });
      const json = await res.json();
      if (json.success) showToast("Cache cleared successfully.");
      else showToast(json.error ?? "Failed to clear cache.", "error");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setClearing(false);
    }
  }

  const features = [
    { key: "featureMenuQR",       label: "QR Menu",          desc: "Allow restaurants to generate QR codes for their menu." },
    { key: "featureOnlineOrder",  label: "Online Ordering",  desc: "Enable customer-facing online ordering flow."           },
    { key: "featureReservations", label: "Reservations",     desc: "Table reservation module for restaurants."              },
    { key: "featureInventory",    label: "Inventory Module", desc: "Stock tracking and low-stock alerts."                   },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader icon={ToggleLeft} title="Advanced" description="Maintenance mode, cache, billing, and feature flags." />

      {/* Billing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice Prefix" hint="Prepended to all invoice numbers.">
          <input
            value={data.invoicePrefix ?? "INV-"}
            onChange={(e) => onChange("invoicePrefix", e.target.value)}
            placeholder="INV-"
            className={`${inputCls} font-mono`}
          />
        </Field>
      </div>

      <Toggle
        checked={!!data.autoBilling}
        onChange={(v) => onChange("autoBilling", v)}
        label="Auto Billing"
        description="Automatically charge subscriptions on renewal date."
      />

      {/* System */}
      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">System</p>
        <Toggle
          checked={!!data.maintenanceMode}
          onChange={(v) => onChange("maintenanceMode", v)}
          label="Maintenance Mode"
          description="Show a maintenance page to all non-super-admin users."
        />
        <Toggle
          checked={!!data.debugMode}
          onChange={(v) => onChange("debugMode", v)}
          label="Debug Mode"
          description="Log verbose errors to console. Disable in production."
        />
      </div>

      {/* Cache */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">Clear Cache</p>
          <p className="mt-0.5 text-xs text-zinc-500">Revalidate landing and key super-admin pages cache.</p>
        </div>
        <button
          type="button"
          onClick={clearCache}
          disabled={clearing}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          {clearing
            ? <span className="size-3 animate-spin rounded-full border-2 border-zinc-500/30 border-t-zinc-400" />
            : null}
          {clearing ? "Clearing…" : "Clear Cache"}
        </button>
      </div>

      {/* Feature flags */}
      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Feature Flags</p>
        {features.map(({ key, label, desc }) => (
          <Toggle
            key={key}
            checked={!!data[key]}
            onChange={(v) => onChange(key, v)}
            label={label}
            description={desc}
          />
        ))}
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
  { id: "sms",           label: "SMS",           Icon: Smartphone  },
  { id: "security",      label: "Security",      Icon: Shield      },
  { id: "backup",        label: "Backup",        Icon: Database    },
  { id: "integrations",  label: "Integrations",  Icon: Webhook     },
  { id: "advanced",      label: "Advanced",      Icon: ToggleLeft  },
];

/* ── Main page ── */
const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("app");
  const [settings, setSettings]   = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving]       = useState(false);
  const [sectionErrors, setSectionErrors] = useState({});
  const { showToast, ToastUI }    = useToast();
  const panelRef                  = useRef(null);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && VALID_TAB_IDS.has(tab)) setActiveTab(tab);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadError("");
      try {
        const res  = await fetch("/api/super-admin/settings");
        const data = await res.json();
        if (data.success) setSettings(data.settings);
        else {
          const message = data.error ?? "Failed to load.";
          setLoadError(message);
          showToast(message, "error");
        }
      } catch {
        const message = "Network error.";
        setLoadError(message);
        showToast(message, "error");
      }
      finally { setFetching(false); }
    })();
  }, [showToast]);

  const handleChange = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value },
    }));
  }, [activeTab]);

  const clearSectionError = useCallback((key) => {
    setSectionErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    const payload = settings[activeTab];
    const validation = validatePlatformSettingsSection(activeTab, payload);
    if (!validation.valid) {
      setSectionErrors(validation.errors);
      showToast(validation.message ?? "Please fix the highlighted fields.", "error");
      return;
    }
    setSectionErrors({});
    setSaving(true);
    try {
      const res  = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, data: payload }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to save.", "error"); return; }
      if (activeTab === "theme") {
        updateSuperAdminThemeCache(payload);
      } else {
        invalidatePlatformConfigCache();
      }
      showToast("Settings saved.");
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(false); }
  }, [activeTab, settings, showToast]);

  const switchTab = (id) => {
    setActiveTab(id);
    setSectionErrors({});
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionData = settings?.[activeTab] ?? {};
  const panelValidationProps = {
    fieldErrors: sectionErrors,
    onClearError: clearSectionError,
  };

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

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

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
                <Icon className={`size-4 shrink-0 ${active ? "text-sa-primary" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div ref={panelRef} className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          {fetching ? (
            <SuperAdminPageSkeleton rows={4} />
          ) : !settings ? null : (
            <>
              {activeTab === "app"           && <AppSection           data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "email"         && <EmailSection         data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "language"      && <LanguageSection      data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "payment"       && <PaymentSection       data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "theme"         && <ThemeSection         data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "notifications" && <NotificationsSection data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "currencies"    && <CurrenciesSection    data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "sms"           && <SmsSection           data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "security"      && <SecuritySection      data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "backup"        && <BackupSection        data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} showToast={showToast} />}
              {activeTab === "integrations"  && <IntegrationsSection  data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} {...panelValidationProps} />}
              {activeTab === "advanced"      && <AdvancedSection      data={sectionData} onChange={handleChange} onSave={handleSave} saving={saving} showToast={showToast} />}
            </>
          )}
        </div>
      </div>

      {ToastUI}
    </div>
  );
}