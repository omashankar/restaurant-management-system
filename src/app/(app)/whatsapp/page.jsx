"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, MessageCircle, Save, Send } from "lucide-react";
import { useState } from "react";

const TEMPLATES = [
  {
    id: "order_confirmed",
    event: "Order Confirmed",
    emoji: "✅",
    audience: "Customer",
    defaultMsg: "Hi {customer_name}! Your order #{order_id} has been confirmed at {restaurant_name}. Estimated time: {eta} mins. Thank you! 🙏",
  },
  {
    id: "order_preparing",
    event: "Order Preparing",
    emoji: "👨‍🍳",
    audience: "Customer",
    defaultMsg: "Hi {customer_name}! Your order #{order_id} is being prepared. We'll notify you when it's ready! 🍽️",
  },
  {
    id: "out_for_delivery",
    event: "Out for Delivery",
    emoji: "🛵",
    audience: "Customer",
    defaultMsg: "Hi {customer_name}! Your order #{order_id} is out for delivery. Expected arrival: {eta} mins. Track: {tracking_link}",
  },
  {
    id: "order_delivered",
    event: "Order Delivered",
    emoji: "🎉",
    audience: "Customer",
    defaultMsg: "Hi {customer_name}! Your order #{order_id} has been delivered. Enjoy your meal! Rate us: {feedback_link} ⭐",
  },
  {
    id: "payment_received",
    event: "Payment Received",
    emoji: "💰",
    audience: "Customer",
    defaultMsg: "Hi {customer_name}! Payment of ₹{amount} received for order #{order_id}. Invoice: {invoice_link}",
  },
  {
    id: "new_order_alert",
    event: "New Order Alert",
    emoji: "🔔",
    audience: "Restaurant",
    defaultMsg: "New order #{order_id} received! Type: {order_type}. Amount: ₹{amount}. Customer: {customer_name} ({customer_phone})",
  },
  {
    id: "low_stock",
    event: "Low Stock Alert",
    emoji: "⚠️",
    audience: "Restaurant",
    defaultMsg: "Low stock alert! {item_name} is running low ({quantity} {unit} remaining). Please reorder soon.",
  },
];

const VARIABLES = ["{customer_name}", "{order_id}", "{restaurant_name}", "{amount}", "{eta}", "{order_type}", "{customer_phone}", "{invoice_link}", "{tracking_link}", "{feedback_link}", "{item_name}", "{quantity}", "{unit}"];

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
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [templates, setTemplates] = useState(
    Object.fromEntries(TEMPLATES.map((tp) => [tp.id, { enabled: true, message: tp.defaultMsg }]))
  );
  const [activeTemplate, setActiveTemplate] = useState("order_confirmed");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [sending, setSending] = useState(false);

  function updateTemplate(id, patch) {
    setTemplates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveSettings() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function sendTest() {
    if (!testPhone) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    alert(`Test message sent to +91${testPhone} (simulation)`);
  }

  const active = TEMPLATES.find((tp) => tp.id === activeTemplate);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{t("whatsapp.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">Automate WhatsApp messages for orders, payments, and alerts.</p>
        </div>
        <button type="button" onClick={saveSettings}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
          {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Enable toggle */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <Toggle label={t("whatsapp.enabled")} hint="Send automated WhatsApp messages to customers and staff"
          checked={enabled} onChange={setEnabled} />

        {enabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">WhatsApp Business API Key</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••" className={inputCls} />
              <p className="mt-1 text-xs text-zinc-600">Get from Meta Business → WhatsApp API</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Phone Number ID</label>
              <input value={phoneId} onChange={(e) => setPhoneId(e.target.value)}
                placeholder="1234567890" className={inputCls} />
            </div>
          </div>
        )}
      </section>

      {enabled && (
        <>
          {/* Templates */}
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            {/* Template list */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("whatsapp.templates")}</p>
              <div className="space-y-1">
                {TEMPLATES.map((tp) => (
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
                      <div className={`size-1.5 rounded-full ${templates[tp.id]?.enabled ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      <span className="text-xs text-zinc-600">{templates[tp.id]?.enabled ? "Active" : "Disabled"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Template editor */}
            {active && (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100">
                      {active.emoji} {active.event}
                    </h2>
                    <p className="text-xs text-zinc-500">Sent to: {active.audience}</p>
                  </div>
                  <Toggle label="Enable" checked={templates[active.id]?.enabled ?? true}
                    onChange={(v) => updateTemplate(active.id, { enabled: v })} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Message Template</label>
                  <textarea rows={5} value={templates[active.id]?.message ?? active.defaultMsg}
                    onChange={(e) => updateTemplate(active.id, { message: e.target.value })}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
                </div>

                {/* Variables */}
                <div className="mt-3">
                  <p className="mb-2 text-xs text-zinc-500">Available variables (click to insert):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map((v) => (
                      <button key={v} type="button"
                        onClick={() => updateTemplate(active.id, { message: (templates[active.id]?.message ?? "") + v })}
                        className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950/60 px-2 py-0.5 font-mono text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Preview</p>
                  <div className="rounded-xl bg-[#dcf8c6] p-3 text-sm text-zinc-900 max-w-xs">
                    {(templates[active.id]?.message ?? active.defaultMsg)
                      .replace("{customer_name}", "Rahul")
                      .replace("{order_id}", "ORD-001")
                      .replace("{restaurant_name}", "My Restaurant")
                      .replace("{amount}", "450")
                      .replace("{eta}", "25")
                      .replace("{order_type}", "Dine-In")}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Test message */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">Send Test Message</h2>
            <div className="flex gap-3">
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 text-sm text-zinc-400">+91</div>
              <input value={testPhone} onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210" className={`${inputCls} flex-1`} maxLength={10} />
              <button type="button" onClick={sendTest} disabled={sending || testPhone.length < 10}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                <Send className="size-4" />
                {sending ? "Sending…" : "Send Test"}
              </button>
            </div>
          </section>
        </>
      )}

      {/* Info */}
      {!enabled && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-start gap-4">
            <MessageCircle className="size-8 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-base font-semibold text-zinc-100">WhatsApp Business API</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Enable WhatsApp automation to send order confirmations, delivery updates, and payment receipts automatically.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-zinc-500">
                <div>✅ Order confirmed messages</div>
                <div>✅ Delivery tracking updates</div>
                <div>✅ Payment receipts with PDF</div>
                <div>✅ Low stock alerts to staff</div>
                <div>✅ New order alerts</div>
                <div>✅ Custom message templates</div>
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                Requires Meta Business WhatsApp API access. <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Learn more →</a>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
