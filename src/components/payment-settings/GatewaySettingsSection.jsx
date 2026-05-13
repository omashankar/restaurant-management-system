"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Zap, Lock, Settings2 } from "lucide-react";
import Image from "next/image";
import { Field, Input } from "./SectionCard";

const GATEWAYS = [
  { id: "razorpay", label: "Razorpay",  logo: "/logos/razorpay.svg",  desc: "Best for India — UPI, Cards, Net Banking", popular: true  },
  { id: "cashfree", label: "Cashfree",  logo: "/logos/cashfree.svg",  desc: "Fast settlements, India",                  popular: false },
  { id: "stripe",   label: "Stripe",    logo: "/logos/stripe.svg",    desc: "International payments",                   popular: false },
  { id: "paypal",   label: "PayPal",    logo: "/logos/paypal.svg",    desc: "Global — 200+ countries",                  popular: false },
  { id: "paytm",    label: "Paytm",     logo: "/logos/paytm.svg",     desc: "India — Wallet & UPI",                     popular: false },
  { id: "phonepe",  label: "PhonePe",   logo: "/logos/phonepe.svg",   desc: "India — UPI payments",                     popular: false },
  { id: "payu",     label: "PayU",      logo: "/logos/payu.svg",      desc: "India — All payment modes",                popular: false },
  { id: "ccavenue", label: "CCAvenue",  logo: "/logos/ccavenue.svg",  desc: "India — Enterprise gateway",               popular: false },
  { id: "custom",   label: "Custom",    logo: null,                   desc: "Manual / Bank transfer / UPI",             popular: false },
];

const EMPTY_GW = {
  enabled: false, testMode: true,
  apiKey: "", secretKey: "", merchantId: "", webhookSecret: "",
  callbackUrl: "", successUrl: "", failedUrl: "",
};

export default function GatewaySettingsSection({ data, onChange, onSave, showToast }) {
  const [activeGw, setActiveGw] = useState("razorpay");
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving]     = useState(false);

  const isCustom = activeGw === "custom";
  const gw = data[activeGw] ?? EMPTY_GW;

  function updateGw(patch) {
    onChange({ ...data, [activeGw]: { ...gw, ...patch } });
    setTestResult(null);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/payment-settings/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: activeGw }),
      });
      const json = await res.json();
      setTestResult({ success: json.success, message: json.message ?? json.error ?? "Unknown." });
    } catch {
      setTestResult({ success: false, message: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  const activeInfo = GATEWAYS.find((g) => g.id === activeGw);
  const enabledGateways = GATEWAYS.filter((g) => data[g.id]?.enabled);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-100">Payment Gateway</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select a gateway and enter your API keys. Keys are encrypted before saving.
          {enabledGateways.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="size-3" />
              {enabledGateways.map((g) => g.label).join(", ")} active
            </span>
          )}
        </p>
      </div>

      {/* Gateway selector — card grid */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {GATEWAYS.map((g) => {
          const isEnabled = Boolean(data[g.id]?.enabled);
          const isActive  = activeGw === g.id;
          return (
            <button key={g.id} type="button"
              onClick={() => { setActiveGw(g.id); setTestResult(null); }}
              className={`cursor-pointer relative rounded-xl border p-3 text-center transition-all ${
                isActive
                  ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
              }`}>
              {/* Enabled dot */}
              {isEnabled && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-400" />
              )}
              {/* Logo or fallback icon */}
              <div className="flex h-8 items-center justify-center mb-1.5">
                {g.logo ? (
                  <Image
                    src={g.logo}
                    alt={g.label}
                    width={64}
                    height={32}
                    className="max-h-8 w-auto object-contain"
                    onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                  />
                ) : (
                  <Settings2 className="size-6 text-zinc-500" />
                )}
              </div>
              <p className={`text-xs font-semibold ${isActive ? "text-emerald-400" : "text-zinc-300"}`}>
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

      {/* Active gateway form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        {/* Gateway header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-zinc-100">
              {activeInfo?.icon} {activeInfo?.label}
            </p>
            <p className="text-xs text-zinc-500">{activeInfo?.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Test mode badge */}
            {!isCustom && gw.enabled && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                gw.testMode
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-emerald-500/15 text-emerald-400"
              }`}>
                {gw.testMode ? "Test Mode" : "Live Mode"}
              </span>
            )}
            {/* Enable toggle */}
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-sm text-zinc-400">Enable</span>
              <button type="button" role="switch" aria-checked={Boolean(gw.enabled)}
                onClick={() => updateGw({ enabled: !gw.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  gw.enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  gw.enabled ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </label>
          </div>
        </div>

        {!gw.enabled ? (
          /* Disabled state */
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Lock className="size-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">Enable {activeInfo?.label} to configure credentials</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Test/Live toggle */}
            {!isCustom && (
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Sandbox / Test Mode</p>
                  <p className="text-xs text-zinc-500">No real charges in test mode</p>
                </div>
                <button type="button" role="switch" aria-checked={Boolean(gw.testMode)}
                  onClick={() => updateGw({ testMode: !gw.testMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gw.testMode ? "bg-amber-500" : "bg-emerald-500"
                  }`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    gw.testMode ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            )}

            {/* Custom gateway name */}
            {isCustom && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Gateway Name">
                  <Input value={gw.gatewayName ?? ""} onChange={(v) => updateGw({ gatewayName: v })}
                    placeholder="e.g. Bank Transfer" />
                </Field>
                <Field label="UPI ID">
                  <Input value={gw.upiId ?? ""} onChange={(v) => updateGw({ upiId: v })}
                    placeholder="yourname@upi" />
                </Field>
                <Field label="Bank Details" hint="Account no, IFSC">
                  <Input value={gw.bankDetails ?? ""} onChange={(v) => updateGw({ bankDetails: v })}
                    placeholder="Acc: 1234… IFSC: HDFC…" />
                </Field>
                <Field label="Payment Instructions">
                  <Input value={gw.paymentInstructions ?? ""} onChange={(v) => updateGw({ paymentInstructions: v })}
                    placeholder="Transfer and share screenshot" />
                </Field>
              </div>
            )}

            {/* API Credentials */}
            {!isCustom && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="API Key" hint={activeGw === "razorpay" ? "Starts with rzp_" : activeGw === "stripe" ? "Starts with pk_" : ""}>
                  <Input value={gw.apiKey ?? ""} onChange={(v) => updateGw({ apiKey: v })}
                    placeholder={activeGw === "razorpay" ? "rzp_live_…" : activeGw === "stripe" ? "pk_live_…" : "API Key"} />
                </Field>
                <Field label="Secret Key">
                  <Input type="password" value={gw.secretKey ?? ""} onChange={(v) => updateGw({ secretKey: v })}
                    placeholder="••••••••" />
                </Field>
                <Field label="Merchant ID" hint="Optional">
                  <Input value={gw.merchantId ?? ""} onChange={(v) => updateGw({ merchantId: v })}
                    placeholder="MID_…" />
                </Field>
                <Field label="Webhook Secret" hint="From gateway dashboard">
                  <Input type="password" value={gw.webhookSecret ?? ""} onChange={(v) => updateGw({ webhookSecret: v })}
                    placeholder="••••••••" />
                </Field>
              </div>
            )}

            {/* Test result */}
            {testResult && (
              <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                testResult.success
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/25 bg-red-500/10 text-red-400"
              }`}>
                {testResult.success
                  ? <CheckCircle2 className="size-4 shrink-0" />
                  : <XCircle className="size-4 shrink-0" />}
                {testResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={testConnection}
          disabled={testing || !gw.enabled || isCustom}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          {testing ? "Testing…" : "Test Connection"}
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </section>
  );
}
