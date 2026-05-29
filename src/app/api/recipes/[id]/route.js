import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function ingredientsPreview(ingredients = []) {
  const ing = ingredients.filter(Boolean);
  if (ing.length === 0) return "—";
  const preview = ing.slice(0, 2).join(", ");
  return ing.length > 2 ? `${preview}…` : preview;
}

/* PATCH /api/recipes/:id */
export async function PATCH(request, { params }) {
  const { id } = await params;
  return withTenant(
    ["admin", "manager"],
    async ({ db, tenantFilter }) => {
      const _id = toObjectId(id);
      if (!_id) {
        return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
      }

      const body = await request.json();
      const update = { updatedAt: new Date() };

      if (body.name?.trim()) update.name = body.name.trim();
      if (Array.isArray(body.ingredients)) {
        const ingredients = body.ingredients
          .map((s) => String(s).trim())
          .filter(Boolean);
        update.ingredients = ingredients;
        update.ingredientsPreview = ingredientsPreview(ingredients);
      }
      if (body.steps != null) update.steps = String(body.steps).trim();

      if (body.menuItemId) {
        try {
          const mi = await db.collection("menuItems").findOne({
            ...tenantFilter,
            _id: new ObjectId(body.menuItemId),
          });
          if (!mi) {
            return Response.json(
              { success: false, error: "Menu item not found." },
              { status: 400 }
            );
          }
          update.menuItemId = body.menuItemId;
          update.menuItemName = mi.name;
        } catch {
          return Response.json(
            { success: false, error: "Invalid menu item." },
            { status: 400 }
          );
        }
      }

      const result = await db.collection("recipes").updateOne(
        { ...tenantFilter, _id },
        { $set: update }
      );

      if (result.matchedCount === 0) {
        return Response.json({ success: false, error: "Recipe not found." }, { status: 404 });
      }

      return Response.json({ success: true });
    }
  )(request);
}

/* DELETE /api/recipes/:id */
export async function DELETE(request, { params }) {
  const { id } = await params;
  return withTenant(
    ["admin", "manager"],
    async ({ db, tenantFilter }) => {
      const _id = toObjectId(id);
      if (!_id) {
        return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
      }

      const result = await db.collection("recipes").deleteOne({ ...tenantFilter, _id });
      if (result.deletedCount === 0) {
        return Response.json({ success: false, error: "Recipe not found." }, { status: 404 });
      }

      return Response.json({ success: true });
    }
  )(request);
}
