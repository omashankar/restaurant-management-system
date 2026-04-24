/**
 * Landing Page CMS API
 *
 * MongoDB schema (single document, _id: "landing"):
 * {
 *   _id:          "landing",
 *   hero:         { headline, subheadline, ctaPrimary, ctaSecondary, badge },
 *   features:     [{ id, title, description, icon }],
 *   roles:        [{ id, role, description, permissions: [] }],
 *   pricing:      [{ id, name, price: {monthly,yearly}, description, highlight, badge, features: [{text,included}], cta }],
 *   testimonials: [{ id, name, role, quote, avatar }],
 *   footer:       { companyName, tagline, email, phone, address, links: [{label,href}] },
 *   updatedAt:    Date,
 * }
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { revalidatePath, revalidateTag } from "next/cache";

/* ── Auth guard ── */
function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ── Default content (used when no DB document exists yet) ── */
const DEFAULTS = {
  hero: {
    headline:      "All-in-One Restaurant Management System",
    subheadline:   "Manage billing, inventory, staff, and analytics from one powerful platform — built for speed, simplicity, and scale.",
    ctaPrimary:    "Start Free Trial",
    ctaSecondary:  "Book a Demo",
    badge:         "Built for modern restaurants",
  },
  features: [
    { id: "pos",        title: "POS System",              description: "Dine-in, Takeaway, and Delivery with smooth checkout flow.",          icon: "CreditCard"    },
    { id: "menu",       title: "Menu Management",         description: "Organize Categories, Items, and Recipes with quick updates.",         icon: "LayoutGrid"    },
    { id: "inventory",  title: "Inventory",               description: "Track stock levels with low-stock and out-of-stock alerts.",          icon: "PackageSearch" },
    { id: "tables",     title: "Table Management",        description: "View table availability, occupancy, and live service status.",        icon: "Table2"        },
    { id: "reservations",title: "Reservations",           description: "Manage booking schedules and reduce overbooking conflicts.",          icon: "CalendarClock" },
    { id: "staff",      title: "Staff & Role Management", description: "Assign roles and keep operations controlled by permissions.",         icon: "Users"         },
    { id: "customers",  title: "Customer Management",     description: "Store customer history and improve repeat experience quality.",       icon: "UserRoundCheck" },
    { id: "analytics",  title: "Analytics & Reports",     description: "Get insights for sales, orders, and operational efficiency.",        icon: "BarChart3"     },
  ],
  roles: [
    { id: "admin",   role: "Admin",   description: "Full control over modules, settings, and user access.",    permissions: ["Full system access", "Manage staff & roles", "View all reports", "Configure settings"] },
    { id: "manager", role: "Manager", description: "Handles daily operations, reports, and team supervision.", permissions: ["Daily operations", "Staff supervision", "Sales reports", "Inventory oversight"] },
    { id: "waiter",  role: "Waiter",  description: "Takes customer orders and manages table service quickly.", permissions: ["Take & manage orders", "Table service", "Customer requests", "Order status updates"] },
    { id: "chef",    role: "Chef",    description: "Tracks kitchen queue and prepares orders on time.",        permissions: ["Kitchen display queue", "Mark orders ready", "Prep time tracking", "Recipe access"] },
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
    { id: "t1", name: "Rahul Mehta",   role: "Operations Manager", quote: "RMS helped us reduce billing errors and speed up service during peak hours.",              avatar: "" },
    { id: "t2", name: "Nina D'Souza",  role: "Restaurant Owner",   quote: "The interface is simple, and our whole team adopted it without training issues.",          avatar: "" },
    { id: "t3", name: "Arjun Patel",   role: "Outlet Manager",     quote: "Inventory alerts and reporting made daily decisions much faster.",                         avatar: "" },
  ],
  footer: {
    companyName: "Restaurant OS",
    tagline:     "All-in-one restaurant management platform built for modern operations.",
    email:       "support@restaurantos.com",
    phone:       "+1 (555) 000-0000",
    address:     "123 Main Street, City, Country",
    links: [
      { label: "Features",     href: "#features"    },
      { label: "Pricing",      href: "#pricing"     },
      { label: "Privacy Policy",href: "#"           },
      { label: "Terms",        href: "#"            },
    ],
  },
};

/* ── GET /api/super-admin/landing
   Returns the full landing page content.
   Falls back to DEFAULTS for any missing section.
── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const client  = await clientPromise;
    const db      = client.db();
    const doc     = await db.collection("landing_cms").findOne({ _id: "landing" });

    /* Deep-merge stored values over defaults */
    const content = {};
    for (const section of Object.keys(DEFAULTS)) {
      content[section] = doc?.[section] ?? DEFAULTS[section];
    }

    return Response.json({ success: true, content, updatedAt: doc?.updatedAt ?? null });
  } catch (err) {
    console.error("GET landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── PATCH /api/super-admin/landing
   Updates a single section.
   Body: { section: "hero" | "features" | "roles" | "pricing" | "testimonials" | "footer", data: {...} }
── */
export async function PATCH(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { section, data } = body;
  const validSections = Object.keys(DEFAULTS);

  if (!section || !validSections.includes(section)) {
    return Response.json(
      { success: false, error: `Invalid section. Must be one of: ${validSections.join(", ")}.` },
      { status: 400 }
    );
  }
  if (data == null) {
    return Response.json({ success: false, error: "data is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    await db.collection("landing_cms").updateOne(
      { _id: "landing" },
      { $set: { [section]: data, updatedAt: new Date() } },
      { upsert: true }
    );

    /* Purge the public landing page cache immediately */
    revalidateTag("landing"); // invalidates the tagged fetch in page.jsx
    revalidatePath("/");      // also purge the page route cache

    return Response.json({ success: true, section, updatedAt: new Date() });
  } catch (err) {
    console.error("PATCH landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── PUT /api/super-admin/landing
   Replaces the entire landing page content at once.
   Body: full content object matching DEFAULTS shape.
── */
export async function PUT(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  try {
    const client = await clientPromise;
    const db     = client.db();

    await db.collection("landing_cms").replaceOne(
      { _id: "landing" },
      { _id: "landing", ...body, updatedAt: new Date() },
      { upsert: true }
    );

    revalidateTag("landing");
    revalidatePath("/");

    return Response.json({ success: true, updatedAt: new Date() });
  } catch (err) {
    console.error("PUT landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
