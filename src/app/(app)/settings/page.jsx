"use client";

import InputField from "@/components/settings/InputField";
import { raIconBadgeCls, raInputCls, raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import RestaurantLogoField from "@/components/settings/RestaurantLogoField";
import SettingsFormSection from "@/components/settings/SettingsFormSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import { invalidateRestaurantBrandingCache } from "@/hooks/useRestaurantBranding";
import { updateRestaurantThemeCache } from "@/hooks/useRestaurantTheme";
import { invalidateOpeningHoursCache } from "@/hooks/useOpeningHours";
import { primeRestaurantLocaleCache } from "@/hooks/useRestaurantLocale";
import { invalidateRestaurantInfoCache } from "@/hooks/useRestaurantInfo";
import { invalidateAccessControlCache } from "@/hooks/useAccessControlSettings";
import TimePicker from "@/components/settings/TimePicker";
import ToggleSwitch from "@/components/settings/ToggleSwitch";
import GatewaySettingsSection from "@/components/payment-settings/GatewaySettingsSection";
import BankAccountSection from "@/components/payment-settings/BankAccountSection";
import TaxSettingsSection from "@/components/payment-settings/TaxSettingsSection";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  EMPTY_SETTINGS,
  filterSettingsTabsForRole,
  normalizeDateFormat,
  normalizeTimeFormat,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/config/settingsConfig";
import { EMPTY_PAYMENT_SETTINGS, PAYMENT_METHOD_LABELS } from "@/config/paymentConfig";
import {
  ACCESS_CONTROL_FEATURES,
  normalizeAccessControl,
} from "@/config/accessControlConfig";
import { useUser } from "@/context/AuthContext";
import { CheckCircle2, Loader2, Mail, RefreshCw, Settings, XCircle } from "lucide-react";
import {
  validatePaymentBank,
  validatePaymentGatewaySave,
  validatePaymentTax,
  validateRestaurantSettingsPatch,
  validateRestaurantTheme,
} from "@/lib/restaurantSettingsValidation";
import { sanitizeOpeningHoursSchedule } from "@/lib/reservationUtils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
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
import { mergeLiveAdminTheme } from "@/lib/mergeLiveAdminTheme";
import { resolveRestaurantAdminTheme } from "@/lib/restaurantAdminThemeRuntime";
import {
  applyRestaurantDocumentTheme,
  readStoredRestaurantTheme,
} from "@/lib/restaurantThemeStorage";

const PAYMENT_TABS = ["payments","billing"];

function PaymentTabSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-20 animate-pulse rounded-xl admin-surface-card" />
      <div className="h-72 animate-pulse rounded-2xl admin-surface-card" />
    </div>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 size-10 shrink-0 animate-pulse rounded-xl admin-surface-card" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-32 max-w-full animate-pulse rounded-lg admin-surface-card" />
            <div className="h-4 w-full max-w-md animate-pulse rounded admin-surface-card" />
          </div>
        </div>
        <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-28" />
      </div>
      <div className="flex min-w-0 w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="h-14 animate-pulse rounded-2xl admin-surface-card lg:h-80 lg:w-52 lg:shrink-0" />
        <div className="min-h-[360px] flex-1 animate-pulse rounded-2xl admin-surface-card" />
      </div>
    </div>
  );
}

function RestaurantThemeSection({ data, onChange, onSave, saving, canSave, fieldErrors = {}, onClearError }) {
  const primary = data.primaryColor ?? RESTAURANT_ADMIN_PRIMARY;
  const accent = data.accentColor ?? RESTAURANT_ADMIN_ACCENT;

  const pushPreview = (patch) => {
    dispatchRestaurantThemePreview({
      primaryColor: primary,
      accentColor: accent,
      darkMode: data.darkMode,
      ...patch,
    });
  };

  useEffect(
    () => () => {
      clearRestaurantThemePreview();
      const stored = readStoredRestaurantTheme();
      if (stored) applyRestaurantDocumentTheme(stored);
    },
    []
  );

  return (
    <SettingsFormSection sectionId="theme">
      <div className="mb-4 flex min-w-0 items-center gap-2 text-sm font-medium admin-surface-body">
        <Palette className="size-4 shrink-0 text-ra-primary" />
        Brand colors
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Primary Color
          </label>
          <div className="flex min-w-0 items-center gap-3">
            <input
              type="color"
              value={primary}
              onChange={(e) => {
                const v = e.target.value;
                onChange("primaryColor", v);
                pushPreview({ primaryColor: v });
              }}
              className="cursor-pointer size-10 shrink-0 rounded-lg border admin-shell-border bg-transparent p-0.5"
            />
            <input
              value={primary}
              onChange={(e) => {
                const v = e.target.value;
                onChange("primaryColor", v);
                onClearError?.("primaryColor");
                pushPreview({ primaryColor: v });
              }}
              placeholder={RESTAURANT_ADMIN_PRIMARY}
              className={`min-w-0 flex-1 font-mono ${raInputCls}`}
            />
          </div>
          {fieldErrors.primaryColor ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.primaryColor}</p>
          ) : (
            <p className="mt-1 text-xs admin-surface-faint">Default: {RESTAURANT_ADMIN_PRIMARY}</p>
          )}
        </div>
        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Accent Color
          </label>
          <div className="flex min-w-0 items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => {
                const v = e.target.value;
                onChange("accentColor", v);
                pushPreview({ accentColor: v });
              }}
              className="cursor-pointer size-10 shrink-0 rounded-lg border admin-shell-border bg-transparent p-0.5"
            />
            <input
              value={accent}
              onChange={(e) => {
                const v = e.target.value;
                onChange("accentColor", v);
                onClearError?.("accentColor");
                pushPreview({ accentColor: v });
              }}
              placeholder={RESTAURANT_ADMIN_ACCENT}
              className={`min-w-0 flex-1 font-mono ${raInputCls}`}
            />
          </div>
          {fieldErrors.accentColor ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.accentColor}</p>
          ) : (
            <p className="mt-1 text-xs admin-surface-faint">Default: {RESTAURANT_ADMIN_ACCENT}</p>
          )}
        </div>
      </div>

      <div className={`mt-5 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-4`}>
        <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${adminSurface.faint}`}>Live preview</p>
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
          onChange={(v) => {
            onChange("darkMode", v);
            pushPreview({ darkMode: v });
          }}
        />
      </div>

      <div className={`mt-6 flex justify-stretch border-t pt-4 sm:justify-end ${adminShell.borderT}`}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSave}
          className={`${raBtnPrimarySmCls} w-full px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
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
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestRecipient, setSmtpTestRecipient] = useState("");
  const [toast, setToast] = useState(null);
  const [restaurantSlug, setRestaurantSlug] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const panelRef = useRef(null);

  // Payment settings state (separate API)
  const [paySettings, setPaySettings] = useState(EMPTY_PAYMENT_SETTINGS);
  const [payLoading, setPayLoading] = useState(false);

  const sidebarTabs = useMemo(
    () => filterSettingsTabsForRole(user?.role),
    [user?.role]
  );

  const handleTabChange = (id) => {
    if (activeTab === "theme" && id !== "theme") {
      clearRestaurantThemePreview();
      const stored = readStoredRestaurantTheme();
      if (stored) applyRestaurantDocumentTheme(stored);
    }
    setActiveTab(id);
    requestAnimationFrame(() => {
      panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      const main = panelRef.current?.closest("main");
      if (main && main.scrollTop > 0) {
        main.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  useEffect(() => {
    if (!hydrated) return;
    if ((activeTab === "email" || activeTab === "theme") && user?.role !== "admin") {
      setActiveTab("general");
    }
  }, [hydrated, activeTab, user?.role]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }

  const loadSettings = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error ?? "Failed to load settings.";
        setLoadError(msg);
        if (!silent) showToast("error", msg);
        return;
      }
      const apiTheme = resolveRestaurantAdminTheme({
        ...EMPTY_SETTINGS.theme,
        ...(data.settings.theme ?? {}),
      });
      const stored = readStoredRestaurantTheme();
      const displayTheme = stored
        ? resolveRestaurantAdminTheme(mergeLiveAdminTheme(apiTheme, stored))
        : apiTheme;
      const safe = {
        ...data.settings,
        general: {
          ...EMPTY_SETTINGS.general,
          ...(data.settings.general ?? {}),
          dateFormat: normalizeDateFormat(data.settings?.general?.dateFormat),
          timeFormat: normalizeTimeFormat(data.settings?.general?.timeFormat),
        },
        paymentMethods: { ...EMPTY_SETTINGS.paymentMethods, ...(data.settings.paymentMethods ?? {}) },
        email: { ...EMPTY_SETTINGS.email, ...(data.settings.email ?? {}) },
        openingHours: sanitizeOpeningHoursSchedule(
          Array.isArray(data.settings.openingHours)
            ? data.settings.openingHours
            : EMPTY_SETTINGS.openingHours,
        ),
        accessControl: normalizeAccessControl(data.settings.accessControl),
        theme: displayTheme,
      };
      updateRestaurantThemeCache(displayTheme);
      setSettings(safe);
      setSavedSnapshot({ ...safe, theme: apiTheme });
      if (data.restaurantSlug) setRestaurantSlug(data.restaurantSlug);
      else setRestaurantSlug(null);
    } catch {
      const msg = "Could not load settings.";
      setLoadError(msg);
      if (!silent) showToast("error", msg);
    } finally {
      if (silent) setRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  const loadPaymentSettings = useCallback(async (silent = false) => {
    if (!silent) setPayLoading(true);
    try {
      const res = await fetch("/api/payment-settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPaySettings((prev) => ({ ...prev, ...data.settings }));
      else if (!silent) showToast("error", "Failed to load payment settings.");
    } catch {
      if (!silent) showToast("error", "Failed to load payment settings.");
    } finally {
      if (!silent) setPayLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /** Keep Theme tab darkMode in sync with header toggle (live stored theme). */
  useEffect(() => {
    const applyLiveTheme = (event) => {
      const live = event?.detail ?? readStoredRestaurantTheme();
      if (!live) return;
      setSettings((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          primaryColor: live.primaryColor,
          accentColor: live.accentColor,
          darkMode: live.darkMode,
        },
      }));
    };
    window.addEventListener("restaurant-theme-updated", applyLiveTheme);
    return () => window.removeEventListener("restaurant-theme-updated", applyLiveTheme);
  }, []);

  useEffect(() => {
    if (activeTab !== "theme") return;
    const live = readStoredRestaurantTheme();
    if (!live) return;
    setSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        primaryColor: live.primaryColor,
        accentColor: live.accentColor,
        darkMode: live.darkMode,
      },
    }));
  }, [activeTab]);

  // Load payment settings when a payment tab is first opened
  useEffect(() => {
    if (!PAYMENT_TABS.includes(activeTab)) return;
    loadPaymentSettings();
  }, [activeTab, loadPaymentSettings]);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot]
  );

  const themeHasChanges = useMemo(
    () => JSON.stringify(settings.theme) !== JSON.stringify(savedSnapshot.theme),
    [settings.theme, savedSnapshot.theme]
  );

  async function handleRefresh() {
    await loadSettings(true);
    if (PAYMENT_TABS.includes(activeTab)) {
      await loadPaymentSettings(true);
    }
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
        invalidateOpeningHoursCache();
        if (changedSections.includes("general")) {
          primeRestaurantLocaleCache(settings.general);
        }
        showToast("success", "Settings saved successfully.");
      } else {
        if (data.tabs) {
          const nextErrors = {};
          for (const result of Object.values(data.tabs)) {
            Object.assign(nextErrors, result.errors ?? {});
          }
          setFieldErrors(nextErrors);
        }
        showToast("error", data.error || "Failed to save settings.");
      }
    } catch { showToast("error", "Network error. Please try again."); }
    finally { setIsSaving(false); }
  }

  const updateDay = (index, patch) => {
    setSettings((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (
          key === "openingHours" ||
          key.startsWith("hours_") ||
          key.startsWith("day_") ||
          key.startsWith("open_") ||
          key.startsWith("close_") ||
          key.startsWith("missing_")
        ) {
          next[key] = "";
        }
      }
      return next;
    });
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
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <SettingsPageSkeleton />
      </div>
    );
  }

  const isPayTab = PAYMENT_TABS.includes(activeTab);

  return (
    <div className={`min-w-0 w-full max-w-full space-y-6 overflow-x-hidden transition-opacity duration-200 ${refreshing ? "opacity-70" : ""}`}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <Settings className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Settings</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">Configure restaurant preferences, POS behavior, and notifications.</p>
          </div>
        </div>
        <div className="admin-page-header-actions">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || isSaving || isSavingTheme}
          className={raPageRefreshBtnCls}
        >
          <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
          Refresh
        </button>
        </div>
      </div>

      {loadError && (
        <div className="flex min-w-0 items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <XCircle className="size-4 shrink-0" />
          <span className="min-w-0 break-words">{loadError}</span>
        </div>
      )}

      <div className="flex min-w-0 w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <SettingsSidebar tabs={sidebarTabs} activeTab={activeTab} onTabChange={handleTabChange} />

        <div ref={panelRef} className="min-w-0 w-full flex-1 space-y-4">

          {/* ── GENERAL (with Notifications merged) ── */}
          {activeTab === "general" && (
            <div className="space-y-5">

              {/* Customer Site URL card */}
              <div className={`flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3.5 ${
                restaurantSlug
                  ? "border-ra-primary-25 bg-ra-primary-10"
                  : "border-amber-500/25 bg-amber-500/8"
              }`}>
                <span className="mt-0.5 shrink-0 text-xl">{restaurantSlug ? "🔗" : "⚠️"}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${restaurantSlug ? "text-ra-primary-muted" : "text-amber-300"}`}>
                    {restaurantSlug ? "Customer Site URL" : "Customer URL Set Nahi Hai"}
                  </p>
                  {restaurantSlug ? (
                    <p className="mt-0.5 break-all font-mono text-xs text-ra-primary/80">
                      {typeof window !== "undefined" ? window.location.origin : ""}/r/{restaurantSlug}/home
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-amber-400/80">
                      Super Admin → Restaurants mein apna <strong>slug</strong> set karo taaki customers aapke restaurant ka URL use kar sakein.
                    </p>
                  )}
                </div>
              </div>
              <SettingsFormSection sectionId="general">
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
                  <InputField
                    label="Date Format"
                    value={settings.general.dateFormat}
                    options={DATE_FORMAT_OPTIONS}
                    error={fieldErrors.dateFormat}
                    onChange={(v) => {
                      setSettings((p) => ({ ...p, general: { ...p.general, dateFormat: v } }));
                      if (fieldErrors.dateFormat) {
                        setFieldErrors((e) => ({ ...e, dateFormat: "" }));
                      }
                    }}
                  />
                  <InputField
                    label="Time Format"
                    value={settings.general.timeFormat}
                    options={TIME_FORMAT_OPTIONS}
                    error={fieldErrors.timeFormat}
                    onChange={(v) => {
                      setSettings((p) => ({ ...p, general: { ...p.general, timeFormat: v } }));
                      if (fieldErrors.timeFormat) {
                        setFieldErrors((e) => ({ ...e, timeFormat: "" }));
                      }
                    }}
                  />
                </div>
              </SettingsFormSection>

              <SettingsFormSection sectionId="general.notifications">
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
                <p className="mt-2 text-xs admin-surface-faint">
                  WhatsApp order alerts: WhatsApp menu → setup guide → enable New Order Alert template.
                </p>
              </SettingsFormSection>
            </div>
          )}

          {/* ── POS ── */}
          {activeTab === "pos" && (
            <SettingsFormSection sectionId="pos">
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
              <PaymentTabSkeleton />
            ) : (
              <div className="space-y-5">
                {/* ── Info card — auto-detection notice ── */}
                <div className="flex min-w-0 items-start gap-3 rounded-xl border border-ra-primary-25 bg-ra-primary-10 px-4 py-3.5">
                  <span className="mt-0.5 shrink-0 text-lg">⚡</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-ra-primary-muted">Payment Methods — Auto Detected</p>
                    <p className="mt-0.5 break-words text-xs text-ra-primary/80">
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
              <PaymentTabSkeleton />
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
            <SettingsFormSection sectionId="email">
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
              <div className="mt-5 space-y-3 rounded-xl admin-surface-card p-4">
                <InputField label="Send test to (optional)" type="email"
                  placeholder={`Default: ${settings.email.smtpUser || "SMTP username"}`}
                  value={smtpTestRecipient} onChange={setSmtpTestRecipient} />
                <button type="button" onClick={sendTenantSmtpTest} disabled={testingSmtp}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-ra-primary-40 bg-ra-primary-15 px-4 py-2.5 text-sm font-medium text-ra-primary-muted transition-colors hover-bg-ra-primary-15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                  {testingSmtp ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  {testingSmtp ? "Sending…" : "Send test email"}
                </button>
              </div>
            </SettingsFormSection>
          )}

          {/* ── ACCESS CONTROL ── */}
          {activeTab === "accessControl" && (
            <SettingsFormSection sectionId="accessControl">
              <div className="overflow-x-auto rounded-xl border admin-shell-border">
                <table className="admin-table min-w-[640px] w-full text-sm">
                  <thead className="admin-table-head text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Feature</th>
                      <th className="px-4 py-3 text-center">Admin</th>
                      <th className="px-4 py-3 text-center">Manager</th>
                      <th className="px-4 py-3 text-center">Waiter</th>
                      <th className="px-4 py-3 text-center">Chef</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCESS_CONTROL_FEATURES.map((feature) => {
                      const row = settings.accessControl?.[feature.key] ?? {};
                      return (
                        <tr key={feature.key} className="admin-surface-card">
                          <td className="min-w-0 px-4 py-3 font-medium admin-shell-text">
                            <span className="break-words">{feature.label}</span>
                          </td>
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
            <SettingsFormSection sectionId="hours">
              {(fieldErrors.openingHours ||
                Object.entries(fieldErrors).find(
                  ([key, msg]) =>
                    msg &&
                    (key.startsWith("hours_") ||
                      key.startsWith("day_") ||
                      key.startsWith("open_") ||
                      key.startsWith("close_") ||
                      key.startsWith("missing_"))
                )?.[1]) && (
                <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {fieldErrors.openingHours ||
                    Object.entries(fieldErrors).find(
                      ([key, msg]) =>
                        msg &&
                        (key.startsWith("hours_") ||
                          key.startsWith("day_") ||
                          key.startsWith("open_") ||
                          key.startsWith("close_") ||
                          key.startsWith("missing_"))
                    )?.[1]}
                </p>
              )}
              <p className="mb-3 text-xs admin-surface-faint">
                Close at midnight? Select <strong className="text-zinc-300">12:00 AM</strong> (end of day).
                Same-day close: use e.g. <strong className="text-zinc-300">10:00 PM</strong>.
                Last bookable slot is 90 minutes before close.
              </p>
              <div className="space-y-3">
                {settings.openingHours.map((row, index) => (
                  <div
                    key={row.day}
                    className="grid grid-cols-1 gap-3 rounded-xl admin-surface-card p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
                  >
                    <div className="shrink-0 whitespace-nowrap text-sm font-medium admin-shell-text sm:col-span-2 xl:col-span-1 xl:self-center">
                      {row.day}
                    </div>
                    <TimePicker
                      label="Open"
                      value={row.openTime ?? row.open ?? ""}
                      disabled={row.closed}
                      onChange={(v) => updateDay(index, { openTime: v, open: v })}
                    />
                    <TimePicker
                      label="Close"
                      value={row.closeTime ?? row.close ?? ""}
                      disabled={row.closed}
                      onChange={(v) => updateDay(index, { closeTime: v, close: v })}
                    />
                    <div className="flex min-w-0 items-end sm:col-span-2 xl:col-span-1">
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
            <SettingsFormSection sectionId="contact">
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
            <div className="flex items-stretch justify-end gap-2 admin-surface-card px-4 py-3 sm:items-center">
              <button type="button" onClick={saveChanges} disabled={!hasChanges || isSaving}
                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed inset-x-4 bottom-4 z-50 flex min-w-0 max-w-[calc(100vw-2rem)] items-start gap-2 rounded-xl border px-4 py-2 text-sm shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md ${
          toast.type === "success" ? "border-ra-primary-30 admin-surface-card text-ra-primary-muted" : "border-red-500/30 admin-surface-card text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
          <span className="min-w-0 break-words">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
