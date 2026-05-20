"use client";

import { useToast } from "@/hooks/useToast";
import {
  Activity, CheckCircle2, Copy, CreditCard,
  DollarSign, Loader2, Lock, RefreshCw, Search,
  Settings2, Shield, TrendingUp, XCircle, Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const GATEWAYS = [
  { id: "razorpay",  label: "Razorpay",  logo: "/logos/razorpay.svg",  desc: "India — UPI, Cards, Net Banking", popular: true,  color: "#2563EB", fields: ["apiKey","secretKey","webhookSecret"] },
  { id: "stripe",    label: "Stripe",    logo: "/logos/stripe.svg",    desc: "International payments",          popular: false, color: "#635BFF", fields: ["publicKey","secretKey","webhookSecret"] },
  { id: "cashfree",  label: "Cashfree",  logo: "/logos/cashfree.svg",  desc: "India — Fast settlements",        popular: false, color: "#00B050", fields: ["apiKey","secretKey","webhookSecret"] },
  { id: "paypal",    label: "PayPal",    logo: "/logos/paypal.svg",    desc: "Global — 200+ countries",         popular: false, color: "#003087", fields: ["clientId","secretKey","webhookSecret"] },
  { id: "paytm",     label: "Paytm",     logo: "/logos/paytm.svg",     desc: "India — Wallet & UPI",            popular: false, color: "#00BAF2", fields: ["merchantId","apiKey","webhookSecret"] },
  { id: "phonepe",   label: "PhonePe",   logo: "/logos/phonepe.svg",   desc: "India — UPI payments",            popular: false, color: "#5F259F", fields: ["merchantId","apiKey","webhookSecret"] },
  { id: "payu",      label: "PayU",      logo: "/logos/payu.svg",      desc: "India — All payment modes",       popular: false, color: "#FF6600", fields: ["apiKey","secretKey","webhookSecret"] },
  { id: "ccavenue",  label: "CCAvenue",  logo: "/logos/ccavenue.svg",  desc: "India — Enterprise gateway",      popular: false, color: "#E31837", fields: ["merchantId","apiKey","webhookSecret"] },
  { id: "instamojo", label: "Instamojo", logo: null, icon: "💸",       desc: "India — Simple payments",         popular: false, color: "#F26522", fields: ["apiKey","secretKey","webhookSecret"] },
];

const FIELD_LABELS = {
  apiKey: "API Key", publicKey: "Publishable Key", secretKey: "Secret Key",
  merchantId: "Merchant ID", clientId: "Client ID", webhookSecret: "Webhook Secret",
};

const FIELD_PLACEHOLDERS = {
  razorpay:  { apiKey: "rzp_live_XXXXXXXXXX", secretKey: "••••••••", webhookSecret: "••••••••" },
  stripe:    { publicKey: "pk_live_XXXXXXXXXX", secretKey: "sk_live_••••••••", webhookSecret: "whsec_••••••••" },
  cashfree:  { apiKey: "CF_APP_ID", secretKey: "••••••••", webhookSecret: "••••••••" },
  paypal:    { clientId: "AXxx…", secretKey: "••••••••", webhookSecret: "••••••••" },
  paytm:     { merchantId: "MID_XXXX", apiKey: "••••••••", webhookSecret: "••••••••" },
  phonepe:   { merchantId: "PGTESTPAYUAT", apiKey: "••••••••", webhookSecret: "••••••••" },
  payu:      { apiKey: "PAYU_KEY", secretKey: "••••••••", webhookSecret: "••••••••" },
  ccavenue:  { merchantId: "MID_XXXX", apiKey: "••••••••", webhookSecret: "••••••••" },
  instamojo: { apiKey: "test_api_key_XXXX", secretKey: "••••••••", webhookSecret: "••••••••" },
};

const inputCls = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 transition-colors font-mono";

function GatewayLogo({ gw, size = "md" }) {
  const [err, setErr] = useState(false);
  const sz = size === "lg" ? "max-h-9 max-w-[80px]" : "max-h-8 max-w-[64px]";

  if (!gw.logo || err) {
    if (gw.icon) {
      return (
        <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-xl">
          {gw.icon}
        </div>
      );
    }
    // Settings2 icon fallback — same as restaurant admin
    return <Settings2 className="size-6 text-zinc-500" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={gw.logo} alt={gw.label} width={64} height={32}
    className={`${sz} w-auto object-contain`} onError={() => setErr(true)} />;
}

function StatusBadge({ enabled, testMode }) {
  if (!enabled) return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500"><span className="size-1.5 rounded-full bg-zinc-600" />Disabled</span>;
  if (testMode)  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/25"><span className="size-1.5 rounded-full bg-amber-400" />Sandbox</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />Live</span>;
}

function StatCard({ icon: Icon, label, value, sub, color = "emerald" }) {
  const colors = {
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    blue:    "border-blue-500/20 bg-blue-500/5 text-blue-400",
    red:     "border-red-500/20 bg-red-500/5 text-red-400",
    zinc:    "border-zinc-700 bg-zinc-900/60 text-zinc-300",
  };
  return (
    <div className={`rounded-2xl border px-5 py-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 opacity-70" />
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}

export default function PaymentGatewaysPage() {
  const { showToast, ToastUI } = useToast();
  const [activeTab, setActiveTab] = useState("gateways");
  const [activeGw, setActiveGw] = useState("razorpay");
  const [gateways, setGateways] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, paid: 0, failed: 0, revenue: 0 });
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [commission, setCommission] = useState({ platformPercent: 2, gatewayPercent: 1.5 });

  const gwInfo = GATEWAYS.find((g) => g.id === activeGw);
  const gw = gateways[activeGw] ?? { enabled: false, testMode: true };
  const enabledGateways = GATEWAYS.filter((g) => gateways[g.id]?.enabled);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/settings");
      const data = await res.json();
      if (data.success) {
        setGateways(data.settings?.payment?.gateways ?? {});
        setCommission({
          platformPercent: data.settings?.payment?.platformCommission ?? 2,
          gatewayPercent:  data.settings?.payment?.gatewayCharges ?? 1.5,
        });
      }
    } catch { showToast("Failed to load settings.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/payments?page=1");
      const data = await res.json();
      if (data.success) {
        setStats({
          total:   data.pagination?.total ?? 0,
          paid:    data.summary?.paidCount ?? 0,
          failed:  (data.payments ?? []).filter((p) => p.status === "failed").length,
          revenue: data.summary?.totalRevenue ?? 0,
        });
      }
    } catch {}
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ page: "1" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/super-admin/payments?${params}`);
      const data = await res.json();
      if (data.success) setTransactions(data.payments ?? []);
    } catch {}
    finally { setTxLoading(false); }
  }, [search]);

  useEffect(() => { loadSettings(); loadStats(); }, [loadSettings, loadStats]);
  useEffect(() => { if (activeTab === "transactions") loadTransactions(); }, [activeTab, loadTransactions]);

  function updateGw(patch) {
    setGateways((prev) => ({ ...prev, [activeGw]: { ...gw, ...patch } }));
    setTestResult(null);
  }

  async function saveGateway() {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "payment", data: { gateways } }),
      });
      const json = await res.json();
      if (json.success) showToast(`${gwInfo?.label} settings saved!`);
      else showToast(json.error ?? "Failed to save.", "error");
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(false); }
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
    } catch { setTestResult({ success: false, message: "Network error." }); }
    finally { setTesting(false); }
  }

  function copyWebhookUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/api/webhooks/${activeGw}`)
      .then(() => showToast("Webhook URL copied!"));
  }

  async function saveCommission() {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "payment", data: {
          platformCommission: commission.platformPercent,
          gatewayCharges: commission.gatewayPercent,
        }}),
      });
      const json = await res.json();
      if (json.success) showToast("Commission settings saved!");
      else showToast(json.error ?? "Failed.", "error");
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(false); }
  }

  const TABS = [
    { id: "gateways",     label: "Payment Gateways" },
    { id: "transactions", label: "Transactions" },
    { id: "health",       label: "Gateway Health" },
    { id: "commission",   label: "Commission & Fees" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <CreditCard className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Payment Gateway Management</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Configure gateways, monitor health, and manage transactions.
              {enabledGateways.length > 0 && (
                <span className="ml-2 font-medium text-emerald-400">
                  {enabledGateways.length} active: {enabledGateways.map((g) => g.label).join(", ")}
                </span>
              )}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => { loadSettings(); loadStats(); }}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Revenue"  value={`$${stats.revenue.toLocaleString()}`} sub="All time"           color="emerald" />
        <StatCard icon={TrendingUp} label="Successful"     value={stats.paid}    sub="Paid transactions"  color="blue" />
        <StatCard icon={XCircle}    label="Failed"         value={stats.failed}  sub="Failed transactions" color="red" />
        <StatCard icon={Activity}   label="Total Txns"     value={stats.total}   sub="All statuses"        color="zinc" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40 p-1">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.id ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── GATEWAYS TAB ── */}
      {activeTab === "gateways" && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left: Gateway list */}
          <div className="space-y-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Select Gateway</p>
            {GATEWAYS.map((g) => {
              const gwData = gateways[g.id] ?? {};
              const isActive = activeGw === g.id;
              return (
                <button key={g.id} type="button"
                  onClick={() => { setActiveGw(g.id); setTestResult(null); }}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isActive ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/25"
                             : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                  }`}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60">
                    <GatewayLogo gw={g} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${isActive ? "text-emerald-400" : "text-zinc-200"}`}>{g.label}</p>
                    <StatusBadge enabled={gwData.enabled} testMode={gwData.testMode} />
                  </div>
                  {g.popular && <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">Popular</span>}
                </button>
              );
            })}
          </div>

          {/* Right: Config form */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950/60">
                  <GatewayLogo gw={gwInfo} size="lg" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">{gwInfo?.label}</h2>
                  <p className="text-xs text-zinc-500">{gwInfo?.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {gw.enabled && <StatusBadge enabled={gw.enabled} testMode={gw.testMode} />}
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="text-sm text-zinc-400">Enable</span>
                  <button type="button" role="switch" aria-checked={Boolean(gw.enabled)}
                    onClick={() => updateGw({ enabled: !gw.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gw.enabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${gw.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </label>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {!gw.enabled ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Lock className="size-10 text-zinc-700" />
                  <p className="text-sm text-zinc-500">Enable {gwInfo?.label} to configure credentials</p>
                </div>
              ) : (
                <>
                  {/* Environment */}
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Environment Mode</p>
                      <p className="text-xs text-zinc-500">{gw.testMode ? "Sandbox — no real charges" : "Live — real payments active"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${gw.testMode ? "text-amber-400" : "text-zinc-600"}`}>TEST</span>
                      <button type="button" onClick={() => updateGw({ testMode: !gw.testMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!gw.testMode ? "bg-emerald-500" : "bg-amber-500"}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${!gw.testMode ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                      <span className={`text-xs font-bold ${!gw.testMode ? "text-emerald-400" : "text-zinc-600"}`}>LIVE</span>
                    </div>
                  </div>

                  {/* Credentials */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">API Credentials</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(gwInfo?.fields ?? []).map((fieldKey) => (
                        <div key={fieldKey}>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400">{FIELD_LABELS[fieldKey] ?? fieldKey}</label>
                          <div className="relative">
                            <input type={["secretKey","webhookSecret"].includes(fieldKey) ? "password" : "text"}
                              value={gw[fieldKey] ?? ""}
                              onChange={(e) => updateGw({ [fieldKey]: e.target.value })}
                              placeholder={FIELD_PLACEHOLDERS[activeGw]?.[fieldKey] ?? ""}
                              autoComplete="new-password"
                              className={inputCls} />
                            {["secretKey","webhookSecret"].includes(fieldKey) && (
                              <Shield className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Webhook URL */}
                  {["razorpay","stripe","cashfree"].includes(activeGw) && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Webhook URL <span className="text-zinc-600">(add to gateway dashboard)</span></label>
                      <div className="flex gap-2">
                        <input readOnly
                          value={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/${activeGw}` : `/api/webhooks/${activeGw}`}
                          className={`${inputCls} text-zinc-500`} />
                        <button type="button" onClick={copyWebhookUrl}
                          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
                          <Copy className="size-3.5" /> Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {testResult && (
                    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                      testResult.success ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-red-500/25 bg-red-500/10 text-red-400"
                    }`}>
                      {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
                      {testResult.message}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                    <button type="button" onClick={testConnection} disabled={testing}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-40 transition-colors">
                      {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                      {testing ? "Testing…" : "Test Connection"}
                    </button>
                    <button type="button" onClick={saveGateway} disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadTransactions()}
                placeholder="Search restaurant, invoice…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
            </div>
            <button type="button" onClick={loadTransactions}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              <RefreshCw className={`size-4 ${txLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          {txLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
              <DollarSign className="size-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Payment ID</th>
                      <th className="px-4 py-3">Restaurant</th>
                      <th className="hidden px-4 py-3 md:table-cell">Gateway</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="hidden px-4 py-3 lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {transactions.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-zinc-800/20">
                        <td className="px-4 py-3"><p className="font-mono text-xs text-zinc-400">{p.invoiceId || p.id?.slice(0,12)}</p></td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-100">{p.restaurantName}</p>
                          <p className="text-xs text-zinc-500">{p.adminEmail}</p>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold capitalize text-zinc-300">{p.method || "—"}</span>
                        </td>
                        <td className="px-4 py-3"><p className="font-semibold tabular-nums text-zinc-100">${p.amount?.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{p.currency}</span></p></td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                            p.status === "paid"     ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25" :
                            p.status === "failed"   ? "bg-red-500/15 text-red-400 ring-red-500/25" :
                            p.status === "refunded" ? "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25" :
                            "bg-amber-500/15 text-amber-400 ring-amber-500/25"
                          }`}>{p.status}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-zinc-600 lg:table-cell">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HEALTH TAB ── */}
      {activeTab === "health" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GATEWAYS.map((g) => {
            const gwData = gateways[g.id] ?? {};
            const hasKeys = gwData.apiKey || gwData.secretKey || gwData.publicKey || gwData.clientId || gwData.merchantId;
            return (
              <div key={g.id} className={`rounded-2xl border p-4 transition-all ${
                gwData.enabled && !gwData.testMode ? "border-emerald-500/30 bg-emerald-500/5" :
                gwData.enabled && gwData.testMode  ? "border-amber-500/30 bg-amber-500/5" :
                "border-zinc-800 bg-zinc-900/40 opacity-60"
              }`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950/60">
                      <GatewayLogo gw={g} />
                    </div>
                    <p className="font-semibold text-zinc-200">{g.label}</p>
                  </div>
                  <StatusBadge enabled={gwData.enabled} testMode={gwData.testMode} />
                </div>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center justify-between">
                    <span>API Keys</span>
                    <span className={hasKeys ? "text-emerald-400" : "text-red-400"}>{hasKeys ? "✓ Configured" : "✗ Missing"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Webhook</span>
                    <span className={gwData.webhookSecret ? "text-emerald-400" : "text-zinc-600"}>{gwData.webhookSecret ? "✓ Set" : "— Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mode</span>
                    <span className={gwData.testMode ? "text-amber-400" : "text-emerald-400"}>{gwData.testMode ? "Sandbox" : "Live"}</span>
                  </div>
                </div>
                {gwData.enabled && (
                  <button type="button" onClick={() => { setActiveGw(g.id); setActiveTab("gateways"); }}
                    className="mt-3 w-full rounded-lg border border-zinc-700 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                    Configure →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── COMMISSION TAB ── */}
      {activeTab === "commission" && (
        <div className="max-w-lg space-y-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-1 text-base font-semibold text-zinc-100">Platform Commission</h2>
            <p className="mb-5 text-xs text-zinc-500">Set the percentage charged on each restaurant transaction.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Platform Commission (%)</label>
                <input type="number" min={0} max={50} step={0.1} value={commission.platformPercent}
                  onChange={(e) => setCommission((p) => ({ ...p, platformPercent: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50" />
                <p className="mt-1 text-[11px] text-zinc-600">e.g. 2% on every successful transaction</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Gateway Charges (%)</label>
                <input type="number" min={0} max={10} step={0.1} value={commission.gatewayPercent}
                  onChange={(e) => setCommission((p) => ({ ...p, gatewayPercent: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50" />
                <p className="mt-1 text-[11px] text-zinc-600">Standard gateway fee (e.g. Razorpay ~2%)</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                <p className="text-xs font-semibold text-zinc-400 mb-2">Settlement Preview</p>
                <div className="space-y-1 text-xs text-zinc-500">
                  <div className="flex justify-between"><span>Order Amount</span><span className="text-zinc-300">₹1,000</span></div>
                  <div className="flex justify-between"><span>Gateway Fee ({commission.gatewayPercent}%)</span><span className="text-red-400">- ₹{(1000 * commission.gatewayPercent / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Platform Commission ({commission.platformPercent}%)</span><span className="text-red-400">- ₹{(1000 * commission.platformPercent / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1 font-semibold">
                    <span className="text-zinc-300">Restaurant Gets</span>
                    <span className="text-emerald-400">₹{(1000 - 1000 * (commission.gatewayPercent + commission.platformPercent) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={saveCommission} disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {saving ? "Saving…" : "Save Commission Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastUI}
    </div>
  );
}
