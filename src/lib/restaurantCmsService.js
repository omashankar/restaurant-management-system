/**
 * Restaurant CMS Service
 * ─────────────────────
 * Collection : restaurant_cms
 * One document per restaurant (keyed by restaurantId)
 *
 * Sections:
 *  hero         - Customer site hero section
 *  announcement - Banner/offer strip
 *  about        - About section
 *  gallery      - Photo gallery
 *  social       - Social media links
 */

import clientPromise from "./mongodb";

const COLLECTION = "restaurant_cms";
const VERSION = 1;

export const DEFAULTS = {
  hero: {
    badge: "Chef Crafted · Fresh · Premium",
    headline: "Delicious Food, Delivered to Your Door",
    subheadline: "Explore our kitchen specials, book a table, or order for takeaway and delivery — all in one seamless experience.",
    ctaPrimaryLabel: "Order Now",
    ctaSecondaryLabel: "Book a Table",
    imageUrl: "",
  },
  announcement: {
    enabled: false,
    text: "🎉 Special offer today! Get 20% off on all orders above ₹500.",
    bgColor: "#FF6B35",
    textColor: "#ffffff",
    link: "",
    linkLabel: "",
  },
  about: {
    headline: "Our Story",
    description: "We started with a simple mission — to serve fresh, delicious food with warm hospitality. Every dish is crafted with love and the finest ingredients.",
    imageUrl: "",
    stats: [
      { value: "50+", label: "Menu Items" },
      { value: "4.9★", label: "Rating" },
      { value: "2K+", label: "Happy Customers" },
    ],
  },
  gallery: {
    enabled: true,
    title: "Our Gallery",
    images: [],
  },
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
    youtube: "",
  },
};

export const VALID_SECTIONS = Object.keys(DEFAULTS);

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

/** Get CMS doc for a restaurant */
export async function getRestaurantCmsDoc(restaurantId) {
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ restaurantId });
}

/** Get full content merged with defaults */
export async function getRestaurantCmsContent(restaurantId) {
  const doc = await getRestaurantCmsDoc(restaurantId);
  const content = {};
  for (const section of VALID_SECTIONS) {
    const def = DEFAULTS[section];
    const stored = doc?.[section] ?? null;
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      content[section] = { ...def, ...stored };
    } else if (Array.isArray(def)) {
      content[section] = Array.isArray(stored) ? stored : def;
    } else {
      content[section] = stored ?? def;
    }
  }
  return { content, updatedAt: doc?.updatedAt ?? null };
}

/** Save a single section */
export async function saveSection(restaurantId, section, data) {
  if (!VALID_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`Invalid section: ${section}`), { status: 400 });
  }
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { restaurantId },
    { $set: { [section]: data, updatedAt: new Date(), version: VERSION } },
    { upsert: true }
  );
  return { section, updatedAt: new Date() };
}
