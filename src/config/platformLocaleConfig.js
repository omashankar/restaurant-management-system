import { DATE_FORMAT_OPTIONS, TIME_FORMAT_OPTIONS } from "@/config/settingsConfig";

const TIME_FORMAT_VALUES = TIME_FORMAT_OPTIONS.map((opt) => opt.value);

export const PLATFORM_DEFAULT_LOCALE = {
  defaultLanguage: "en",
  timezone: "UTC",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
};

/** UI is English-only; kept for API shape compatibility. */
export function normalizePlatformLanguage() {
  return "en";
}

export function normalizePlatformLocaleSection(data = {}) {
  const dateFormat = String(data.dateFormat ?? "").trim();
  const timeFormat = String(data.timeFormat ?? "").trim();
  return {
    defaultLanguage: "en",
    timezone: String(data.timezone ?? PLATFORM_DEFAULT_LOCALE.timezone).trim() || "UTC",
    dateFormat: DATE_FORMAT_OPTIONS.includes(dateFormat)
      ? dateFormat
      : PLATFORM_DEFAULT_LOCALE.dateFormat,
    timeFormat: TIME_FORMAT_VALUES.includes(timeFormat)
      ? timeFormat
      : PLATFORM_DEFAULT_LOCALE.timeFormat,
  };
}
