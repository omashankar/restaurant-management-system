import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const { name, description } = await request.json();
    if (!name?.trim()) return Response.json({ success: false, error: "Name is required." }, { status: 400 });

    await db.collection("categories").updateOne(filter, {
      $set: { name: name.trim(), description: description?.trim() ?? "", updatedAt: new Date() },
    });

    // Sync categoryName in menu items
    await db.collection("menuItems").updateMany(
      { ...tenantFilter, categoryId: params.id },
      { $set: { categoryName: name.trim() } }
    );

    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    await db.collection("categories").deleteOne(filter);
    // Unlink menu items
    await db.collection("menuItems").updateMany(
      { ...tenantFilter, categoryId: params.id },
      { $set: { categoryId: null, categoryName: "Uncategorized" } }
    );

    return Response.json({ success: true });
  }
);
