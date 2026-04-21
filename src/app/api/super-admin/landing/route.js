import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

const DEFAULTS = {
  hero: {
    headline:    "The All-in-One Restaurant Management Platform",
    subheadline: "Streamline operations, manage staff, and grow your restaurant business.",
    ctaText:     "Get Started Free",
    ctaUrl:      "/signup",
    imageUrl:    "",
  },
  features: [
    { icon: "🍽️", title: "Menu Management",    description: "Create and manage your full menu with categories, pricing, and photos." },
    { icon: "📦", title: "Order Tracking",      description: "Real-time order management from table to kitchen to delivery." },
    { icon: "👥", title: "Staff Management",    description: "Manage roles, shifts, and permissions for your entire team." },
    { icon: "📊", title: "Analytics",           description: "Detailed reports on revenue, orders, and customer trends." },
    { icon: "🪑", title: "Table Reservations",  description: "Online booking system with floor plan management." },
    { icon: "💳", title: "POS Integration",     description: "Seamless point-of-sale system built for restaurants." },
  ],
  pricing: {
    headline:    "Simple, Transparent Pricing",
    subheadline: "Choose the plan that fits your restaurant. Upgrade or downgrade anytime.",
  },
  contact: {
    email:   "support@rms.com",
    phone:   "+1 (555) 000-0000",
    address: "123 Main Street, City, Country",
    mapUrl:  "",
  },
  footer: {
    companyName: "RMS Platform",
    tagline:     "Built for restaurants, by restaurant people.",
    links: [
      { label: "Privacy Policy", url: "/privacy" },
      { label: "Terms of Service", url: "/terms" },
    ],
  },
};

/* ── GET /api/super-admin/landing ── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    const doc = await db.collection("landing").findOne({ _id: "site" });

    const content = {};
    for (const section of Object.keys(DEFAULTS)) {
      content[section] = doc?.[section] ?? DEFAULTS[section];
    }

    return Response.json({ success: true, content });
  } catch (err) {
    console.error("GET landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── PATCH /api/super-admin/landing
   Body: { section: "hero"|"features"|"pricing"|"contact"|"footer", data: {...} }
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
  if (!data) return Response.json({ success: false, error: "data is required." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    await db.collection("landing").updateOne(
      { _id: "site" },
      { $set: { [section]: data, updatedAt: new Date() } },
      { upsert: true }
    );

    return Response.json({ success: true, section });
  } catch (err) {
    console.error("PATCH landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
