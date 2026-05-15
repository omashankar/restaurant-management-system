/**
 * restaurantResolver.js
 *
 * Multi-restaurant support ke liye central resolver.
 *
 * Priority order:
 *  1. Request header `x-restaurant-slug`  (middleware ne set kiya)
 *  2. NEXT_PUBLIC_RESTAURANT_ID env var    (single-tenant deployment)
 *  3. Database ka pehla active restaurant  (fallback)
 */

import { ObjectId } from "mongodb";

/**
 * Slug se restaurant ID resolve karta hai.
 * Result ko in-memory cache mein rakhta hai (5 min TTL) taaki DB hits kam hon.
 */
const slugCache = new Map(); // slug -> { id: ObjectId, expiresAt: number }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function resolveBySlug(db, slug) {
  const now = Date.now();
  const cached = slugCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.id;

  const restaurant = await db.collection("restaurants").findOne(
    { slug: slug.toLowerCase(), status: "active" },
    { projection: { _id: 1 } }
  );

  if (!restaurant) return null;

  slugCache.set(slug, { id: restaurant._id, expiresAt: now + CACHE_TTL_MS });
  return restaurant._id;
}

/**
 * Main function — request aur db se restaurant ObjectId nikalta hai.
 *
 * Priority order:
 *  1. Request header `x-restaurant-slug`  (middleware rewrite se — server-side page render)
 *  2. Request cookie `x-restaurant-slug`  (browser fetch calls ke liye — client-side)
 *  3. NEXT_PUBLIC_RESTAURANT_ID env var    (single-tenant deployment)
 *  4. Database ka pehla active restaurant  (fallback)
 *
 * @param {import("mongodb").Db} db
 * @param {Request} request
 * @returns {Promise<ObjectId|null>}
 */
export async function getRestaurantIdFromRequest(db, request) {
  if (request) {
    // 1. Header se check karo (server-side page render mein middleware set karta hai)
    const headerSlug = request.headers.get("x-restaurant-slug");
    if (headerSlug) {
      const id = await resolveBySlug(db, headerSlug);
      if (id) return id;
    }

    // 2. Cookie se check karo (browser fetch calls ke liye)
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookieSlug = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("x-restaurant-slug="))
      ?.split("=")[1]
      ?.trim();

    if (cookieSlug) {
      const id = await resolveBySlug(db, decodeURIComponent(cookieSlug));
      if (id) return id;
    }
  }

  // 3. Env var se hardcoded ID check karo (single-tenant / legacy)
  const envId = process.env.NEXT_PUBLIC_RESTAURANT_ID?.trim();
  if (envId) {
    try {
      return new ObjectId(envId);
    } catch {
      // malformed env, fallback karo
    }
  }

  // 4. Database ka pehla active restaurant
  const restaurant = await db.collection("restaurants").findOne(
    { status: "active" },
    { sort: { createdAt: 1 }, projection: { _id: 1 } }
  );
  return restaurant?._id ?? null;
}

/**
 * Cache invalidate karo jab restaurant update ho.
 * @param {string} slug
 */
export function invalidateRestaurantSlugCache(slug) {
  if (slug) slugCache.delete(slug.toLowerCase());
}
