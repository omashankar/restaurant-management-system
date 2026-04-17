import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function toObjectId(id) {
  try { return new ObjectId(id); }
  catch { return null; }
}

/* GET /api/menu/:id */
export async function GET(request, { params }) {
  const { id } = await params;
  return withTenant(
    ["admin", "manager", "waiter", "chef"],
    async ({ db, tenantFilter }) => {
      const _id = toObjectId(id);
      if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

      const item = await db.collection("menuItems").findOne({ ...tenantFilter, _id });
      if (!item) return Response.json({ success: false, error: "Item not found." }, { status: 404 });

      return Response.json({ success: true, item: { ...item, id: item._id.toString(), _id: undefined } });
    }
  )(request);
}

/* PATCH /api/menu/:id — update */
export async function PATCH(request, { params }) {
  const { id } = await params;
  return withTenant(
    ["admin", "manager"],
    async ({ db, tenantFilter }) => {
      const _id = toObjectId(id);
      if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

      const body = await request.json();
      const update = {};

      if (body.name)          update.name         = body.name.trim();
      if (body.price != null) update.price         = Number(body.price);
      if (body.categoryId)    update.categoryId    = body.categoryId;
      if (body.categoryName)  update.categoryName  = body.categoryName;
      if (body.description != null) update.description = body.description.trim();
      if (body.status)        update.status        = body.status;
      if (body.itemType)      update.itemType      = body.itemType;
      if (body.kitchenType)   update.kitchenType   = body.kitchenType;
      if (body.prepTime != null) update.prepTime   = body.prepTime;
      if ("image" in body)    update.image         = body.image;
      update.updatedAt = new Date();

      const result = await db.collection("menuItems").updateOne(
        { ...tenantFilter, _id },
        { $set: update }
      );

      if (result.matchedCount === 0) {
        return Response.json({ success: false, error: "Item not found." }, { status: 404 });
      }

      return Response.json({ success: true });
    }
  )(request);
}

/* PUT /api/menu/:id — full replace (alias for PATCH) */
export async function PUT(request, { params }) {
  return PATCH(request, { params });
}

/* DELETE /api/menu/:id */
export async function DELETE(request, { params }) {
  const { id } = await params;
  return withTenant(
    ["admin", "manager"],
    async ({ db, tenantFilter }) => {
      const _id = toObjectId(id);
      if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

      // Get item before delete (for category count update)
      const item = await db.collection("menuItems").findOne(
        { ...tenantFilter, _id },
        { projection: { categoryId: 1 } }
      );

      if (!item) return Response.json({ success: false, error: "Item not found." }, { status: 404 });

      await db.collection("menuItems").deleteOne({ ...tenantFilter, _id });

      // Decrement category item count
      if (item.categoryId) {
        try {
          const catId = toObjectId(item.categoryId);
          if (catId) {
            await db.collection("categories").updateOne(
              { ...tenantFilter, _id: catId },
              { $inc: { itemCount: -1 } }
            );
          }
        } catch { /* non-fatal */ }
      }

      return Response.json({ success: true, message: "Item deleted successfully." });
    }
  )(request);
}
