import {
  EMPTY_SETTINGS,
  normalizeDateFormat,
  normalizeTimeFormat,
} from "@/config/settingsConfig";

export const DEFAULT_LOCALE_PREFS = {
  dateFormat: EMPTY_SETTINGS.general.dateFormat,
  timeFormat: EMPTY_SETTINGS.general.timeFormat,
  timezone: EMPTY_SETTINGS.general.timezone,
};

export function normalizeLocalePrefs(prefs = {}) {
  return {
    dateFormat: normalizeDateFormat(prefs.dateFormat),
    timeFormat: normalizeTimeFormat(prefs.timeFormat),
    timezone:
      String(prefs.timezone ?? DEFAULT_LOCALE_PREFS.timezone).trim() || "UTC",
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isDateOnlyString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "").trim());
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const s = String(value).trim();
  if (!s) return null;
  if (isDateOnlyString(s)) {
    const d = new Date(`${s}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateOnlyString(dateStr, prefs) {
  const [yyyy, mm, dd] = dateStr.split("-");
  switch (prefs.dateFormat) {
    case "MM/DD/YYYY":
      return `${mm}/${dd}/${yyyy}`;
    case "DD/MM/YYYY":
      return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD":
      return dateStr;
    default:
      return `${dd}/${mm}/${yyyy}`;
  }
}

function dateKeyInTimezone(date, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDatePartsFromInstant(d, prefs) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: prefs.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");

  switch (prefs.dateFormat) {
    case "MM/DD/YYYY":
      return `${mm}/${dd}/${yyyy}`;
    case "DD/MM/YYYY":
      return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD":
      return `${yyyy}-${mm}-${dd}`;
    default:
      return `${dd}/${mm}/${yyyy}`;
  }
}

export function formatTime24(time24, prefs = DEFAULT_LOCALE_PREFS) {
  if (!time24) return "—";
  const [h, m] = String(time24).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";

  const p = normalizeLocalePrefs(prefs);
  if (p.timeFormat === "24h") {
    return `${pad2(h)}:${pad2(m)}`;
  }

  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${pad2(m)} ${period}`;
}

export function formatTimeFromDate(
  value,
  prefs = DEFAULT_LOCALE_PREFS,
  { seconds = false } = {}
) {
  const d = toDate(value);
  if (!d) return "—";

  const p = normalizeLocalePrefs(prefs);
  if (p.timeFormat === "24h") {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: p.timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: seconds ? "2-digit" : undefined,
      hour12: false,
    }).formatToParts(d);

    const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
    const base = `${get("hour")}:${get("minute")}`;
    return seconds ? `${base}:${get("second")}` : base;
  }

  return d.toLocaleTimeString("en-US", {
    timeZone: p.timezone,
    hour: "numeric",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: true,
  });
}

export function formatAdminDate(
  value,
  prefs = DEFAULT_LOCALE_PREFS,
  { weekday = false, style = "default" } = {}
) {
  if (!value) return "—";
  const p = normalizeLocalePrefs(prefs);

  if (isDateOnlyString(value)) {
    const dateStr = String(value).trim();
    if (weekday) {
      const d = new Date(`${dateStr}T12:00:00`);
      const weekdayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      return `${weekdayLabel}, ${formatDateOnlyString(dateStr, p)}`;
    }
    if (style === "short") {
      const d = new Date(`${dateStr}T12:00:00`);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return formatDateOnlyString(dateStr, p);
  }

  const d = toDate(value);
  if (!d) return "—";

  if (weekday) {
    const weekdayLabel = d.toLocaleDateString("en-US", {
      timeZone: p.timezone,
      weekday: "short",
    });
    return `${weekdayLabel}, ${formatDatePartsFromInstant(d, p)}`;
  }

  if (style === "short") {
    return d.toLocaleDateString("en-US", {
      timeZone: p.timezone,
      month: "short",
      day: "numeric",
    });
  }

  return formatDatePartsFromInstant(d, p);
}

export function formatAdminDateTime(value, prefs = DEFAULT_LOCALE_PREFS) {
  const d = toDate(value);
  if (!d) return "—";
  const p = normalizeLocalePrefs(prefs);
  return `${formatDatePartsFromInstant(d, p)}, ${formatTimeFromDate(d, p)}`;
}

export function formatOrderPlacedAt(iso, prefs = DEFAULT_LOCALE_PREFS) {
  const d = toDate(iso);
  if (!d) return { label: "—", full: "—" };

  const p = normalizeLocalePrefs(prefs);
  const now = new Date();
  const todayKey = dateKeyInTimezone(now, p.timezone);
  const orderKey = dateKeyInTimezone(d, p.timezone);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKeyInTimezone(yesterday, p.timezone);

  const timeStr = formatTimeFromDate(d, p);
  const full = `${formatAdminDate(d, p, { weekday: true })}, ${timeStr}`;

  if (orderKey === todayKey) return { label: `Today · ${timeStr}`, full };
  if (orderKey === yesterdayKey) return { label: `Yesterday · ${timeStr}`, full };

  return {
    label: `${formatDatePartsFromInstant(d, p)} · ${timeStr}`,
    full,
  };
}

export function formatWeekdayLong(value = new Date(), prefs = DEFAULT_LOCALE_PREFS) {
  const d = toDate(value) ?? new Date();
  const p = normalizeLocalePrefs(prefs);
  return d.toLocaleDateString("en-US", {
    timeZone: p.timezone,
    weekday: "long",
  });
}

export function formatReservationSlot(date, time, prefs = DEFAULT_LOCALE_PREFS) {
  if (!date && !time) return "—";
  const p = normalizeLocalePrefs(prefs);
  const datePart = date ? formatAdminDate(date, p) : "—";
  const timePart = time ? formatTime24(time, p) : "—";
  return `${datePart} at ${timePart}`;
}

export function createLocaleFormatters(prefs = DEFAULT_LOCALE_PREFS) {
  const normalized = normalizeLocalePrefs(prefs);
  return {
    prefs: normalized,
    formatDate: (value, options) => formatAdminDate(value, normalized, options),
    formatTime: (value, options) => formatTimeFromDate(value, normalized, options),
    formatTimeSlot: (time24) => formatTime24(time24, normalized),
    formatReservationDate: (value) =>
      formatAdminDate(value, normalized, { weekday: true }),
    formatDateTime: (value) => formatAdminDateTime(value, normalized),
    formatOrderPlacedAt: (value) => formatOrderPlacedAt(value, normalized),
    formatWeekdayLong: (value) => formatWeekdayLong(value, normalized),
    formatReservationSlot: (date, time) => formatReservationSlot(date, time, normalized),
    formatShortDateTime: (value) => {
      const d = toDate(value);
      if (!d) return "—";
      return `${formatAdminDate(d, normalized, { style: "short" })}, ${formatTimeFromDate(d, normalized)}`;
    },
  };
}
