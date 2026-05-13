"use client";

import InputField from "@/components/settings/InputField";
import SettingsFormSection from "@/components/settings/SettingsFormSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import TimePicker from "@/components/settings/TimePicker";
import ToggleSwitch from "@/components/settings/ToggleSwitch";
import GatewaySettingsSection from "@/components/payment-settings/GatewaySettingsSection";
import BankAccountSection from "@/components/payment-settings/BankAccountSection";
import SettlementSection from "@/components/payment-settings/SettlementSection";
import TaxSettingsSection from "@/components/payment-settings/TaxSettingsSection";
import PaymentTransactionsSection from "@/components/payment-settings/PaymentTransactionsSection";
import RefundManagementSection from "@/components/payment-settings/RefundManagementSection";
import PayoutRequestsSection from "@/components/payment-settings/PayoutRequestsSection";
import {
  CURRENCY_OPTIONS,
  EMPTY_SETTINGS,
  LANGUAGE_OPTIONS,
  SETTINGS_TABS,
  TIMEZONE_OPTIONS,
} from "@/config/settingsConfig";
import { EMPTY_PAYMENT_SETTINGS, PAYMENT_METHOD_LABELS } from "@/config/paymentConfig";
import {
  ACCESS_CONTROL_FEATURES,
  normalizeAccessControl,
} from "@/config/accessControlConfig";
import { useUser } from "@/context/AuthContext";
import { CheckCircle2, Loader2, Mail, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAYMENT_TABS = ["payments","gateway","bank","settlement","tax","transactions","refunds","payouts"];

export default function SettingsPage() {
  const { user, hydrated } = useUser();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestRecipient, setSmtpTestRecipient] = useState("");
  const [toast, setToast] = useState(null);

  // Payment settings state (separate API)
  const [paySettings, setPaySettings] = useState(EMPTY_PAYMENT_SETTINGS);
  const [payLoading, setPayLoading] = useState(false);

  const sidebarTabs = useMemo(
    () => SETTINGS_TABS.filter((t) => t.id !== "email" || user?.role === "admin"),
    [user?.role]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (activeTab === "email" && user?.role !== "admin") setActiveTab("general");
  }, [hydrated, activeTab, user?.role]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          const safe = {
            ...data.settings,
            paymentMethods: { ...EMPTY_SETTINGS.paymentMethods, ...(data.settings.paymentMethods ?? {}) },
            email: { ...EMPTY_SETTINGS.email, ...(data.settings.email ?? {}) },
            openingHours: Array.isArray(data.settings.openingHours) ? data.settings.openingHours : EMPTY_SETTINGS.openingHours,
            accessControl: normalizeAccessControl(data.settings.accessControl),
          };
          setSettings(safe);
          setSavedSnapshot(safe);
        }
      } catch { showToast("error", "Failed to load settings."); }
      finally { setIsLoading(false); }
    }
    load();
  }, []);

  // Load payment settings when a payment tab is first opened
  useEffect(() => {
    if (!PAYMENT_TABS.includes(activeTab)) return;
    async function loadPay() {
      setPayLoading(true);
      try {
        const res = await fetch("/api/payment-settings");
        const data = await res.json();
        if (data.success) setPaySettings((prev) => ({ ...prev, ...data.settings }));
      } catch { showToast("error", "Failed to load payment settings."); }
      finally { setPayLoading(false); }
    }
    loadPay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot]
  );

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }

  async function savePaySection(section, data) {
    try {
      const res = await fetch("/api/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });
      const json = await res.json();
      if (json.success) showToast("success", "Saved successfully.");
      else showToast("error", json.error ?? "Failed to save.");
    } catch { showToast("error", "Network error."); }
  }

  async function sendTenantSmtpTest() {
    if (!settings.email.smtpHost || !settings.email.smtpUser) {
      showToast("error", "Enter SMTP Host and Username first.");
      return;
    }
    setTestingSmtp(true);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp: settings.email, testRecipient: smtpTestRecipient.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) showToast("success", "Test email sent.");
      else showToast("error", data.error || "Could not send test email.");
    } catch { showToast("error", "Network error."); }
    finally { setTestingSmtp(false); }
  }

  async function saveChanges() {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) { setSavedSnapshot(settings); showToast("success", "Settings saved successfully."); }
      else showToast("error", data.error || "Failed to save settings.");
    } catch { showToast("error", "Network error. Please try again."); }
    finally { setIsSaving(false); }
  }

  const updateDay = (index, patch) => {
    setSettings((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((day, i) => i === index ? { ...day, ...patch } : day),
    }));
  };

  const updateAccess = (featureKey, role, nextValue) => {
    setSettings((prev) => ({
      ...prev,
      accessControl: {
        ...prev.accessControl,
        [featureKey]: { ...prev.accessControl[featureKey], [role]: role === "admin" ? true : nextValue },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  const isPayTab = PAYMENT_TABS.includes(activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Configure restaurant preferences, POS behavior, and notifications.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <SettingsSidebar tabs={sidebarTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="space-y-4">

          {/* ── GENERAL ── */}
          {activeTab === "general" && (
            <SettingsFormSection title="General Settings" description="Basic profile and localization for your restaurant.">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Restaurant Name" value={settings.general.restaurantName}
                  onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, restaurantName: v } }))} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Logo Upload</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-300 hover:border-zinc-700">
                    <Upload className="size-4 text-zinc-400" />
                    <span>{settings.general.logoName || "Choose logo file"}</span>
                    <input type="file" className="hidden" accept="image/*"
                      onChange={(e) => setSettings((p) => ({ ...p, general: { ...p.general, logoName: e.target.files?.[0]?.name || "" } }))} />
                  </label>
                </div>
                <InputField label="Currency" value={settings.general.currency} options={CURRENCY_OPTIONS}
                  onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, currency: v } }))} />
                <InputField label="Timezone" value={settings.general.timezone} options={TIMEZONE_OPTIONS}
                  onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, timezone: v } }))} />
                <InputField label="Language" value={settings.general.language} options={LANGUAGE_OPTIONS}
                  onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, language: v } }))} />
              </div>
            </SettingsFormSection>
          )}

          {/* ── POS ── */}
          {activeTab === "pos" && (
            <SettingsFormSection title="POS & Charges" description="Control pricing behavior and order calculations.">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Tax Percentage (%)" type="number" value={settings.pos.taxPercentage}
                  onChange={(v) => setSettings((p) => ({ ...p, pos: { ...p.pos, taxPercentage: v } }))} />
                <InputField label="Service Charge (%)" type="number" value={settings.pos.serviceCharge}
                  onChange={(v) => setSettings((p) => ({ ...p, pos: { ...p.pos, serviceCharge: v } }))} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ToggleSwitch label="Enable Discount" checked={settings.pos.enableDiscount}
                  onChange={(v) => setSettings((p) => ({ ...p, pos: { ...p.pos, enableDiscount: v } }))} />
                <ToggleSwitch label="Enable Tips" checked={settings.pos.enableTips}
                  onChange={(v) => setSettings((p) => ({ ...p, pos: { ...p.pos, enableTips: v } }))} />
                <ToggleSwitch label="Round Off Total" checked={settings.pos.roundOffTotal}
                  onChange={(v) => setSettings((p) => ({ ...p, pos: { ...p.pos, roundOffTotal: v } }))} />
              </div>
            </SettingsFormSection>
          )}

          {/* ── PAYMENT METHODS ── */}
          {activeTab === "payments" && (
            <SettingsFormSection title="Payment Methods" description="Enable checkout payment options for customers.">
              {payLoading ? (
                <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-emerald-400" /></div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.keys(PAYMENT_METHOD_LABELS).map((key) => (
                      <ToggleSwitch key={key} label={PAYMENT_METHOD_LABELS[key]}
                        checked={Boolean(paySettings.methods?.[key])}
                        onChange={(v) => setPaySettings((p) => ({ ...p, methods: { ...p.methods, [key]: v } }))} />
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Default Payment Method</label>
                    <select value={paySettings.methods?.defaultMethod ?? "cod"}
                      onChange={(e) => setPaySettings((p) => ({ ...p, methods: { ...p.methods, defaultMethod: e.target.value } }))}
                      className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45">
                      {Object.entries(PAYMENT_METHOD_LABELS).filter(([k]) => paySettings.methods?.[k]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </SettingsFormSection>
          )}

          {/* ── GATEWAY ── */}
          {activeTab === "gateway" && (
            payLoading
              ? <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-emerald-400" /></div>
              : <GatewaySettingsSection data={paySettings.gateways}
                  onChange={(d) => setPaySettings((p) => ({ ...p, gateways: d }))}
                  onSave={(d) => savePaySection("gateways", d)}
                  showToast={showToast} />
          )}

          {/* ── BANK ── */}
          {activeTab === "bank" && (
            payLoading
              ? <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-emerald-400" /></div>
              : <BankAccountSection data={paySettings.bank}
                  onChange={(d) => setPaySettings((p) => ({ ...p, bank: d }))}
                  onSave={(d) => savePaySection("bank", d)} />
          )}

          {/* ── SETTLEMENT ── */}
          {activeTab === "settlement" && (
            payLoading
              ? <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-emerald-400" /></div>
              : <SettlementSection data={paySettings.settlement}
                  onChange={(d) => setPaySettings((p) => ({ ...p, settlement: d }))}
                  onSave={(d) => savePaySection("settlement", d)} />
          )}

          {/* ── TAX ── */}
          {activeTab === "tax" && (
            payLoading
              ? <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-emerald-400" /></div>
              : <TaxSettingsSection data={paySettings.tax}
                  onChange={(d) => setPaySettings((p) => ({ ...p, tax: d }))}
                  onSave={(d) => savePaySection("tax", d)} />
          )}

          {/* ── TRANSACTIONS ── */}
          {activeTab === "transactions" && <PaymentTransactionsSection showToast={showToast} />}

          {/* ── REFUNDS ── */}
          {activeTab === "refunds" && <RefundManagementSection showToast={showToast} />}

          {/* ── PAYOUTS ── */}
          {activeTab === "payouts" && (
            <PayoutRequestsSection settlement={paySettings.settlement} showToast={showToast} />
          )}

          {/* ── EMAIL ── */}
          {activeTab === "email" && (
            <SettingsFormSection title="Email / SMTP"
              description="Verification and password-reset emails for your restaurant accounts use this server when enabled; otherwise Super Admin SMTP or server env Gmail is used.">
              <ToggleSwitch label="Enable custom SMTP"
                hint="Must be on for signup verification and forgot-password mail to use this SMTP (after credentials are saved)."
                checked={settings.email.enabled}
                onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, enabled: v } }))} />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InputField label="SMTP Host" placeholder="smtp.example.com" value={settings.email.smtpHost}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, smtpHost: v } }))} />
                <InputField label="SMTP Port" type="number" value={String(settings.email.smtpPort ?? 587)}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, smtpPort: Number(v) || 587 } }))} />
                <InputField label="SMTP Username" placeholder="user@company.com" value={settings.email.smtpUser}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, smtpUser: v } }))} />
                <InputField label="SMTP Password" type="password" placeholder="••••••••" value={settings.email.smtpPassword}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, smtpPassword: v } }))} />
                <InputField label="From Name" placeholder={settings.general.restaurantName || "Restaurant"} value={settings.email.fromName}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, fromName: v } }))} />
                <InputField label="From Email" type="email" placeholder={settings.contact.email || settings.email.smtpUser} value={settings.email.fromEmail}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, fromEmail: v } }))} />
              </div>
              <div className="mt-4">
                <ToggleSwitch label="Use SSL/TLS (secure)"
                  hint="Typically on for port 465. Port 587 often uses STARTTLS with this off."
                  checked={settings.email.secure}
                  onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, secure: v } }))} />
              </div>
              <div className="mt-5 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <InputField label="Send test to (optional)" type="email"
                  placeholder={`Default: ${settings.email.smtpUser || "SMTP username"}`}
                  value={smtpTestRecipient} onChange={setSmtpTestRecipient} />
                <button type="button" onClick={sendTenantSmtpTest} disabled={testingSmtp}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50">
                  {testingSmtp ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  {testingSmtp ? "Sending…" : "Send test email"}
                </button>
              </div>
            </SettingsFormSection>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <SettingsFormSection title="Notifications" description="Choose where and when to receive important alerts.">
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleSwitch label="Order Notifications" checked={settings.notifications.orderNotifications}
                  onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, orderNotifications: v } }))} />
                <ToggleSwitch label="Reservation Alerts" checked={settings.notifications.reservationAlerts}
                  onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, reservationAlerts: v } }))} />
                <ToggleSwitch label="Low Stock Alerts" checked={settings.notifications.lowStockAlerts}
                  onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, lowStockAlerts: v } }))} />
                <ToggleSwitch label="Email Notifications" checked={settings.notifications.emailNotifications}
                  onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, emailNotifications: v } }))} />
                <ToggleSwitch label="SMS Notifications" checked={settings.notifications.smsNotifications}
                  onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, smsNotifications: v } }))} />
              </div>
            </SettingsFormSection>
          )}

          {/* ── ACCESS CONTROL ── */}
          {activeTab === "accessControl" && (
            <SettingsFormSection title="Access Control"
              description="Set feature access by role. Changes apply to new sessions; existing sessions may need re-login.">
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead className="bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Feature</th>
                      <th className="px-4 py-3 text-center">Admin</th>
                      <th className="px-4 py-3 text-center">Manager</th>
                      <th className="px-4 py-3 text-center">Waiter</th>
                      <th className="px-4 py-3 text-center">Chef</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/70">
                    {ACCESS_CONTROL_FEATURES.map((feature) => {
                      const row = settings.accessControl?.[feature.key] ?? {};
                      return (
                        <tr key={feature.key} className="bg-zinc-950/30">
                          <td className="px-4 py-3 font-medium text-zinc-200">{feature.label}</td>
                          {["admin", "manager", "waiter", "chef"].map((role) => (
                            <td key={role} className="px-4 py-3 text-center">
                              <input type="checkbox" checked={Boolean(row[role])} disabled={role === "admin"}
                                onChange={(e) => updateAccess(feature.key, role, e.target.checked)}
                                className="size-4 accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={`${feature.label} access for ${role}`} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SettingsFormSection>
          )}

          {/* ── OPENING HOURS ── */}
          {activeTab === "hours" && (
            <SettingsFormSection title="Opening Hours" description="Set your weekly operating schedule.">
              <div className="space-y-3">
                {settings.openingHours.map((row, index) => (
                  <div key={row.day} className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 md:grid-cols-[120px_1fr_1fr_auto]">
                    <div className="flex items-center text-sm font-medium text-zinc-200">{row.day}</div>
                    <TimePicker label="Open" value={row.openTime} disabled={row.closed} onChange={(v) => updateDay(index, { openTime: v })} />
                    <TimePicker label="Close" value={row.closeTime} disabled={row.closed} onChange={(v) => updateDay(index, { closeTime: v })} />
                    <div className="flex items-end">
                      <ToggleSwitch label="Closed" checked={row.closed} onChange={(v) => updateDay(index, { closed: v })} />
                    </div>
                  </div>
                ))}
              </div>
            </SettingsFormSection>
          )}

          {/* ── CONTACT ── */}
          {activeTab === "contact" && (
            <SettingsFormSection title="Contact Details" description="Public-facing contact and location settings.">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Phone Number" value={settings.contact.phoneNumber}
                  onChange={(v) => setSettings((p) => ({ ...p, contact: { ...p.contact, phoneNumber: v } }))} />
                <InputField label="Email" type="email" value={settings.contact.email}
                  onChange={(v) => setSettings((p) => ({ ...p, contact: { ...p.contact, email: v } }))} />
                <InputField label="Address" multiline value={settings.contact.address}
                  onChange={(v) => setSettings((p) => ({ ...p, contact: { ...p.contact, address: v } }))} />
                <InputField label="Google Maps Link" value={settings.contact.googleMapsLink}
                  onChange={(v) => setSettings((p) => ({ ...p, contact: { ...p.contact, googleMapsLink: v } }))} />
              </div>
            </SettingsFormSection>
          )}

          {/* Save button — only for non-payment tabs */}
          {!isPayTab && (
            <div className="flex items-center justify-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <button type="button" onClick={saveChanges} disabled={!hasChanges || isSaving}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-2xl shadow-black/40 ${
          toast.type === "success" ? "border-emerald-500/30 bg-zinc-900 text-emerald-300" : "border-red-500/30 bg-zinc-900 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
