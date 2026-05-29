import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function ingredientsPreview(ingredients = []) {
  const ing = ingredients.filter(Boolean);
  if (ing.length === 0) return "—";
  const preview = ing.slice(0, 2).join(", ");
  return ing.length > 2 ? `${preview}…` : preview;
}

function mapRecipe(doc) {
  return {
    ...doc,
    id: doc._id.toString(),
    _id: undefined,
  };
}

/* GET /api/recipes */
export const GET = withTenant(
  ["admin", "manager", "chef"],
  async ({ db, tenantFilter }) => {
    const recipes = await db
      .collection("recipes")
      .find(tenantFilter)
      .sort({ name: 1 })
      .toArray();

    return Response.json({
      success: true,
      recipes: recipes.map(mapRecipe),
    });
  }
);

/* POST /api/recipes */
export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request) => {
    const body = await request.json();
    const name = body.name?.trim();
    const menuItemId = body.menuItemId?.trim();
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const steps = body.steps?.trim() ?? "";

    if (!name) {
      return Response.json(
        { success: false, error: "Recipe name is required." },
        { status: 400 }
      );
    }
    if (!menuItemId) {
      return Response.json(
        { success: false, error: "Menu item is required." },
        { status: 400 }
      );
    }

    let menuItemName = body.menuItemName?.trim() ?? "";
    try {
      const mi = await db.collection("menuItems").findOne({
        ...tenantFilter,
        _id: new ObjectId(menuItemId),
      });
      if (!mi) {
        return Response.json(
          { success: false, error: "Menu item not found." },
          { status: 400 }
        );
      }
      menuItemName = mi.name;
    } catch {
      return Response.json(
        { success: false, error: "Invalid menu item." },
        { status: 400 }
      );
    }

    const doc = {
      ...tenantFilter,
      name,
      menuItemId,
      menuItemName,
      ingredients,
      ingredientsPreview: ingredientsPreview(ingredients),
      steps,
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("recipes").insertOne(doc);
    return Response.json(
      { success: true, recipe: mapRecipe({ ...doc, _id: result.insertedId }) },
      { status: 201 }
    );
  }
);
