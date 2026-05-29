/**
 * GET  /api/restaurant-cms  — Load CMS content (admin)
 * PATCH /api/restaurant-cms  — Save a section (admin)
 */

import { withTenant } from "@/lib/tenantDb";
import {
  getRestaurantCmsAdminContent,
  publishAllDrafts,
  publishSection,
  saveSection,
  VALID_SECTIONS,
} from "@/lib/restaurantCmsService";

export const GET = withTenant(["admin"], async ({ restaurantId }) => {
  const { content, published, draftSections, updatedAt } =
    await getRestaurantCmsAdminContent(restaurantId);
  return Response.json({
    success: true,
    content,
    published,
    draftSections,
    updatedAt,
  });
});

export const PATCH = withTenant(["admin"], async ({ restaurantId }, request) => {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { section, data, asDraft } = body;
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
    const result = await saveSection(restaurantId, section, data, { asDraft: !!asDraft });
    return Response.json({ success: true, ...result });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.status ?? 500 });
  }
});

export const POST = withTenant(["admin"], async ({ restaurantId }, request) => {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { action, section } = body;
  if (action !== "publish") {
    return Response.json({ success: false, error: "Unknown action." }, { status: 400 });
  }

  try {
    if (section) {
      if (!VALID_SECTIONS.includes(section)) {
        return Response.json({ success: false, error: "Invalid section." }, { status: 400 });
      }
      const result = await publishSection(restaurantId, section);
      return Response.json({ success: true, ...result });
    }
    const result = await publishAllDrafts(restaurantId);
    return Response.json({ success: true, ...result });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.status ?? 500 });
  }
});
