"use client";

import InputField from "@/components/settings/InputField";
import PhoneInput from "@/components/ui/PhoneInput";

import { CheckCircle2, ChevronDown, ChevronUp, Loader2, MessageCircle, RefreshCw, Save, Send, XCircle } from "lucide-react";
import {
  validateWhatsappSettings,
  validateWhatsappTestPhone,
} from "@/lib/restaurantSettingsValidation";
import { useCallback, useEffect, useState } from "react";
import { raIconBadgeCls, raSpinnerCls, raTabActiveCls, raTextareaCls, raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";

const TEMPLATES = [
  { id: "order_confirmed",  event: "Order Confirmed",   emoji: "✅", audience: "Customer" },
  { id: "order_preparing",  event: "Order Preparing",   emoji: "👨‍🍳", audience: "Customer" },
  { id: "out_for_delivery", event: "Out for Delivery",  emoji: "🛵", audience: "Customer" },
  { id: "order_delivered",  event: "Order Delivered",   emoji: "🎉", audience: "Customer" },
  { id: "payment_received", event: "Payment Received",  emoji: "💰", audience: "Customer" },
  { id: "new_order_alert",  event: "New Order Alert",   emoji: "🔔", audience: "Restaurant" },
  { id: "low_stock",        event: "Low Stock Alert",   emoji: "⚠️", audience: "Restaurant" },
];

const VARIABLES = [
  "{customer_name}", "{order_id}", "{restaurant_name}", "{amount}",
  "{eta}", "{order_type}", "{customer_phone}", "{item_name}", "{quantity}", "{unit}",
];

const fieldLabelCls =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500";

const SETUP_STEPS = [
  {
    step: 1,
    title: "Create a Meta Business account",
    detail: "Go to business.facebook.com → create a Business account → add the WhatsApp product.",
  },
  {
    step: 2,
    title: "Set up WhatsApp Cloud API app",
    detail: "Go to developers.facebook.com → Create App → Business → WhatsApp → open the API Setup tab. Add and verify your phone number.",
  },
  {
    step: 3,
    title: "Copy your Phone Number ID",
    detail: "In Meta → WhatsApp → Phone Numbers → select your number → copy the Phone Number ID and paste it below.",
  },
  {
    step: 4,
    title: "Create a permanent System User token",
    detail: "Meta Business Settings → System Users → Generate Token → select whatsapp_business_messaging → copy the token into the API Token field.",
  },
  {
    step: 5,
    title: "Set the restaurant alert phone",
    detail: "Enter the number that should receive new order alerts in Alert Phone below (India: 10-digit mobile). If left blank, Settings → Contact phone is used.",
  },
  {
    step: 6,
    title: "Turn on SMS/WhatsApp alerts in Settings",
    detail: "Settings → Notifications → enable SMS Notifications. Without this, WhatsApp alerts will not send even if credentials are saved.",
  },
  {
    step: 7,
    title: "Enable the New Order Alert template",
    detail: "Below: Message Templates → New Order Alert → keep Enable ON → save the message (variables: {order_id}, {amount}, {order_type}).",
  },
  {
    step: 8,
    title: "Verify with a test message",
    detail: "Use Send Real Test Message at the bottom of this page. In sandbox mode, the recipient must be on Meta’s whitelist.",
  },
];

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border admin-shell-border admin-surface-card px-3 py-3 sm:gap-4 sm:px-4">
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium admin-shell-text">{label}</span>
        {hint && <span className="mt-0.5 block break-words text-xs leading-snug admin-surface-muted">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-ra-primary" : "bg-zinc-700"}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function WhatsAppPageSkeleton() {
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 size-10 shrink-0 animate-pulse rounded-xl admin-surface-card" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-52 max-w-full animate-pulse rounded-lg admin-surface-card" />
            <div className="h-4 w-full max-w-md animate-pulse rounded admin-surface-card" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-24" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-32" />
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-2xl admin-surface-card" />
      <div className="h-48 animate-pulse rounded-2xl admin-surface-card" />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="h-64 animate-pulse rounded-2xl admin-surface-card" />
        <div className="h-80 animate-pulse rounded-2xl admin-surface-card" />
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [loadError, setLoadError]       = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saveResult, setSaveResult]     = useState(null); // { success, message }
  const [testPhone, setTestPhone]       = useState("");
  const [sending, setSending]           = useState(false);
  const [testResult, setTestResult]     = useState(null); // { success, message }
  const [activeTemplate, setActiveTemplate] = useState("order_confirmed");

  // Settings state
  const [enabled, setEnabled]           = useState(false);
  const [token, setToken]               = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [alertPhone, setAlertPhone]     = useState("");
  const [templates, setTemplates]       = useState({});
  const [fieldErrors, setFieldErrors]   = useState({});
  const [testPhoneError, setTestPhoneError] = useState("");
  const [guideOpen, setGuideOpen]       = useState(true);

  const loadSettings = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const res = await fetch("/api/whatsapp-settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setEnabled(data.settings.enabled);
        setToken(data.settings.token ?? "");
        setPhoneNumberId(data.settings.phoneNumberId ?? "");
        setAlertPhone(data.settings.alertPhone ?? "");
        setTemplates(data.settings.templates ?? {});
      } else {
        setLoadError(data.error ?? "Failed to load WhatsApp settings.");
      }
    } catch {
      setLoadError("Could not load WhatsApp settings. Check your connection.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateTemplate(id, patch) {
    setTemplates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveSettings() {
    const validation = validateWhatsappSettings({
      enabled,
      token,
      phoneNumberId,
      alertPhone,
      templates,
    });
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setSaveResult({ success: false, message: validation.message ?? "Fix the highlighted fields." });
      return;
    }
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/whatsapp-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, token, phoneNumberId, alertPhone, templates }),
      });
      const data = await res.json();
      setSaveResult({ success: data.success, message: data.success ? "Settings saved." : (data.error ?? "Failed.") });
      if (data.success) {
        await loadSettings(true);
      }
      setTimeout(() => setSaveResult(null), 3000);
    } catch {
      setSaveResult({ success: false, message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    const validation = validateWhatsappTestPhone(testPhone);
    setTestPhoneError(validation.errors.phone ?? "");
    if (!validation.valid) return;
    setSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message ?? data.error ?? "Unknown." });
    } catch {
      setTestResult({ success: false, message: "Network error." });
    } finally {
      setSending(false);
    }
  }

  const active = TEMPLATES.find((tp) => tp.id === activeTemplate);
  const activeConfig = templates[activeTemplate] ?? { enabled: true, message: "" };

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <WhatsAppPageSkeleton />
      </div>
    );
  }

  return (
    <div className={`min-w-0 w-full max-w-full space-y-6 overflow-x-hidden transition-opacity duration-200 ${refreshing ? "opacity-70" : ""}`}>
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">WhatsApp Automation</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">
              Send real WhatsApp messages via Meta Business API for orders, payments, and alerts.
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <button
            type="button"
            onClick={() => loadSettings(true)}
            disabled={refreshing || saving}
            className={raPageRefreshBtnCls}
          >
            <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
            Refresh
          </button>
          <button type="button" onClick={saveSettings} disabled={saving || refreshing}
            className="cursor-pointer inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-50 sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="flex min-w-0 items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <XCircle className="size-4 shrink-0" />
          <span className="min-w-0 break-words">{loadError}</span>
        </div>
      )}

      {/* Save result */}
      {saveResult && (
        <div className={`flex min-w-0 items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          saveResult.success
            ? "border-ra-primary-25 bg-ra-primary-10 text-ra-primary"
            : "border-red-500/25 bg-red-500/10 text-red-400"
        }`}>
          {saveResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
          <span className="min-w-0 break-words">{saveResult.message}</span>
        </div>
      )}

      {/* Step-by-step setup guide */}
      <section className="rounded-2xl border border-ra-primary-20 bg-ra-primary-5 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          className="cursor-pointer flex w-full min-w-0 items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-semibold text-ra-primary-muted">
              WhatsApp Setup Guide — Step by Step
            </h2>
            <p className="mt-1 break-words text-xs admin-surface-muted">
              WhatsApp alerts to your restaurant phone when a new order arrives — complete setup in 8 steps.
            </p>
          </div>
          {guideOpen
            ? <ChevronUp className="size-5 shrink-0 text-ra-primary mt-0.5" />
            : <ChevronDown className="size-5 shrink-0 text-ra-primary mt-0.5" />}
        </button>

        {guideOpen && (
          <ol className="mt-4 space-y-3">
            {SETUP_STEPS.map(({ step, title, detail }) => (
              <li key={step} className="flex gap-3 rounded-xl border admin-shell-border bg-[var(--admin-surface)] px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ra-primary-15 text-xs font-bold text-ra-primary ring-1 ring-ra-primary-25">
                  {step}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium admin-shell-text">{title}</p>
                  <p className="mt-0.5 break-words text-xs leading-relaxed admin-surface-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-4 text-xs admin-surface-faint">
          Official docs:{" "}
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ra-primary hover:underline"
          >
            Meta WhatsApp Cloud API →
          </a>
        </p>
      </section>

      {/* Enable + Credentials */}
      <section className="admin-surface-card space-y-4 p-4 sm:p-5">
        <Toggle
          label="Enable WhatsApp Automation"
          hint="Send automated messages to customers and staff via Meta WhatsApp Business API"
          checked={enabled}
          onChange={setEnabled}
        />

        {enabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <InputField
                label="API Token (Permanent System User Token)"
                type="password"
                value={token}
                onChange={setToken}
                placeholder="EAAxxxxxxxxxxxxxxxx…"
                error={fieldErrors.token}
              />
              <p className="mt-1 text-xs admin-surface-faint">
                Meta Business → WhatsApp → API Setup → Generate Token
              </p>
            </div>
            <div>
              <InputField
                label="Phone Number ID"
                type="tel"
                value={phoneNumberId}
                onChange={(v) => setPhoneNumberId(v.replace(/\D/g, ""))}
                placeholder="1234567890123"
                error={fieldErrors.phoneNumberId}
              />
              <p className="mt-1 text-xs admin-surface-faint">
                Meta Business → WhatsApp → Phone Numbers → Phone Number ID
              </p>
            </div>
            <div className="sm:col-span-2">
              <PhoneInput
                id="whatsapp-alert-phone"
                label="Alert Phone (Restaurant)"
                labelClassName={fieldLabelCls}
                value={alertPhone}
                onChange={setAlertPhone}
                placeholder="9876543210"
                error={fieldErrors.alertPhone}
                wrapperClassName="admin-shell-border admin-surface-card"
              />
              <p className="mt-1 text-xs admin-surface-faint">
                Leave blank to use phone from Settings → Contact. Used for New Order Alert and Low Stock templates.
              </p>
            </div>
          </div>
        )}

        {enabled && (
          <div className="rounded-xl admin-surface-card p-4 text-xs admin-surface-muted space-y-1">
            <p className="font-semibold text-zinc-400">Quick reference:</p>
            <p>• Token: Meta Business → WhatsApp → API Setup → Generate Token</p>
            <p>• Phone Number ID: Meta Business → WhatsApp → Phone Numbers</p>
            <p>• Order alerts: Settings → Notifications → SMS Notifications ON + New Order Alert template enabled</p>
          </div>
        )}
      </section>

      {enabled && (
        <>
          {/* Templates */}
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            {/* Template list */}
            <section className="admin-surface-card min-w-0 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Message Templates</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {TEMPLATES.map((tp) => {
                  const cfg = templates[tp.id] ?? { enabled: true };
                  const active = activeTemplate === tp.id;
                  return (
                    <button key={tp.id} type="button" onClick={() => setActiveTemplate(tp.id)}
                      className={`box-border min-w-[11rem] shrink-0 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all lg:min-w-0 lg:w-full ${
                        active
                          ? `${raTabActiveCls} border-transparent`
                          : "border-[var(--admin-border-subtle)] text-zinc-400 hover:bg-[var(--admin-hover)] hover:admin-shell-text"
                      }`}>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                        <span className="min-w-0 break-words text-sm lg:truncate">
                          <span className="mr-1.5">{tp.emoji}</span>
                          {tp.event}
                        </span>
                        <span className={`shrink-0 self-start rounded-full px-1.5 py-0.5 text-xs sm:self-auto ${
                          tp.audience === "Customer" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"
                        }`}>{tp.audience}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <div className={`size-1.5 rounded-full ${cfg.enabled ? "bg-ra-accent" : "bg-zinc-600"}`} />
                        <span className="text-xs admin-surface-faint">{cfg.enabled ? "Active" : "Disabled"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Template editor */}
            {active && (
              <section className="admin-surface-card min-w-0 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold admin-shell-text">
                      {active.emoji} {active.event}
                    </h2>
                    <p className="break-words text-xs admin-surface-muted">Sent to: {active.audience}</p>
                  </div>
                  <div className="w-full shrink-0 sm:w-auto">
                    <Toggle
                      label="Enable"
                      checked={Boolean(activeConfig.enabled)}
                      onChange={(v) => updateTemplate(active.id, { enabled: v })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Message Template
                  </label>
                  <textarea
                    rows={5}
                    value={activeConfig.message ?? ""}
                    onChange={(e) => updateTemplate(active.id, { message: e.target.value })}
                    className={raTextareaCls}
                  />
                </div>

                {/* Variables */}
                <div className="mt-3">
                  <p className="mb-2 text-xs admin-surface-muted">Click to insert variable:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map((v) => (
                      <button key={v} type="button"
                        onClick={() => updateTemplate(active.id, { message: (activeConfig.message ?? "") + v })}
                        className="cursor-pointer rounded-lg border admin-shell-border admin-surface-card px-2 py-0.5 font-mono text-xs text-zinc-400 hover:border-zinc-500 hover:admin-shell-text transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 rounded-xl admin-surface-card p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Preview</p>
                  <div className="max-w-full rounded-xl bg-[#dcf8c6] p-3 text-sm text-zinc-900 whitespace-pre-wrap break-words sm:max-w-xs">
                    {(activeConfig.message ?? "")
                      .replace("{customer_name}", "Rahul")
                      .replace("{order_id}", "ORD-C-001")
                      .replace("{restaurant_name}", "My Restaurant")
                      .replace("{amount}", "450")
                      .replace("{eta}", "25")
                      .replace("{order_type}", "Dine-In")
                      .replace("{customer_phone}", "9876543210")}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Test message */}
          <section className="admin-surface-card p-4 sm:p-5">
            <h2 className="mb-1 break-words text-base font-semibold admin-shell-text">Send Real Test Message</h2>
            <p className="mb-4 break-words text-xs admin-surface-muted">
              Sends an actual WhatsApp message using your saved credentials. Phone must be registered on WhatsApp.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
              <PhoneInput
                id="whatsapp-test-phone"
                value={testPhone}
                onChange={setTestPhone}
                placeholder="9876543210"
                error={testPhoneError}
                wrapperClassName="w-full min-w-0 admin-shell-border admin-surface-card sm:min-w-[200px] sm:flex-1"
                className="w-full"
              />
              <button type="button" onClick={sendTest}
                disabled={sending || testPhone.length < 10}
                className="cursor-pointer inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-50 sm:w-auto">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sending ? "Sending…" : "Send Test"}
              </button>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`mt-3 flex min-w-0 items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                testResult.success
                  ? "border-ra-primary-25 bg-ra-primary-10 text-ra-primary"
                  : "border-red-500/25 bg-red-500/10 text-red-400"
              }`}>
                {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
                <span className="min-w-0 break-words">{testResult.message}</span>
              </div>
            )}
          </section>
        </>
      )}

      {/* Info when disabled */}
      {!enabled && (
        <section className="admin-surface-card p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-4">
            <MessageCircle className="mt-1 size-8 shrink-0 text-ra-primary" />
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-base font-semibold admin-shell-text">WhatsApp Business API</h2>
              <p className="admin-page-desc mt-1 break-words text-sm">
                Enable to send real WhatsApp messages automatically when orders are placed, prepared, or delivered.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs admin-surface-muted">
                <div>✅ Order confirmed → customer</div>
                <div>✅ Order preparing → customer</div>
                <div>✅ Out for delivery → customer</div>
                <div>✅ Order delivered → customer</div>
                <div>✅ Payment received → customer</div>
                <div>✅ New order alert → restaurant</div>
              </div>
              <p className="mt-3 text-xs admin-surface-faint">
                Requires Meta Business WhatsApp API.{" "}
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank" rel="noopener noreferrer"
                  className="text-ra-primary hover:underline">
                  Setup guide →
                </a>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
