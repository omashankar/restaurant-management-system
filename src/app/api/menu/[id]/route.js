import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const item = await db.collection("menuItems").findOne(filter);
    if (!item) return Response.json({ success: false, error: "Item not found." }, { status: 404 });
    return Response.json({ success: true, item: { ...item, id: item._id.toString(), _id: undefined } });
  }
);

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    if (body.name) body.name = body.name.trim();
    if (body.price != null) body.price = Number(body.price);
    body.updatedAt = new Date();

    const result = await db.collection("menuItems").updateOne(filter, { $set: body });
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Item not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const item = await db.collection("menuItems").findOne(filter, { projection: { categoryId: 1 } });
    const result = await db.collection("menuItems").deleteOne(filter);
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Item not found." }, { status: 404 });

    // Decrement category count
    if (item?.categoryId) {
      await db.collection("categories").updateOne(
        { ...tenantFilter, _id: new ObjectId(item.categoryId).valueOf() },
        { $inc: { itemCount: -1 } }
      ).catch(() => {});
    }

    return Response.json({ success: true });
  }
);
