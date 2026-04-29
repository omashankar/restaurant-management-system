/**
 * Public Landing Page API
 * Path: /api/landing-page
 *
 * GET  — No auth. Returns full landing page content for the public site.
 *        Falls back to built-in defaults if DB has no document yet.
 *
 * POST — Super Admin only. Updates one or all sections.
 *        Body (single section): { section: "hero", data: { headline, ... } }
 *        Body (full replace):   { replace: true, content: { hero, features, ... } }
 *
 * Example GET response:
 * {
 *   "success": true,
 *   "content": {
 *     "hero":         { "headline": "...", "subheadline": "...", "ctaPrimary": "...", "ctaSecondary": "...", "badge": "..." },
 *     "features":     [{ "id": "pos", "icon": "CreditCard", "title": "POS System", "description": "..." }],
 *     "roles":        [{ "id": "admin", "role": "Admin", "description": "...", "permissions": [] }],
 *     "pricing":      [{ "id": "starter", "name": "Starter", "price": { "monthly": 29, "yearly": 23 }, ... }],
 *     "testimonials": [{ "id": "t1", "name": "Rahul Mehta", "role": "...", "quote": "..." }],
 *     "footer":       { "companyName": "Restaurant OS", "tagline": "...", "email": "...", "links": [] }
 *   },
 *   "updatedAt": "2026-04-21T10:00:00.000Z",
 *   "source": "database"
 * }
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { revalidatePath, revalidateTag } from "next/cache";

/* ─────────────────────────────────────────
   MOCK / DEFAULT DATA
   Used when no DB document exists yet.
   This is the single source of truth for
   the landing page structure.
───────────────────────────────────────── */
const DEFAULTS = {
  hero: {
    badge:        "Built for modern restaurants",
    headline:     "All-in-One Restaurant Management System",
    subheadline:  "Manage billing, inventory, staff, and analytics from one powerful platform — built for speed, simplicity, and scale.",
    ctaPrimary:   "Start Free Trial",
    ctaSecondary: "Book a Demo",
  },

  features: [
    { id: "pos",          icon: "CreditCard",    title: "POS System",              description: "Dine-in, Takeaway, and Delivery with smooth checkout flow."          },
    { id: "menu",         icon: "LayoutGrid",    title: "Menu Management",         description: "Organize Categories, Items, and Recipes with quick updates."         },
    { id: "inventory",    icon: "PackageSearch", title: "Inventory",               description: "Track stock levels with low-stock and out-of-stock alerts."          },
    { id: "tables",       icon: "Table2",        title: "Table Management",        description: "View table availability, occupancy, and live service status."        },
    { id: "reservations", icon: "CalendarClock", title: "Reservations",            description: "Manage booking schedules and reduce overbooking conflicts."          },
    { id: "staff",        icon: "Users",         title: "Staff & Role Management", description: "Assign roles and keep operations controlled by permissions."         },
    { id: "customers",    icon: "UserRoundCheck",title: "Customer Management",     description: "Store customer history and improve repeat experience quality."       },
    { id: "analytics",    icon: "BarChart3",     title: "Analytics & Reports",     description: "Get insights for sales, orders, and operational efficiency."        },
  ],

  roles: [
    { id: "admin",   role: "Admin",   icon: "ShieldCheck",  description: "Full control over modules, settings, and user access.",    permissions: ["Full system access", "Manage staff & roles", "View all reports", "Configure settings"] },
    { id: "manager", role: "Manager", icon: "ClipboardList",description: "Handles daily operations, reports, and team supervision.", permissions: ["Daily operations", "Staff supervision", "Sales reports", "Inventory oversight"]       },
    { id: "waiter",  role: "Waiter",  icon: "UtensilsCrossed", description: "Takes customer orders and manages table service quickly.", permissions: ["Take & manage orders", "Table service", "Customer requests", "Order status updates"]  },
    { id: "chef",    role: "Chef",    icon: "ChefHat",      description: "Tracks kitchen queue and prepares orders on time.",        permissions: ["Kitchen display queue", "Mark orders ready", "Prep time tracking", "Recipe access"]    },
  ],

  pricing: [
    {
      id: "starter", name: "Starter", price: { monthly: 29, yearly: 23 },
      description: "Perfect for a single-location restaurant getting started.",
      highlight: false, badge: null, cta: "Start Free Trial",
      features: [
        { text: "1 Restaurant location",      included: true  },
        { text: "POS & Order Management",     included: true  },
        { text: "Menu & Category Management", included: true  },
        { text: "Table Management",           included: true  },
        { text: "Basic Analytics",            included: true  },
        { text: "Inventory Management",       included: false },
        { text: "Staff Role Management",      included: false },
        { text: "Advanced Reports",           included: false },
        { text: "Priority Support",           included: false },
      ],
    },
    {
      id: "pro", name: "Pro", price: { monthly: 79, yearly: 63 },
      description: "For growing restaurants that need full operational control.",
      highlight: true, badge: "Most Popular", cta: "Start Free Trial",
      features: [
        { text: "Up to 3 Restaurant locations", included: true  },
        { text: "POS & Order Management",       included: true  },
        { text: "Menu & Category Management",   included: true  },
        { text: "Table Management",             included: true  },
        { text: "Advanced Analytics",           included: true  },
        { text: "Inventory Management",         included: true  },
        { text: "Staff Role Management",        included: true  },
        { text: "Advanced Reports",             included: true  },
        { text: "Priority Support",             included: false },
      ],
    },
    {
      id: "enterprise", name: "Enterprise", price: { monthly: 199, yearly: 159 },
      description: "For restaurant chains and franchises at scale.",
      highlight: false, badge: null, cta: "Contact Sales",
      features: [
        { text: "Unlimited locations",        included: true },
        { text: "POS & Order Management",     included: true },
        { text: "Menu & Category Management", included: true },
        { text: "Table Management",           included: true },
        { text: "Advanced Analytics",         included: true },
        { text: "Inventory Management",       included: true },
        { text: "Staff Role Management",      included: true },
        { text: "Advanced Reports",           included: true },
        { text: "Dedicated Support + SLA",    included: true },
      ],
    },
  ],

  testimonials: [
    { id: "t1", name: "Rahul Mehta",  role: "Operations Manager", quote: "RMS helped us reduce billing errors and speed up service during peak hours.",     avatar: "" },
    { id: "t2", name: "Nina D'Souza", role: "Restaurant Owner",   quote: "The interface is simple, and our whole team adopted it without training issues.", avatar: "" },
    { id: "t3", name: "Arjun Patel",  role: "Outlet Manager",     quote: "Inventory alerts and reporting made daily decisions much faster.",                avatar: "" },
  ],

  footer: {
    companyName: "Restaurant OS",
    tagline:     "All-in-one restaurant management platform built for modern operations.",
    email:       "support@restaurantos.com",
    phone:       "+1 (555) 000-0000",
    address:     "123 Main Street, City, Country",
    links: [
      { label: "Features",      href: "#features" },
      { label: "Pricing",       href: "#pricing"  },
      { label: "Privacy Policy",href: "#"         },
      { label: "Terms",         href: "#"         },
    ],
  },
};

const VALID_SECTIONS = Object.keys(DEFAULTS);

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/** Merge DB document over defaults — missing sections fall back to defaults */
function mergeWithDefaults(doc) {
  const content = {};
  for (const section of VALID_SECTIONS) {
    content[section] = doc?.[section] ?? DEFAULTS[section];
  }
  return content;
}

/* ─────────────────────────────────────────
   GET /api/landing-page
   Public — no authentication required.
   Returns full landing page content.
───────────────────────────────────────── */
export async function GET() {
  try {
    const client = await clientPromise;
    const db     = client.db();
    const doc    = await db.collection("landing_cms").findOne({ _id: "landing" });

    const content = mergeWithDefaults(doc);

    return Response.json({
      success:   true,
      content,
      updatedAt: doc?.updatedAt ?? null,
      source:    doc ? "database" : "defaults",
    });
  } catch (err) {
    /* DB unavailable — return defaults so the page still renders */
    console.error("GET /api/landing-page error:", err.message);
    return Response.json({
      success:   true,
      content:   mergeWithDefaults(null),
      updatedAt: null,
      source:    "defaults",
    });
  }
}

/* ─────────────────────────────────────────
   POST /api/landing-page
   Super Admin only.

   Two modes:
   1. Update one section:
      { "section": "hero", "data": { "headline": "New headline", ... } }

   2. Replace all content at once:
      { "replace": true, "content": { "hero": {...}, "features": [...], ... } }

   Example responses:
   { "success": true, "section": "hero", "updatedAt": "2026-04-21T..." }
   { "success": true, "replaced": true,  "updatedAt": "2026-04-21T..." }
───────────────────────────────────────── */
export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json(
      { success: false, error: "Forbidden. Super Admin access required." },
      { status: 403 }
    );
  }

  let body;
  try { body = await request.json(); }
  catch {
    return Response.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  /* ── Mode 2: full replace ── */
  if (body.replace === true) {
    if (!body.content || typeof body.content !== "object") {
      return Response.json(
        { success: false, error: "content object is required when replace is true." },
        { status: 400 }
      );
    }

    try {
      const client = await clientPromise;
      const db     = client.db();

      await db.collection("landing_cms").replaceOne(
        { _id: "landing" },
        { _id: "landing", ...body.content, updatedAt: new Date() },
        { upsert: true }
      );

      revalidateTag("landing");
      revalidatePath("/");

      return Response.json({ success: true, replaced: true, updatedAt: new Date() });
    } catch (err) {
      console.error("POST /api/landing-page (replace) error:", err.message);
      return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
    }
  }

  /* ── Mode 1: update one section ── */
  const { section, data } = body;

  if (!section) {
    return Response.json(
      { success: false, error: "section is required. Valid values: " + VALID_SECTIONS.join(", ") },
      { status: 400 }
    );
  }

  if (!VALID_SECTIONS.includes(section)) {
    return Response.json(
      { success: false, error: `"${section}" is not a valid section. Valid: ${VALID_SECTIONS.join(", ")}.` },
      { status: 400 }
    );
  }

  if (data == null) {
    return Response.json(
      { success: false, error: "data is required." },
      { status: 400 }
    );
  }

  /* Basic type validation */
  const isArray   = ["features", "roles", "pricing", "testimonials"].includes(section);
  const isObject  = ["hero", "footer"].includes(section);

  if (isArray && !Array.isArray(data)) {
    return Response.json(
      { success: false, error: `"${section}" must be an array.` },
      { status: 422 }
    );
  }
  if (isObject && (typeof data !== "object" || Array.isArray(data))) {
    return Response.json(
      { success: false, error: `"${section}" must be an object.` },
      { status: 422 }
    );
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    await db.collection("landing_cms").updateOne(
      { _id: "landing" },
      { $set: { [section]: data, updatedAt: new Date() } },
      { upsert: true }
    );

    revalidateTag("landing");
    revalidatePath("/");

    return Response.json({ success: true, section, updatedAt: new Date() });
  } catch (err) {
    console.error("POST /api/landing-page error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
