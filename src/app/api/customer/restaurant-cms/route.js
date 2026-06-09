/**
 * GET /api/customer/restaurant-cms
 * Public endpoint — no auth required.
 * Returns restaurant CMS content for customer site.
 */

import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { getRestaurantCmsContent } from "@/lib/restaurantCmsService";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: true, content: DEFAULTS });
    }
    const { content } = await getRestaurantCmsContent(restaurantId);
    return Response.json({ success: true, content }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("customer.restaurant-cms.GET failed:", err.message);
    return Response.json({ success: true, content: DEFAULTS });
  }
}
