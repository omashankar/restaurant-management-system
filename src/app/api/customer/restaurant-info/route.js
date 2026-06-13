/**
 * GET /api/customer/restaurant-info
 *
 * Public endpoint — no auth required.
 * Returns restaurant name, logo, contact, hours, tagline.
 * Used by customer-facing pages (Navbar, Footer, About, Contact, Home).
 *
 * Slug-aware: uses x-restaurant-slug header/cookie via restaurantResolver.
 */

import { BHOJDESK_LOGOS } from "@/config/bhojdeskBrand";
import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import {
  formatTime24,
  normalizeLocalePrefs,
} from "@/lib/localeFormat";
import { resolveCustomerSiteName } from "@/lib/resolveBrandLogos";
import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { sanitizeOpeningHoursSchedule } from "@/lib/reservationUtils";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: true, info: getDefaults() });
    }

    // Fetch restaurant doc + settings in parallel
    const [restaurantDoc, settingsDoc] = await Promise.all([
      db.collection("restaurants").findOne(
        { _id: restaurantId },
        { projection: { name: 1, slug: 1, logoUrl: 1, address: 1, phone: 1 } }
      ),
      db.collection("restaurant_settings").findOne(
        { restaurantId },
        { projection: { general: 1, contact: 1, openingHours: 1 } }
      ),
    ]);

    const name = resolveCustomerSiteName(
      settingsDoc?.general?.restaurantName?.trim() || restaurantDoc?.name?.trim()
    );

    const address = settingsDoc?.contact?.address?.trim()
                 || restaurantDoc?.address?.trim()
                 || "";

    const phone   = settingsDoc?.contact?.phoneNumber?.trim()
                 || restaurantDoc?.phone?.trim()
                 || "";

    const email   = settingsDoc?.contact?.email?.trim() || "";
    const googleMapsLink = settingsDoc?.contact?.googleMapsLink?.trim() || "";
    const logoUrl =
      restaurantDoc?.logoUrl?.trim() ||
      settingsDoc?.general?.logoUrl?.trim() ||
      BHOJDESK_LOGOS.horizontalLight;
    const slug    = restaurantDoc?.slug ?? null;
    const currency = settingsDoc?.general?.currency || "USD";
    const locale = normalizeLocalePrefs({
      dateFormat: settingsDoc?.general?.dateFormat,
      timeFormat: settingsDoc?.general?.timeFormat,
      timezone: settingsDoc?.general?.timezone,
    });

    // Opening hours — build a human-readable summary
    const openingHours = sanitizeOpeningHoursSchedule(
      Array.isArray(settingsDoc?.openingHours)
        ? settingsDoc.openingHours
        : getDefaultHours(),
    );

    // Today's status
    const todayName = new Intl.DateTimeFormat("en-US", {
      timeZone: locale.timezone,
      weekday: "long",
    }).format(new Date());
    const todayHours = openingHours.find((h) => h.day === todayName);
    const isOpenToday = todayHours && !todayHours.closed;
    const todayLabel = isOpenToday
      ? `${formatTime24(todayHours.openTime, locale)} – ${formatTime24(todayHours.closeTime, locale)}`
      : "Closed today";

    // Short hours summary (e.g. "Mon–Fri: 9AM–10PM · Sat–Sun: 10AM–11PM")
    const hoursSummary = buildHoursSummary(openingHours, locale);

    return Response.json({
      success: true,
      info: {
        name,
        address,
        phone,
        email,
        googleMapsLink,
        logoUrl,
        slug,
        currency,
        dateFormat: locale.dateFormat,
        timeFormat: locale.timeFormat,
        timezone: locale.timezone,
        openingHours,
        isOpenToday,
        todayLabel,
        hoursSummary,
      },
    }, {
      headers: {
        // Cache for 5 minutes — settings don't change often
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("customer.restaurant-info.GET failed:", err.message);
    return Response.json({ success: true, info: getDefaults() });
  }
}

function getDefaults() {
  return {
    name: resolveCustomerSiteName(""),
    address: "",
    phone: "",
    email: "",
    googleMapsLink: "",
    logoUrl: BHOJDESK_LOGOS.horizontalLight,
    slug: null,
    currency: "USD",
    dateFormat: EMPTY_SETTINGS.general.dateFormat,
    timeFormat: EMPTY_SETTINGS.general.timeFormat,
    timezone: EMPTY_SETTINGS.general.timezone,
    openingHours: getDefaultHours(),
    isOpenToday: true,
    todayLabel: "11:00 – 22:00",
    hoursSummary: "Mon–Sun: 11:00 AM – 10:00 PM",
  };
}

function getDefaultHours() {
  return [
    { day: "Monday",    openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Tuesday",   openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Wednesday", openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Thursday",  openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Friday",    openTime: "09:00", closeTime: "23:00", closed: false },
    { day: "Saturday",  openTime: "10:00", closeTime: "23:00", closed: false },
    { day: "Sunday",    openTime: "10:00", closeTime: "21:00", closed: false },
  ];
}

function buildHoursSummary(hours, locale = normalizeLocalePrefs()) {
  if (!Array.isArray(hours) || hours.length === 0) return "";
  // Group consecutive days with same hours
  const groups = [];
  let current = null;
  for (const h of hours) {
    const label = h.closed
      ? "Closed"
      : `${formatTime24(h.openTime, locale)} – ${formatTime24(h.closeTime, locale)}`;
    if (current && current.label === label) {
      current.end = h.day;
    } else {
      current = { start: h.day, end: h.day, label };
      groups.push(current);
    }
  }
  return groups
    .map((g) => {
      const range = g.start === g.end ? g.start.slice(0, 3) : `${g.start.slice(0, 3)}–${g.end.slice(0, 3)}`;
      return `${range}: ${g.label}`;
    })
    .join(" · ");
}
