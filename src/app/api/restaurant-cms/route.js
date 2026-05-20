/**
 * GET  /api/restaurant-cms  — Load CMS content (admin)
 * PATCH /api/restaurant-cms  — Save a section (admin)
 */

import { withTenant } from "@/lib/tenantDb";
import { getRestaurantCmsContent, saveSection, VALID_SECTIONS } from "@/lib/restaurantCmsService";

export const GET = withTenant(["admin"], async ({ restaurantId }) => {
  const { content, updatedAt } = await getRestaurantCmsContent(restaurantId);
  return Response.json({ success: true, content, updatedAt });
});

export const PATCH = withTenant(["admin"], async ({ restaurantId }, request) => {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { section, data } = body;
  if (!section || !VALID_SECTIONS.includes(section)) {
    return Response.json(
      { success: false, error: `Invalid section. Valid: ${VALID_SECTIONS.join(", ")}` },
      { status: 400 }
    );
  }
  if (data == null) {
    return Response.json({ success: false, error: "data is required." }, { status: 400 });
  }

  try {
    const result = await saveSection(restaurantId, section, data);
    return Response.json({ success: true, ...result });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.status ?? 500 });
  }
});
