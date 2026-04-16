import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

/* PATCH /api/tables/areas/:id */
export const PATCH = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const { name, description, color } = await request.json();
    if (!name?.trim()) return Response.json({ success: false, error: "Name is required." }, { status: 400 });

    const result = await db.collection("tableAreas").updateOne(filter, {
      $set: { name: name.trim(), description: description?.trim() ?? "", color: color ?? "emerald", updatedAt: new Date() },
    });

    if (result.matchedCount === 0) return Response.json({ success: false, error: "Area not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

/* DELETE /api/tables/areas/:id */
export const DELETE = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    await db.collection("tableAreas").deleteOne(filter);
    // Clear categoryId from tables using this area
    await db.collection("tables").updateMany(
      { ...tenantFilter, categoryId: params.id },
      { $set: { categoryId: null } }
    );

    return Response.json({ success: true });
  }
);
