"use client";

import { CheckCircle2, Loader2, MessageCircle, Save, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

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

const inputCls = "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/45 placeholder:text-zinc-600";

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-zinc-200">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-zinc-700"}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export default function WhatsAppPage() {
  const [loading, setLoading]           = useState(true);
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
  const [templates, setTemplates]       = useState({});

  // Load settings on mount
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/whatsapp-settings");
        const data = await res.json();
        if (data.success) {
          setEnabled(data.settings.enabled);
          setToken(data.settings.token ?? "");
          setPhoneNumberId(data.settings.phoneNumberId ?? "");
          setTemplates(data.settings.templates ?? {});
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function updateTemplate(id, patch) {
    setTemplates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveSettings() {
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/whatsapp-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, token, phoneNumberId, templates }),
      });
      const data = await res.json();
      setSaveResult({ success: data.success, message: data.success ? "Settings saved." : (data.error ?? "Failed.") });
      setTimeout(() => setSaveResult(null), 3000);
    } catch {
      setSaveResult({ success: false, message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!testPhone || testPhone.length < 10) return;
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">WhatsApp Automation</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Send real WhatsApp messages via Meta Business API for orders, payments, and alerts.
          </p>
        </div>
        <button type="button" onClick={saveSettings} disabled={saving}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {/* Save result */}
      {saveResult && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          saveResult.success
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/25 bg-red-500/10 text-red-400"
        }`}>
          {saveResult.success ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {saveResult.message}
        </div>
      )}

      {/* Enable + Credentials */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <Toggle
          label="Enable WhatsApp Automation"
          hint="Send automated messages to customers and staff via Meta WhatsApp Business API"
          checked={enabled}
          onChange={setEnabled}
        />

        {enabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                API Token (Permanent System User Token)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EAAxxxxxxxxxxxxxxxx…"
                className={inputCls}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-zinc-600">
                Meta Business → WhatsApp → API Setup → Generate Token
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Phone Number ID
              </label>
              <input
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="1234567890123"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-zinc-600">
                Meta Business → WhatsApp → Phone Numbers → Phone Number ID
              </p>
            </div>
          </div>
        )}

        {enabled && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-400">Setup Guide:</p>
            <p>1. Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">developers.facebook.com</a> → Create App → WhatsApp</p>
            <p>2. Add a phone number and get the Phone Number ID</p>
            <p>3. Generate a Permanent System User Token with <code className="text-zinc-300">whatsapp_business_messaging</code> permission</p>
            <p>4. Add customer phone numbers to the test whitelist (sandbox) or go live</p>
          </div>
        )}
      </section>

      {enabled && (
        <>
          {/* Templates */}
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            {/* Template list */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Message Templates</p>
              <div className="space-y-1">
                {TEMPLATES.map((tp) => {
                  const cfg = templates[tp.id] ?? { enabled: true };
                  return (
                    <button key={tp.id} type="button" onClick={() => setActiveTemplate(tp.id)}
                      className={`cursor-pointer w-full rounded-xl px-3 py-2.5 text-left transition-all ${
                        activeTemplate === tp.id
                          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">
                          <span className="mr-1.5">{tp.emoji}</span>
                          {tp.event}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          tp.audience === "Customer" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"
                        }`}>{tp.audience}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <div className={`size-1.5 rounded-full ${cfg.enabled ? "bg-emerald-400" : "bg-zinc-600"}`} />
                        <span className="text-xs text-zinc-600">{cfg.enabled ? "Active" : "Disabled"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Template editor */}
            {active && (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100">
                      {active.emoji} {active.event}
                    </h2>
                    <p className="text-xs text-zinc-500">Sent to: {active.audience}</p>
                  </div>
                  <Toggle
                    label="Enable"
                    checked={Boolean(activeConfig.enabled)}
                    onChange={(v) => updateTemplate(active.id, { enabled: v })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Message Template
                  </label>
                  <textarea
                    rows={5}
                    value={activeConfig.message ?? ""}
                    onChange={(e) => updateTemplate(active.id, { message: e.target.value })}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45"
                  />
                </div>

                {/* Variables */}
                <div className="mt-3">
                  <p className="mb-2 text-xs text-zinc-500">Click to insert variable:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map((v) => (
                      <button key={v} type="button"
                        onClick={() => updateTemplate(active.id, { message: (activeConfig.message ?? "") + v })}
                        className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950/60 px-2 py-0.5 font-mono text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Preview</p>
                  <div className="rounded-xl bg-[#dcf8c6] p-3 text-sm text-zinc-900 max-w-xs whitespace-pre-wrap">
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
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-1 text-base font-semibold text-zinc-100">Send Real Test Message</h2>
            <p className="mb-4 text-xs text-zinc-500">
              Sends an actual WhatsApp message using your saved credentials. Phone must be registered on WhatsApp.
            </p>
            <div className="flex gap-3">
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 text-sm text-zinc-400 shrink-0">+91</div>
              <input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className={`${inputCls} flex-1`}
                maxLength={10}
              />
              <button type="button" onClick={sendTest}
                disabled={sending || testPhone.length < 10}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shrink-0">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sending ? "Sending…" : "Send Test"}
              </button>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                testResult.success
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/25 bg-red-500/10 text-red-400"
              }`}>
                {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
                {testResult.message}
              </div>
            )}
          </section>
        </>
      )}

      {/* Info when disabled */}
      {!enabled && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-start gap-4">
            <MessageCircle className="size-8 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-base font-semibold text-zinc-100">WhatsApp Business API</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Enable to send real WhatsApp messages automatically when orders are placed, prepared, or delivered.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-zinc-500">
                <div>✅ Order confirmed → customer</div>
                <div>✅ Order preparing → customer</div>
                <div>✅ Out for delivery → customer</div>
                <div>✅ Order delivered → customer</div>
                <div>✅ Payment received → customer</div>
                <div>✅ New order alert → restaurant</div>
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                Requires Meta Business WhatsApp API.{" "}
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank" rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline">
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
