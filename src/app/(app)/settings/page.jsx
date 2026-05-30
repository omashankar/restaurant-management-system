"use client";

import InputField from "@/components/settings/InputField";
import RestaurantLogoField from "@/components/settings/RestaurantLogoField";
import SettingsFormSection from "@/components/settings/SettingsFormSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import { invalidateRestaurantBrandingCache } from "@/hooks/useRestaurantBranding";
import { updateRestaurantThemeCache } from "@/hooks/useRestaurantTheme";
import { invalidateRestaurantInfoCache } from "@/hooks/useRestaurantInfo";
import { invalidateAccessControlCache } from "@/hooks/useAccessControlSettings";
import TimePicker from "@/components/settings/TimePicker";
import ToggleSwitch from "@/components/settings/ToggleSwitch";
import GatewaySettingsSection from "@/components/payment-settings/GatewaySettingsSection";
import BankAccountSection from "@/components/payment-settings/BankAccountSection";
import TaxSettingsSection from "@/components/payment-settings/TaxSettingsSection";
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
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import {
  validatePaymentBank,
  validatePaymentGatewaySave,
  validatePaymentTax,
  validateRestaurantSettingsPatch,
  validateRestaurantTheme,
} from "@/lib/restaurantSettingsValidation";
import { useEffect, useMemo, useState } from "react";
import { Palette } from "lucide-react";
import {
  raBtnPrimarySmCls,
  raSpinnerCls,
  RESTAURANT_ADMIN_ACCENT,
  RESTAURANT_ADMIN_PRIMARY,
} from "@/config/restaurantAdminTheme";
import {
  clearRestaurantThemePreview,
  dispatchRestaurantThemePreview,
} from "@/lib/restaurantAdminThemeRuntime";

const PAYMENT_TABS = ["payments","billing"];

function RestaurantThemeSection({ data, onChange, onSave, saving, canSave, fieldErrors = {}, onClearError }) {
  const primary = data.primaryColor ?? RESTAURANT_ADMIN_PRIMARY;
  const accent = data.accentColor ?? RESTAURANT_ADMIN_ACCENT;

  useEffect(() => {
    dispatchRestaurantThemePreview({
      primaryColor: primary,
      accentColor: accent,
      darkMode: data.darkMode,
    });
  }, [primary, accent, data.darkMode]);

  useEffect(() => () => clearRestaurantThemePreview(), []);

  return (
    <SettingsFormSection
      title="Theme"
      description="Primary Color drives your admin panel — sidebar, buttons, loaders. Accent is for success states (paid, active, online)."
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
        <Palette className="size-4 text-ra-primary" />
        Brand colors
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primary}
              onChange={(e) => onChange("primaryColor", e.target.value)}
              className="cursor-pointer size-10 shrink-0 rounded-lg border border-zinc-700 bg-transparent p-0.5"
            />
            <input
              value={primary}
              onChange={(e) => {
                onChange("primaryColor", e.target.value);
                onClearError?.("primaryColor");
              }}
              placeholder={RESTAURANT_ADMIN_PRIMARY}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus-ra-primary"
            />
          </div>
          {fieldErrors.primaryColor ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.primaryColor}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">Default: {RESTAURANT_ADMIN_PRIMARY}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => onChange("accentColor", e.target.value)}
              className="cursor-pointer size-10 shrink-0 rounded-lg border border-zinc-700 bg-transparent p-0.5"
            />
            <input
              value={accent}
              onChange={(e) => {
                onChange("accentColor", e.target.value);
                onClearError?.("accentColor");
              }}
              placeholder={RESTAURANT_ADMIN_ACCENT}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus-ra-primary"
            />
          </div>
          {fieldErrors.accentColor ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.accentColor}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">Default: {RESTAURANT_ADMIN_ACCENT}</p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Live preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={`${raBtnPrimarySmCls} px-4 py-2`}>
            Primary button
          </button>
          <span className="ra-status-badge rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Active / Paid
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-ra-primary-40 bg-ra-primary-10 px-3 py-1.5 text-xs text-ra-primary ring-1 ring-ra-primary-25">
            Nav active
          </span>
        </div>
      </div>

      <div className="mt-4">
        <ToggleSwitch
          label="Dark Mode"
          hint="Use dark theme across the restaurant admin panel."
          checked={!!data.darkMode}
          onChange={(v) => onChange("darkMode", v)}
        />
      </div>

      <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSave}
          className={`${raBtnPrimarySmCls} px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {saving ? (
            <>
              <Loader2 className={`${raSpinnerCls} size-4`} />
              Saving theme…
            </>
          ) : (
            "Save Theme"
          )}
        </button>
      </div>
    </SettingsFormSection>
  );
}

export default function SettingsPage() {
  const { user, hydrated } = useUser();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestRecipient, setSmtpTestRecipient] = useState("");
  const [toast, setToast] = useState(null);
  const [restaurantSlug, setRestaurantSlug] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Payment settings state (separate API)
  const [paySettings, setPaySettings] = useState(EMPTY_PAYMENT_SETTINGS);
  const [payLoading, setPayLoading] = useState(false);

  const sidebarTabs = useMemo(
    () => SETTINGS_TABS.filter((t) => {
      if (t.id === "email" || t.id === "theme") return user?.role === "admin";
      return true;
    }),
    [user?.role]
  );

  useEffect(() => {
    if (!hydrated) return;
    if ((activeTab === "email" || activeTab === "theme") && user?.role !== "admin") {
      setActiveTab("general");
    }
  }, [hydrated, activeTab, user?.role]);

  useEffect(() => {
    async function load() {
      setLoadError(null);
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!res.ok || !data.success) {
          const msg = data.error ?? "Failed to load settings.";
          setLoadError(msg);
          showToast("error", msg);
          return;
        }
        const safe = {
          ...data.settings,
          paymentMethods: { ...EMPTY_SETTINGS.paymentMethods, ...(data.settings.paymentMethods ?? {}) },
          email: { ...EMPTY_SETTINGS.email, ...(data.settings.email ?? {}) },
          openingHours: Array.isArray(data.settings.openingHours) ? data.settings.openingHours : EMPTY_SETTINGS.openingHours,
          accessControl: normalizeAccessControl(data.settings.accessControl),
          theme: { ...EMPTY_SETTINGS.theme, ...(data.settings.theme ?? {}) },
        };
        updateRestaurantThemeCache(safe.theme);
        setSettings(safe);
        setSavedSnapshot(safe);
        if (data.restaurantSlug) setRestaurantSlug(data.restaurantSlug);
      } catch {
        const msg = "Could not load settings.";
        setLoadError(msg);
        showToast("error", msg);
      } finally { setIsLoading(false); }
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

  const themeHasChanges = useMemo(
    () => JSON.stringify(settings.theme) !== JSON.stringify(savedSnapshot.theme),
    [settings.theme, savedSnapshot.theme]
  );

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }

  async function saveThemeSettings() {
    if (!themeHasChanges) return;

    const validation = validateRestaurantTheme(settings.theme);
    if (!validation.valid) {
      setFieldErrors((prev) => ({ ...prev, ...validation.errors }));
      showToast("error", validation.message ?? "Fix theme colors.");
      return;
    }

    setIsSavingTheme(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "theme", data: settings.theme }),
      });
      const data = await res.json();
      if (data.success) {
        const normalized = updateRestaurantThemeCache(settings.theme);
        setSettings((prev) => ({ ...prev, theme: normalized }));
        setSavedSnapshot((prev) => ({ ...prev, theme: normalized }));
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.primaryColor;
          delete next.accentColor;
          return next;
        });
        clearRestaurantThemePreview();
        showToast("success", "Theme saved — panel updated.");
      } else {
        showToast("error", data.error || "Failed to save theme.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSavingTheme(false);
    }
  }

  async function savePaySection(section, data) {
    let validation = { valid: true, message: null };
    if (section === "gateways") validation = validatePaymentGatewaySave(data);
    else if (section === "bank") validation = validatePaymentBank(data);
    else if (section === "tax") validation = validatePaymentTax(data);
    if (!validation.valid) {
      showToast("error", validation.message ?? "Fix the highlighted fields.");
      return;
    }
    try {
      const res = await fetch("/api/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", section === "gateways" ? "Payment gateway saved. Refresh customer checkout to see UPI/Card." : "Saved successfully.");
        if (section === "gateways") {
          const reload = await fetch("/api/payment-settings");
          const data2 = await reload.json();
          if (data2.success) setPaySettings((p) => ({ ...p, ...data2.settings }));
        }
      } else showToast("error", json.error ?? "Failed to save.");
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

    const changedSections = Object.keys(EMPTY_SETTINGS).filter(
      (key) => JSON.stringify(settings[key]) !== JSON.stringify(savedSnapshot[key])
    );
    if (changedSections.length === 0) return;

    const validation = validateRestaurantSettingsPatch(settings, changedSections);
    if (!validation.valid) {
      const nextErrors = {};
      for (const result of Object.values(validation.tabs ?? {})) {
        Object.assign(nextErrors, result.errors ?? {});
      }
      setFieldErrors(nextErrors);
      showToast("error", validation.message ?? "Fix the highlighted fields.");
      return;
    }

    const patchBody = Object.fromEntries(
      changedSections.map((key) => [key, settings[key]])
    );

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSnapshot(settings);
        setFieldErrors({});
        invalidateRestaurantInfoCache();
        invalidateRestaurantBrandingCache();
        invalidateAccessControlCache();
        if (changedSections.includes("theme")) {
          updateRestaurantThemeCache(settings.theme);
          clearRestaurantThemePreview();
        }
        showToast("success", "Settings saved successfully.");
      } else showToast("error", data.error || "Failed to save settings.");
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
        <Loader2 className={`size-6 animate-spin ${raSpinnerCls}`} />
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

      {loadError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <SettingsSidebar tabs={sidebarTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="space-y-4">

          {/* ── GENERAL (with Notifications merged) ── */}
          {activeTab === "general" && (
            <div className="space-y-5">

              {/* Customer Site URL card */}
              <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
                restaurantSlug
                  ? "border-ra-primary-25 bg-ra-primary-10"
                  : "border-amber-500/25 bg-amber-500/8"
              }`}>
                <span className="mt-0.5 text-xl">{restaurantSlug ? "🔗" : "⚠️"}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${restaurantSlug ? "text-ra-primary-muted" : "text-amber-300"}`}>
                    {restaurantSlug ? "Customer Site URL" : "Customer URL Set Nahi Hai"}
                  </p>
                  {restaurantSlug ? (
                    <p className="mt-0.5 truncate font-mono text-xs text-ra-primary/80">
                      {typeof window !== "undefined" ? window.location.origin : ""}/r/{restaurantSlug}/home
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-amber-400/80">
                      Super Admin → Restaurants mein apna <strong>slug</strong> set karo taaki customers aapke restaurant ka URL use kar sakein.
                    </p>
                  )}
                </div>
              </div>
              <SettingsFormSection title="General Settings" description="Basic profile and localization for your restaurant.">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Restaurant Name"
                    value={settings.general.restaurantName}
                    error={fieldErrors.restaurantName}
                    onChange={(v) => {
                      setSettings((p) => ({ ...p, general: { ...p.general, restaurantName: v } }));
                      if (fieldErrors.restaurantName) {
                        setFieldErrors((e) => ({ ...e, restaurantName: "" }));
                      }
                    }}
                  />
                  <RestaurantLogoField
                    logoUrl={settings.general.logoUrl ?? ""}
                    onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, logoUrl: v } }))}
                    disabled={isSaving}
                  />
                  <InputField label="Currency" value={settings.general.currency} options={CURRENCY_OPTIONS}
                    onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, currency: v } }))} />
                  <InputField label="Timezone" value={settings.general.timezone} options={TIMEZONE_OPTIONS}
                    onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, timezone: v } }))} />
                  <InputField label="Language" value={settings.general.language} options={LANGUAGE_OPTIONS}
                    onChange={(v) => setSettings((p) => ({ ...p, general: { ...p.general, language: v } }))} />
                </div>
              </SettingsFormSection>

              <SettingsFormSection title="Notifications" description="Control in-app inbox alerts and optional email/SMS alerts for new orders. SMS alerts use WhatsApp — configure credentials under WhatsApp menu.">
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleSwitch label="Order Notifications" checked={settings.notifications.orderNotifications}
                    onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, orderNotifications: v } }))} />
                  <ToggleSwitch label="Reservation Alerts" checked={settings.notifications.reservationAlerts}
                    onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, reservationAlerts: v } }))} />
                  <ToggleSwitch label="Low Stock Alerts" checked={settings.notifications.lowStockAlerts}
                    onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, lowStockAlerts: v } }))} />
                  <ToggleSwitch label="Email Notifications" checked={settings.notifications.emailNotifications}
                    onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, emailNotifications: v } }))} />
                  <ToggleSwitch label="SMS / WhatsApp Alerts" checked={settings.notifications.smsNotifications}
                    onChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, smsNotifications: v } }))} />
                </div>
                <p className="mt-2 text-xs text-zinc-600">
                  WhatsApp order alerts: WhatsApp menu → setup guide → enable New Order Alert template.
                </p>
              </SettingsFormSection>
            </div>
          )}

          {/* ── POS ── */}
          {activeTab === "pos" && (
            <SettingsFormSection title="POS & Charges" description="Control pricing behavior and order calculations.">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Tax Percentage (%)"
                  type="number"
                  value={settings.pos.taxPercentage}
                  error={fieldErrors.taxPercentage}
                  onChange={(v) => {
                    setSettings((p) => ({ ...p, pos: { ...p.pos, taxPercentage: v } }));
                    if (fieldErrors.taxPercentage) setFieldErrors((e) => ({ ...e, taxPercentage: "" }));
                  }}
                />
                <InputField
                  label="Service Charge (%)"
                  type="number"
                  value={settings.pos.serviceCharge}
                  error={fieldErrors.serviceCharge}
                  onChange={(v) => {
                    setSettings((p) => ({ ...p, pos: { ...p.pos, serviceCharge: v } }));
                    if (fieldErrors.serviceCharge) setFieldErrors((e) => ({ ...e, serviceCharge: "" }));
                  }}
                />
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

          {/* ── PAYMENTS (Gateway only — Methods auto-detected) ── */}
          {activeTab === "payments" && (
            payLoading ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-ra-primary" /></div>
            ) : (
              <div className="space-y-5">
                {/* ── Info card — auto-detection notice ── */}
                <div className="flex items-start gap-3 rounded-xl border border-ra-primary-25 bg-ra-primary-10 px-4 py-3.5">
                  <span className="mt-0.5 text-lg">⚡</span>
                  <div>
                    <p className="text-sm font-semibold text-ra-primary-muted">Payment Methods — Auto Detected</p>
                    <p className="mt-0.5 text-xs text-ra-primary/80">
                      Payment methods are automatically enabled based on your gateway configuration.
                      Configure your gateway below — UPI, Card, Net Banking will be available automatically.
                      Cash on Delivery is always available.
                    </p>
                  </div>
                </div>

                {/* ── Payment Gateway ── */}
                <GatewaySettingsSection
                  data={paySettings.gateways}
                  onChange={(d) => setPaySettings((p) => ({ ...p, gateways: d }))}
                  onSave={(d) => savePaySection("gateways", d)}
                  showToast={showToast}
                />
              </div>
            )
          )}

          {/* ── BILLING INFO (Bank + Tax merged) ── */}
          {activeTab === "billing" && (
            payLoading ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-ra-primary" /></div>
            ) : (
              <div className="space-y-5">
                {/* Bank Account */}
                <BankAccountSection
                  data={paySettings.bank}
                  onChange={(d) => setPaySettings((p) => ({ ...p, bank: d }))}
                  onSave={(d) => savePaySection("bank", d)}
                />
                {/* Tax Settings */}
                <TaxSettingsSection
                  data={paySettings.tax}
                  onChange={(d) => setPaySettings((p) => ({ ...p, tax: d }))}
                  onSave={(d) => savePaySection("tax", d)}
                />
              </div>
            )
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
                <InputField
                  label="SMTP Host"
                  placeholder="smtp.example.com"
                  value={settings.email.smtpHost}
                  error={fieldErrors.smtpHost}
                  onChange={(v) => {
                    setSettings((p) => ({ ...p, email: { ...p.email, smtpHost: v } }));
                    if (fieldErrors.smtpHost) setFieldErrors((e) => ({ ...e, smtpHost: "" }));
                  }}
                />
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ra-primary-40 bg-ra-primary-15 px-4 py-2.5 text-sm font-medium text-ra-primary-muted transition-colors hover-bg-ra-primary-15 disabled:cursor-not-allowed disabled:opacity-50">
                  {testingSmtp ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  {testingSmtp ? "Sending…" : "Send test email"}
                </button>
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
                                className="size-4 accent-ra-primary disabled:cursor-not-allowed disabled:opacity-60"
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

          {/* ── THEME ── */}
          {activeTab === "theme" && (
            <RestaurantThemeSection
              data={settings.theme ?? EMPTY_SETTINGS.theme}
              saving={isSavingTheme}
              canSave={themeHasChanges}
              onSave={saveThemeSettings}
              fieldErrors={fieldErrors}
              onClearError={(key) => setFieldErrors((e) => ({ ...e, [key]: "" }))}
              onChange={(key, value) =>
                setSettings((p) => ({
                  ...p,
                  theme: { ...p.theme, [key]: value },
                }))
              }
            />
          )}

          {/* ── CONTACT ── */}
          {activeTab === "contact" && (
            <SettingsFormSection title="Contact Details" description="Public-facing contact and location settings.">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Phone Number"
                  type="tel"
                  value={settings.contact.phoneNumber}
                  error={fieldErrors.phoneNumber}
                  onChange={(v) => {
                    setSettings((p) => ({
                      ...p,
                      contact: { ...p.contact, phoneNumber: v.replace(/\D/g, "").slice(0, 10) },
                    }));
                    if (fieldErrors.phoneNumber) setFieldErrors((e) => ({ ...e, phoneNumber: "" }));
                  }}
                  placeholder="9876543210"
                />
                <InputField
                  label="Email"
                  type="email"
                  value={settings.contact.email}
                  error={fieldErrors.email}
                  onChange={(v) => {
                    setSettings((p) => ({ ...p, contact: { ...p.contact, email: v } }));
                    if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: "" }));
                  }}
                />
                <InputField label="Address" multiline value={settings.contact.address}
                  onChange={(v) => setSettings((p) => ({ ...p, contact: { ...p.contact, address: v } }))} />
                <InputField label="Google Maps Link" value={settings.contact.googleMapsLink}
                  onChange={(v) => setSettings((p) => ({ ...p, contact: { ...p.contact, googleMapsLink: v } }))} />
              </div>
            </SettingsFormSection>
          )}

          {/* Save button — hide on theme tab (has its own Save Theme) and payment tabs */}
          {!isPayTab && activeTab !== "theme" && (
            <div className="flex items-center justify-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <button type="button" onClick={saveChanges} disabled={!hasChanges || isSaving}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-2xl shadow-black/40 ${
          toast.type === "success" ? "border-ra-primary-30 bg-zinc-900 text-ra-primary-muted" : "border-red-500/30 bg-zinc-900 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
