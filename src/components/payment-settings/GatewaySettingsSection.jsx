"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Activity, AlertTriangle } from "lucide-react";
import SectionCard, { Field, Input, Toggle } from "./SectionCard";

const GATEWAYS = [
  { id: "razorpay",  label: "Razorpay",       color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    badge: "bg-blue-500/15 text-blue-300" },
  { id: "cashfree",  label: "Cashfree",        color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20",  badge: "bg-green-500/15 text-green-300" },
  { id: "stripe",    label: "Stripe",          color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20",badge: "bg-violet-500/15 text-violet-300" },
  { id: "paypal",    label: "PayPal",          color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",      badge: "bg-sky-500/15 text-sky-300" },
  { id: "paytm",     label: "Paytm",           color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",    badge: "bg-cyan-500/15 text-cyan-300" },
  { id: "phonepe",   label: "PhonePe",         color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",badge: "bg-purple-500/15 text-purple-300" },
  { id: "payu",      label: "PayU",            color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20",badge: "bg-orange-500/15 text-orange-300" },
  { id: "ccavenue",  label: "CCAvenue",        color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/15 text-rose-300" },
  { id: "custom",    label: "Custom Gateway",  color: "text-zinc-300",    bg: "bg-zinc-800/60 border-zinc-700",       badge: "bg-zinc-700 text-zinc-300" },
];

const EMPTY_GW = { enabled: false, testMode: true, apiKey: "", secretKey: "", merchantId: "", webhookSecret: "", callbackUrl: "", successUrl: "", failedUrl: "", priority: 9 };
const EMPTY_CUSTOM = { ...EMPTY_GW, testMode: false, gatewayName: "", apiEndpoint: "", paymentInstructions: "", upiId: "", bankDetails: "" };

const HEALTH_COLOR = {
  healthy:   "text-emerald-400",
  unhealthy: "text-red-400",
  unknown:   "text-zinc-500",
};

export default function GatewaySettingsSection({ data, onChange, onSave, showToast }) {
  const [activeGw, setActiveGw] = useState("razorpay");
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [health, setHealth]     = useState({});
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    async function loadHealth() {
      setHealthLoading(true);
      try {
        const res = await fetch("/api/payment-settings/gateway-health");
        const json = await res.json();
        if (json.success) setHealth(json.health);
      } catch { /* silent */ }
      finally { setHealthLoading(false); }
    }
    loadHealth();
  }, []);

  const isCustom = activeGw === "custom";
  const emptyGw  = isCustom ? EMPTY_CUSTOM : EMPTY_GW;
  const gw = data[activeGw] ?? emptyGw;

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
    const start = Date.now();
    try {
      const res  = await fetch("/api/payment-settings/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: activeGw }),
      });
      const json = await res.json();
      const latencyMs = Date.now() - start;
      setTestResult({ success: json.success, message: json.message ?? json.error ?? "Unknown result.", latencyMs });
      // Record health log
      await fetch("/api/payment-settings/gateway-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: activeGw, status: json.success ? "healthy" : "unhealthy", latencyMs, error: json.error }),
      }).catch(() => {});
      setHealth((prev) => ({
        ...prev,
        [activeGw]: { ...prev[activeGw], status: json.success ? "healthy" : "unhealthy", latencyMs, lastChecked: new Date() },
      }));
    } catch {
      setTestResult({ success: false, message: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  const enabledCount = GATEWAYS.filter((g) => data[g.id]?.enabled).length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Payment Gateway Settings</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Configure payment gateways. Keys are AES-256 encrypted before storage.
            {enabledCount > 0 && <span className="ml-2 text-emerald-400">{enabledCount} gateway{enabledCount > 1 ? "s" : ""} active</span>}
          </p>
        </div>
        {healthLoading && <Loader2 className="size-4 animate-spin text-zinc-500 shrink-0 mt-1" />}
      </div>

      {/* Gateway tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {GATEWAYS.map((g) => {
          const isEnabled = Boolean(data[g.id]?.enabled);
          const h = health[g.id];
          return (
            <button key={g.id} type="button"
              onClick={() => { setActiveGw(g.id); setTestResult(null); }}
              className={`cursor-pointer inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                activeGw === g.id ? `${g.bg} ${g.color} ring-1` : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {g.label}
              {isEnabled && (
                <span className={`inline-block size-1.5 rounded-full ${
                  h?.status === "healthy" ? "bg-emerald-400" :
                  h?.status === "unhealthy" ? "bg-red-400" : "bg-zinc-500"
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Health bar for active gateway */}
      {health[activeGw] && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5">
          <Activity className={`size-4 shrink-0 ${HEALTH_COLOR[health[activeGw].status]}`} />
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className={`font-semibold capitalize ${HEALTH_COLOR[health[activeGw].status]}`}>
              {health[activeGw].status}
            </span>
            {health[activeGw].uptime !== null && (
              <span className="text-zinc-500">Uptime: <span className="text-zinc-300">{health[activeGw].uptime}%</span></span>
            )}
            {health[activeGw].latencyMs && (
              <span className="text-zinc-500">Latency: <span className="text-zinc-300">{health[activeGw].latencyMs}ms</span></span>
            )}
            {health[activeGw].lastChecked && (
              <span className="text-zinc-600">
                Last checked: {new Date(health[activeGw].lastChecked).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Enable Gateway"
            hint={`Allow customers to pay via ${GATEWAYS.find((g) => g.id === activeGw)?.label}`}
            checked={Boolean(gw.enabled)} onChange={(v) => updateGw({ enabled: v })} />
          {!isCustom && (
            <Toggle label="Test / Sandbox Mode" hint="Use test credentials — no real charges"
              checked={Boolean(gw.testMode)} onChange={(v) => updateGw({ testMode: v })} />
          )}
        </div>

        {/* Custom gateway name */}
        {isCustom && gw.enabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gateway Name">
              <Input value={gw.gatewayName ?? ""} onChange={(v) => updateGw({ gatewayName: v })} placeholder="e.g. My Bank Transfer" />
            </Field>
            <Field label="Custom API Endpoint" hint="Optional — for automated verification">
              <Input value={gw.apiEndpoint ?? ""} onChange={(v) => updateGw({ apiEndpoint: v })} placeholder="https://api.yourgateway.com/verify" />
            </Field>
          </div>
        )}

        {gw.enabled && (
          <>
            {/* Credentials */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="API Key / Client ID">
                <Input value={gw.apiKey ?? ""} onChange={(v) => updateGw({ apiKey: v })}
                  placeholder={activeGw === "razorpay" ? "rzp_live_…" : activeGw === "stripe" ? "pk_live_…" : activeGw === "cashfree" ? "CF…" : "API Key"} />
              </Field>
              <Field label="Secret Key">
                <Input type="password" value={gw.secretKey ?? ""} onChange={(v) => updateGw({ secretKey: v })} placeholder="••••••••" />
              </Field>
              <Field label="Merchant ID" hint="Your merchant/account ID from gateway dashboard">
                <Input value={gw.merchantId ?? ""} onChange={(v) => updateGw({ merchantId: v })} placeholder="MID_…" />
              </Field>
              <Field label="Webhook Secret" hint="From gateway dashboard → Webhooks">
                <Input type="password" value={gw.webhookSecret ?? ""} onChange={(v) => updateGw({ webhookSecret: v })} placeholder="••••••••" />
              </Field>
            </div>

            {/* URLs */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Callback URL">
                <Input value={gw.callbackUrl ?? ""} onChange={(v) => updateGw({ callbackUrl: v })} placeholder="https://yourdomain.com/api/webhooks/…" />
              </Field>
              <Field label="Payment Success URL">
                <Input value={gw.successUrl ?? ""} onChange={(v) => updateGw({ successUrl: v })} placeholder="https://yourdomain.com/order/success" />
              </Field>
              <Field label="Payment Failed URL">
                <Input value={gw.failedUrl ?? ""} onChange={(v) => updateGw({ failedUrl: v })} placeholder="https://yourdomain.com/order/failed" />
              </Field>
            </div>

            {/* Custom gateway extra fields */}
            {isCustom && (
              <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Manual Payment Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="UPI ID" hint="Customers can pay via UPI scan">
                    <Input value={gw.upiId ?? ""} onChange={(v) => updateGw({ upiId: v })} placeholder="yourname@upi" />
                  </Field>
                  <Field label="Bank Details" hint="Account number, IFSC for bank transfer">
                    <Input value={gw.bankDetails ?? ""} onChange={(v) => updateGw({ bankDetails: v })} placeholder="Acc: 1234… IFSC: HDFC…" />
                  </Field>
                </div>
                <Field label="Payment Instructions" hint="Shown to customer at checkout">
                  <textarea value={gw.paymentInstructions ?? ""} onChange={(e) => updateGw({ paymentInstructions: e.target.value })}
                    rows={3} placeholder="Please transfer the amount to the above account and upload screenshot…"
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
                </Field>
              </div>
            )}

            {/* Priority */}
            <Field label="Failover Priority" hint="Lower number = tried first when auto-failover is active">
              <select value={gw.priority ?? 9} onChange={(e) => updateGw({ priority: Number(e.target.value) })}
                className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45">
                {[1,2,3,4,5,6,7,8,9].map((n) => <option key={n} value={n}>Priority {n}</option>)}
              </select>
            </Field>
          </>
        )}

        {/* Test result */}
        {testResult && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            testResult.success ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-red-500/25 bg-red-500/10 text-red-400"
          }`}>
            {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
            <span>{testResult.message}</span>
            {testResult.latencyMs && <span className="ml-auto text-xs opacity-60">{testResult.latencyMs}ms</span>}
          </div>
        )}
      </div>

      {/* Failover info */}
      {enabledCount > 1 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <span>Auto-failover active — if the highest-priority gateway fails, the next enabled gateway is tried automatically.</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
        <button type="button" onClick={testConnection} disabled={testing || !gw.enabled}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
          {testing ? "Testing…" : "Test Connection"}
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </section>
  );
}
