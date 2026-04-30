/**
 * Landing Page CMS — Service Layer
 * ─────────────────────────────────
 * Collection : landing_cms
 * Document   : single doc, _id = "landing"
 *
 * Full MongoDB schema:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ _id          : "landing"   (string, singleton)                  │
 * │ version      : Number      (schema version for migrations)      │
 * │ navbar       : NavbarDoc                                        │
 * │ hero         : HeroDoc                                          │
 * │ features     : FeatureDoc[]                                     │
 * │ roles        : RoleDoc[]                                        │
 * │ pricing      : PlanDoc[]                                        │
 * │ testimonials : TestimonialDoc[]                                 │
 * │ about        : AboutDoc                                         │
 * │ contact      : ContactDoc                                       │
 * │ footer       : FooterDoc                                        │
 * │ seo          : SeoDoc                                           │
 * │ updatedAt    : Date                                             │
 * │ updatedBy    : string  (userId of last editor)                  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Sub-document shapes:
 *
 * NavbarDoc  { logo:{text,iconUrl}, links:[{label,href,external}], ctaPrimary:{label,href}, ctaSecondary:{label,href} }
 * HeroDoc    { badge, headline, subheadline, ctaPrimary, ctaSecondary, imageUrl, stats:[{value,label}] }
 * FeatureDoc { id, icon, title, description, order }
 * RoleDoc    { id, role, description, permissions:string[], icon, order }
 * PlanDoc    { id, name, slug, price:{monthly,yearly}, description, highlight, badge, cta, features:[{text,included}], order }
 * TestiDoc   { id, name, role, company, quote, avatar, rating, order }
 * AboutDoc   { headline, description, imageUrl, stats:[{value,label}], values:[{icon,title,description}] }
 * ContactDoc { email, phone, address, mapUrl, formEnabled }
 * FooterDoc  { companyName, tagline, email, phone, address, links:[{label,href}], social:[{platform,href,icon}] }
 * SeoDoc     { title, description, keywords, ogImage, twitterCard }
 */

import clientPromise from "./mongodb";

const DOC_ID     = "landing";
const COLLECTION = "landing_cms";
const VERSION    = 2;

/* ─────────────────────────────────────────
   DEFAULT CONTENT
   Used when no DB document exists yet.
   This is the single source of truth for
   the landing page structure.
───────────────────────────────────────── */
export const DEFAULTS = {
  version: VERSION,

  navbar: {
    logo: { text: "Restaurant OS", iconUrl: "" },
    links: [
      { label: "Features",     href: "#features",    external: false },
      { label: "How It Works", href: "#how-it-works",external: false },
      { label: "Pricing",      href: "#pricing",     external: false },
      { label: "Demo",         href: "#demo",        external: false },
      { label: "Contact",      href: "#contact",     external: false },
    ],
    ctaPrimary:   { label: "Get Started", href: "/signup" },
    ctaSecondary: { label: "Login",       href: "/login"  },
  },

  hero: {
    badge:        "Built for modern restaurants",
    headline:     "All-in-One Restaurant Management System",
    subheadline:  "Manage billing, inventory, staff, and analytics from one powerful platform — built for speed, simplicity, and scale.",
    ctaPrimary:   "Start Free Trial",
    ctaSecondary: "Book a Demo",
    imageUrl:     "",
    stats: [
      { value: "500+",   label: "Restaurants onboarded" },
      { value: "15 min", label: "Avg. setup time"        },
      { value: "99.9%",  label: "Uptime SLA"             },
    ],
  },

  features: [
    { id: "pos",          order: 1, icon: "CreditCard",    title: "POS System",              description: "Dine-in, Takeaway, and Delivery with smooth checkout flow."          },
    { id: "menu",         order: 2, icon: "LayoutGrid",    title: "Menu Management",         description: "Organize Categories, Items, and Recipes with quick updates."         },
    { id: "inventory",    order: 3, icon: "PackageSearch", title: "Inventory",               description: "Track stock levels with low-stock and out-of-stock alerts."          },
    { id: "tables",       order: 4, icon: "Table2",        title: "Table Management",        description: "View table availability, occupancy, and live service status."        },
    { id: "reservations", order: 5, icon: "CalendarClock", title: "Reservations",            description: "Manage booking schedules and reduce overbooking conflicts."          },
    { id: "staff",        order: 6, icon: "Users",         title: "Staff & Role Management", description: "Assign roles and keep operations controlled by permissions."         },
    { id: "customers",    order: 7, icon: "UserRoundCheck",title: "Customer Management",     description: "Store customer history and improve repeat experience quality."       },
    { id: "analytics",    order: 8, icon: "BarChart3",     title: "Analytics & Reports",     description: "Get insights for sales, orders, and operational efficiency."        },
  ],

  roles: [
    { id: "admin",   order: 1, icon: "UserRoundCheck", role: "Admin",   description: "Full control over modules, settings, and user access.",    permissions: ["Full system access", "Manage staff & roles", "View all reports", "Configure settings"] },
    { id: "manager", order: 2, icon: "Users",          role: "Manager", description: "Handles daily operations, reports, and team supervision.", permissions: ["Daily operations", "Staff supervision", "Sales reports", "Inventory oversight"]       },
    { id: "waiter",  order: 3, icon: "ClipboardList",  role: "Waiter",  description: "Takes customer orders and manages table service quickly.", permissions: ["Take & manage orders", "Table service", "Customer requests", "Order status updates"]  },
    { id: "chef",    order: 4, icon: "ChefHat",        role: "Chef",    description: "Tracks kitchen queue and prepares orders on time.",        permissions: ["Kitchen display queue", "Mark orders ready", "Prep time tracking", "Recipe access"]    },
  ],

  pricing: [
    {
      id: "starter", order: 1, name: "Starter", slug: "starter",
      price: { monthly: 29, yearly: 23 },
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
      id: "pro", order: 2, name: "Pro", slug: "pro",
      price: { monthly: 79, yearly: 63 },
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
      id: "enterprise", order: 3, name: "Enterprise", slug: "enterprise",
      price: { monthly: 199, yearly: 159 },
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
    { id: "t1", order: 1, name: "Rahul Mehta",  role: "Operations Manager", company: "",  quote: "RMS helped us reduce billing errors and speed up service during peak hours.",     avatar: "", rating: 5 },
    { id: "t2", order: 2, name: "Nina D'Souza", role: "Restaurant Owner",   company: "",  quote: "The interface is simple, and our whole team adopted it without training issues.", avatar: "", rating: 5 },
    { id: "t3", order: 3, name: "Arjun Patel",  role: "Outlet Manager",     company: "",  quote: "Inventory alerts and reporting made daily decisions much faster.",                avatar: "", rating: 5 },
  ],

  about: {
    headline:    "Built by people who understand restaurants",
    description: "Restaurant OS was built to solve the real operational chaos that restaurant owners face every day — from missed orders to inventory surprises. We built one platform that handles it all.",
    imageUrl:    "",
    stats: [
      { value: "500+",   label: "Restaurants onboarded" },
      { value: "15 min", label: "Average setup time"    },
      { value: "99.9%",  label: "Uptime SLA"            },
      { value: "60%",    label: "Billing time saved"    },
    ],
    values: [
      { icon: "Zap",        title: "Speed",      description: "Every feature is optimised for busy service hours." },
      { icon: "Shield",     title: "Reliability",description: "99.9% uptime so your team is never blocked."       },
      { icon: "Users",      title: "Team-first", description: "Role-based access keeps every team member focused." },
    ],
  },

  contact: {
    email:       "support@restaurantos.com",
    phone:       "+1 (555) 000-0000",
    address:     "123 Main Street, City, Country",
    mapUrl:      "",
    formEnabled: true,
  },

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
    social: [
      { platform: "twitter",  href: "#", icon: "MessageSquare" },
      { platform: "linkedin", href: "#", icon: "Globe"         },
      { platform: "github",   href: "#", icon: "Code2"         },
    ],
  },

  seo: {
    title:       "Restaurant OS — All-in-One Restaurant Management System",
    description: "Manage billing, inventory, staff, and analytics from one powerful platform.",
    keywords:    "restaurant management, POS, inventory, staff management, SaaS",
    ogImage:     "",
    twitterCard: "summary_large_image",
  },

  brands: {
    eyebrow: "Trusted by",
    items: ["Urban Spoon", "Blue Fork", "TasteHub", "Mango Tree", "KitchenCraft"],
  },

  problemSolution: {
    problemEyebrow: "The Problem",
    problemTitle: "Running a restaurant is hard",
    problems: [
      "Managing orders manually causes delays and billing errors",
      "Inventory runs out unexpectedly during peak hours",
      "Staff coordination is messy without a clear system",
      "No visibility into daily sales or performance trends",
    ],
    solutionEyebrow: "The Solution",
    solutionTitle: "RMS handles it all",
    solutionDescription: "One platform for POS, inventory, tables, reservations, staff, and analytics.",
    solutionPoints: [
      "Reduce billing time by up to 60%",
      "Zero stock surprises with live alerts",
      "One screen for all order types",
      "Role-based access keeps teams focused",
      "Clean reports for faster decisions",
    ],
  },

  howItWorks: {
    eyebrow: "How It Works",
    title: "From setup to service in minutes",
    subtext: "Follow the same flow your team uses every day.",
    steps: [
      { n: "01", title: "Setup Restaurant", text: "Configure menu, pricing, taxes, and table layout in minutes.", icon: "LayoutGrid" },
      { n: "02", title: "Take Orders using POS", text: "Capture dine-in, takeaway, and delivery orders from one screen.", icon: "CreditCard" },
      { n: "03", title: "Kitchen prepares orders", text: "Route active orders to kitchen workflow without confusion.", icon: "ChefHat" },
      { n: "04", title: "Track inventory automatically", text: "Watch stock movement and low-stock alerts in real time.", icon: "PackageSearch" },
      { n: "05", title: "View reports & analytics", text: "Monitor sales and performance with clean visual dashboards.", icon: "BarChart3" },
    ],
  },

  benefits: {
    deviceBadge: "Works on all devices",
    deviceTitle: "Mobile-first, desktop-ready",
    deviceDescription: "Adaptive layout for desktop, tablet, and phone — fast and clean during busy service hours.",
    whyBadge: "Why RMS",
    whyTitle: "Built to save time daily",
    items: [
      "Reduce billing time by up to 60%",
      "Zero stock surprises with live alerts",
      "One screen for all order types",
      "Role-based access keeps teams focused",
      "Clean reports for faster decisions",
    ],
  },

  demo: {
    enabled: true,
    sectionId: "demo",
  },

  cta: {
    enabled: true,
    sectionId: "cta",
  },
};

export const VALID_SECTIONS = Object.keys(DEFAULTS).filter(k => k !== "version");

/* ─────────────────────────────────────────
   VALIDATORS
   Each returns null (ok) or an error string.
───────────────────────────────────────── */
const VALIDATORS = {
  navbar: (d) => {
    if (!d || typeof d !== "object")   return "navbar must be an object.";
    if (!d.logo?.text?.trim())         return "navbar.logo.text is required.";
    if (!Array.isArray(d.links))       return "navbar.links must be an array.";
    return null;
  },
  hero: (d) => {
    if (!d || typeof d !== "object")   return "hero must be an object.";
    if (!d.headline?.trim())           return "hero.headline is required.";
    return null;
  },
  features: (d) => {
    if (!Array.isArray(d))             return "features must be an array.";
    for (const f of d) {
      if (!f.title?.trim())            return "Each feature must have a title.";
    }
    return null;
  },
  roles: (d) => {
    if (!Array.isArray(d))             return "roles must be an array.";
    for (const r of d) {
      if (!r.role?.trim())             return "Each role must have a role name.";
    }
    return null;
  },
  pricing: (d) => {
    if (!Array.isArray(d))             return "pricing must be an array.";
    for (const p of d) {
      if (!p.name?.trim())             return "Each plan must have a name.";
      if (p.price?.monthly == null)    return "Each plan must have a monthly price.";
    }
    return null;
  },
  testimonials: (d) => {
    if (!Array.isArray(d))             return "testimonials must be an array.";
    for (const t of d) {
      if (!t.name?.trim())             return "Each testimonial must have a name.";
      if (!t.quote?.trim())            return "Each testimonial must have a quote.";
    }
    return null;
  },
  about: (d) => {
    if (!d || typeof d !== "object")   return "about must be an object.";
    if (!d.headline?.trim())           return "about.headline is required.";
    return null;
  },
  contact: (d) => {
    if (!d || typeof d !== "object")   return "contact must be an object.";
    if (!d.email?.trim())              return "contact.email is required.";
    return null;
  },
  footer: (d) => {
    if (!d || typeof d !== "object")   return "footer must be an object.";
    if (!d.companyName?.trim())        return "footer.companyName is required.";
    return null;
  },
  seo: (d) => {
    if (!d || typeof d !== "object")   return "seo must be an object.";
    return null;
  },
  brands: (d) => {
    if (!d || typeof d !== "object") return "brands must be an object.";
    if (!Array.isArray(d.items)) return "brands.items must be an array.";
    return null;
  },
  problemSolution: (d) => {
    if (!d || typeof d !== "object") return "problemSolution must be an object.";
    if (!Array.isArray(d.problems) || !Array.isArray(d.solutionPoints)) return "problemSolution lists must be arrays.";
    return null;
  },
  howItWorks: (d) => {
    if (!d || typeof d !== "object") return "howItWorks must be an object.";
    if (!Array.isArray(d.steps)) return "howItWorks.steps must be an array.";
    return null;
  },
  benefits: (d) => {
    if (!d || typeof d !== "object") return "benefits must be an object.";
    if (!Array.isArray(d.items)) return "benefits.items must be an array.";
    return null;
  },
  demo: (d) => {
    if (!d || typeof d !== "object") return "demo must be an object.";
    return null;
  },
  cta: (d) => {
    if (!d || typeof d !== "object") return "cta must be an object.";
    return null;
  },
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
async function getDb() {
  const client = await clientPromise;
  return client.db();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function deepMergeSection(defaultValue, storedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(storedValue) ? storedValue : defaultValue;
  }
  if (defaultValue && typeof defaultValue === "object") {
    const merged = { ...defaultValue };
    if (storedValue && typeof storedValue === "object" && !Array.isArray(storedValue)) {
      for (const key of Object.keys(defaultValue)) {
        merged[key] = deepMergeSection(defaultValue[key], storedValue[key]);
      }
      for (const key of Object.keys(storedValue)) {
        if (!(key in merged)) merged[key] = storedValue[key];
      }
    }
    return merged;
  }
  return storedValue == null ? defaultValue : storedValue;
}

/** Deep-merge DB document over defaults — missing sections fall back */
export function mergeWithDefaults(doc) {
  const content = {};
  for (const section of VALID_SECTIONS) {
    content[section] = deepMergeSection(DEFAULTS[section], doc?.[section]);
  }
  return content;
}

/* ─────────────────────────────────────────
   SERVICE METHODS
───────────────────────────────────────── */

/** Get the raw landing CMS document. Returns null if not found. */
export async function getLandingDoc() {
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ _id: DOC_ID });
}

/** Get full content merged with defaults. */
export async function getLandingContent() {
  const doc = await getLandingDoc();
  return {
    content:   mergeWithDefaults(doc),
    updatedAt: doc?.updatedAt ?? null,
    source:    doc ? "database" : "defaults",
  };
}

/** Get a single section. Returns section data or the default. */
export async function getSection(section) {
  if (!VALID_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`Invalid section "${section}".`), { status: 400 });
  }
  const doc = await getLandingDoc();
  return doc?.[section] ?? DEFAULTS[section];
}

/** Replace an entire section after validation. */
export async function replaceSection(section, data, updatedBy) {
  if (!VALID_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`Invalid section "${section}".`), { status: 400 });
  }
  const err = VALIDATORS[section]?.(data);
  if (err) throw Object.assign(new Error(err), { status: 422 });

  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { [section]: data, updatedAt: new Date(), updatedBy: updatedBy ?? null, version: VERSION } },
    { upsert: true }
  );
  return { section, updatedAt: new Date() };
}

/** Add a new item to an array section. Auto-assigns id and order. */
export async function addItem(section, item, updatedBy) {
  const ARRAY_SECTIONS = ["features", "roles", "pricing", "testimonials"];
  if (!ARRAY_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`"${section}" does not support individual items.`), { status: 400 });
  }

  const db  = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
  const arr = doc?.[section] ?? DEFAULTS[section];

  const newItem = {
    id:    generateId(),
    order: arr.length + 1,
    ...item,
  };
  const updated = [...arr, newItem];

  const err = VALIDATORS[section]?.(updated);
  if (err) throw Object.assign(new Error(err), { status: 422 });

  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { [section]: updated, updatedAt: new Date(), updatedBy: updatedBy ?? null } },
    { upsert: true }
  );
  return { item: newItem, updatedAt: new Date() };
}

/** Update a single item in an array section by id. */
export async function updateItem(section, itemId, patch, updatedBy) {
  const ARRAY_SECTIONS = ["features", "roles", "pricing", "testimonials"];
  if (!ARRAY_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`"${section}" does not support individual items.`), { status: 400 });
  }

  const db  = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
  const arr = doc?.[section] ?? DEFAULTS[section];

  const idx = arr.findIndex(x => x.id === itemId);
  if (idx === -1) {
    throw Object.assign(new Error(`Item "${itemId}" not found in ${section}.`), { status: 404 });
  }

  const updated = arr.map((x, i) => i === idx ? { ...x, ...patch, id: x.id } : x);
  const err = VALIDATORS[section]?.(updated);
  if (err) throw Object.assign(new Error(err), { status: 422 });

  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { [section]: updated, updatedAt: new Date(), updatedBy: updatedBy ?? null } }
  );
  return { item: updated[idx], updatedAt: new Date() };
}

/** Delete a single item from an array section by id. */
export async function deleteItem(section, itemId, updatedBy) {
  const ARRAY_SECTIONS = ["features", "roles", "pricing", "testimonials"];
  if (!ARRAY_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`"${section}" does not support individual items.`), { status: 400 });
  }

  const db  = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
  const arr = doc?.[section] ?? DEFAULTS[section];

  if (!arr.some(x => x.id === itemId)) {
    throw Object.assign(new Error(`Item "${itemId}" not found in ${section}.`), { status: 404 });
  }

  const updated = arr.filter(x => x.id !== itemId);

  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { [section]: updated, updatedAt: new Date(), updatedBy: updatedBy ?? null } }
  );
  return { deleted: itemId, updatedAt: new Date() };
}

/** Reorder items in an array section. ids = full ordered list. */
export async function reorderItems(section, ids, updatedBy) {
  const ARRAY_SECTIONS = ["features", "roles", "pricing", "testimonials"];
  if (!ARRAY_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`"${section}" does not support reordering.`), { status: 400 });
  }
  if (!Array.isArray(ids)) {
    throw Object.assign(new Error("ids must be an array."), { status: 400 });
  }

  const db  = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
  const arr = doc?.[section] ?? DEFAULTS[section];

  if (ids.length !== arr.length) {
    throw Object.assign(new Error("ids must include all items exactly once."), { status: 422 });
  }
  const currentIds = arr.map((x) => x.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw Object.assign(new Error("ids contains duplicates."), { status: 422 });
  }
  const validSet = new Set(currentIds);
  const allValid = ids.every((id) => validSet.has(id));
  if (!allValid) {
    throw Object.assign(new Error("ids contains unknown items."), { status: 422 });
  }

  const map       = Object.fromEntries(arr.map(x => [x.id, x]));
  const reordered = ids.map((id, i) => map[id] ? { ...map[id], order: i + 1 } : null).filter(Boolean);

  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { [section]: reordered, updatedAt: new Date(), updatedBy: updatedBy ?? null } }
  );
  return { section, count: reordered.length, updatedAt: new Date() };
}

/** Replace the entire landing document at once. */
export async function replaceAll(content, updatedBy) {
  const db = await getDb();
  await db.collection(COLLECTION).replaceOne(
    { _id: DOC_ID },
    { _id: DOC_ID, version: VERSION, ...content, updatedAt: new Date(), updatedBy: updatedBy ?? null },
    { upsert: true }
  );
  return { replaced: true, updatedAt: new Date() };
}
