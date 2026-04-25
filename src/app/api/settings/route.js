import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { withTenant } from "@/lib/tenantDb";

/* ── GET /api/settings ── */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, restaurantId }) => {
    const doc = await db
      .collection("restaurant_settings")
      .findOne({ restaurantId });

    // Merge stored values over empty defaults so shape is always complete
    const settings = {};
    for (const section of Object.keys(EMPTY_SETTINGS)) {
      settings[section] = {
        ...EMPTY_SETTINGS[section],
        ...(doc?.[section] ?? {}),
      };
    }

    return Response.json({ success: true, settings });
  }
);

/* ── PATCH /api/settings ── */
export const PATCH = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();

  // Accept either a full settings object or a single { section, data } patch
  let updateFields = {};

  if (body.section && body.data && typeof body.data === "object") {
    // Partial patch: { section: "general", data: { restaurantName: "..." } }
    const allowed = Object.keys(EMPTY_SETTINGS);
    if (!allowed.includes(body.section)) {
      return Response.json({ success: false, error: "Invalid section." }, { status: 400 });
    }
    updateFields[body.section] = body.data;
  } else {
    // Full settings object
    for (const section of Object.keys(EMPTY_SETTINGS)) {
      if (body[section]) updateFields[section] = body[section];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return Response.json({ success: false, error: "No valid data provided." }, { status: 400 });
  }

  updateFields.updatedAt = new Date();

  await db.collection("restaurant_settings").updateOne(
    { restaurantId },
    { $set: updateFields },
    { upsert: true }
  );

  return Response.json({ success: true });
});
