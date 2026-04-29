"use client";

import InputField from "@/components/settings/InputField";
import SettingsFormSection from "@/components/settings/SettingsFormSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import TimePicker from "@/components/settings/TimePicker";
import ToggleSwitch from "@/components/settings/ToggleSwitch";
import {
  CURRENCY_OPTIONS,
  EMPTY_SETTINGS,
  LANGUAGE_OPTIONS,
  SETTINGS_TABS,
  TIMEZONE_OPTIONS,
} from "@/config/settingsConfig";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success"|"error", message }

  // Load settings from API on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          // Guard: ensure openingHours is always an array (old DB docs may have it as object)
          const safe = {
            ...data.settings,
            openingHours: Array.isArray(data.settings.openingHours)
              ? data.settings.openingHours
              : EMPTY_SETTINGS.openingHours,
          };
          setSettings(safe);
          setSavedSnapshot(safe);
        }
      } catch {
        showToast("error", "Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot]
  );

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
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
      if (data.success) {
        setSavedSnapshot(settings);
        showToast("success", "Settings saved successfully.");
      } else {
        showToast("error", data.error || "Failed to save settings.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const updateDay = (index, patch) => {
    setSettings((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((day, i) =>
        i === index ? { ...day, ...patch } : day
      ),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure restaurant preferences, POS behavior, and notifications.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <SettingsSidebar
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="space-y-4">
          {activeTab === "general" ? (
            <SettingsFormSection
              title="General Settings"
              description="Basic profile and localization for your restaurant."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Restaurant Name"
                  value={settings.general.restaurantName}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, restaurantName: v },
                    }))
                  }
                />
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Logo Upload
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-300 hover:border-zinc-700">
                    <Upload className="size-4 text-zinc-400" />
                    <span>
                      {settings.general.logoName || "Choose logo file"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            logoName: e.target.files?.[0]?.name || "",
                          },
                        }))
                      }
                    />
                  </label>
                </div>
                <InputField
                  label="Currency"
                  value={settings.general.currency}
                  options={CURRENCY_OPTIONS}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, currency: v },
                    }))
                  }
                />
                <InputField
                  label="Timezone"
                  value={settings.general.timezone}
                  options={TIMEZONE_OPTIONS}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, timezone: v },
                    }))
                  }
                />
                <InputField
                  label="Language"
                  value={settings.general.language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, language: v },
                    }))
                  }
                />
              </div>
            </SettingsFormSection>
          ) : null}

          {activeTab === "pos" ? (
            <SettingsFormSection
              title="POS & Charges"
              description="Control pricing behavior and order calculations."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Tax Percentage (%)"
                  type="number"
                  value={settings.pos.taxPercentage}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      pos: { ...prev.pos, taxPercentage: v },
                    }))
                  }
                />
                <InputField
                  label="Service Charge (%)"
                  type="number"
                  value={settings.pos.serviceCharge}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      pos: { ...prev.pos, serviceCharge: v },
                    }))
                  }
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ToggleSwitch
                  label="Enable Discount"
                  checked={settings.pos.enableDiscount}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      pos: { ...prev.pos, enableDiscount: v },
                    }))
                  }
                />
                <ToggleSwitch
                  label="Enable Tips"
                  checked={settings.pos.enableTips}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      pos: { ...prev.pos, enableTips: v },
                    }))
                  }
                />
                <ToggleSwitch
                  label="Round Off Total"
                  checked={settings.pos.roundOffTotal}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      pos: { ...prev.pos, roundOffTotal: v },
                    }))
                  }
                />
              </div>
            </SettingsFormSection>
          ) : null}

          {activeTab === "notifications" ? (
            <SettingsFormSection
              title="Notifications"
              description="Choose where and when to receive important alerts."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleSwitch
                  label="Order Notifications"
                  checked={settings.notifications.orderNotifications}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, orderNotifications: v },
                    }))
                  }
                />
                <ToggleSwitch
                  label="Reservation Alerts"
                  checked={settings.notifications.reservationAlerts}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, reservationAlerts: v },
                    }))
                  }
                />
                <ToggleSwitch
                  label="Low Stock Alerts"
                  checked={settings.notifications.lowStockAlerts}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, lowStockAlerts: v },
                    }))
                  }
                />
                <ToggleSwitch
                  label="Email Notifications"
                  checked={settings.notifications.emailNotifications}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: v },
                    }))
                  }
                />
                <ToggleSwitch
                  label="SMS Notifications"
                  checked={settings.notifications.smsNotifications}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, smsNotifications: v },
                    }))
                  }
                />
              </div>
            </SettingsFormSection>
          ) : null}

          {activeTab === "hours" ? (
            <SettingsFormSection
              title="Opening Hours"
              description="Set your weekly operating schedule."
            >
              <div className="space-y-3">
                {settings.openingHours.map((row, index) => (
                  <div
                    key={row.day}
                    className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 md:grid-cols-[120px_1fr_1fr_auto]"
                  >
                    <div className="flex items-center text-sm font-medium text-zinc-200">
                      {row.day}
                    </div>
                    <TimePicker
                      label="Open"
                      value={row.openTime}
                      disabled={row.closed}
                      onChange={(v) => updateDay(index, { openTime: v })}
                    />
                    <TimePicker
                      label="Close"
                      value={row.closeTime}
                      disabled={row.closed}
                      onChange={(v) => updateDay(index, { closeTime: v })}
                    />
                    <div className="flex items-end">
                      <ToggleSwitch
                        label="Closed"
                        checked={row.closed}
                        onChange={(v) => updateDay(index, { closed: v })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SettingsFormSection>
          ) : null}

          {activeTab === "contact" ? (
            <SettingsFormSection
              title="Contact Details"
              description="Public-facing contact and location settings."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Phone Number"
                  value={settings.contact.phoneNumber}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phoneNumber: v },
                    }))
                  }
                />
                <InputField
                  label="Email"
                  type="email"
                  value={settings.contact.email}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: v },
                    }))
                  }
                />
                <InputField
                  label="Address"
                  multiline
                  value={settings.contact.address}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, address: v },
                    }))
                  }
                />
                <InputField
                  label="Google Maps Link"
                  value={settings.contact.googleMapsLink}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, googleMapsLink: v },
                    }))
                  }
                />
              </div>
            </SettingsFormSection>
          ) : null}

          <div className="flex items-center justify-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <button
              type="button"
              onClick={saveChanges}
              disabled={!hasChanges || isSaving}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {toast ? (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-2xl shadow-black/40 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-zinc-900 text-emerald-300"
              : "border-red-500/30 bg-zinc-900 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
