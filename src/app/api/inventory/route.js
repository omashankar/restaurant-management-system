import { withTenant } from "@/lib/tenantDb";
import { assertPlatformFeatureForPath } from "@/lib/platformFeatureGuard";
import { parseSchema, inventoryItemSchema } from "@/lib/validationSchemas";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request) => {
    const blocked = await assertPlatformFeatureForPath("/api/inventory", db);
    if (blocked) return blocked;
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") ?? "1000", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 5000) : 1000;

    const items = await db.collection("inventory")
      .find(tenantFilter)
      .sort({ name: 1 })
      .limit(limit)
      .toArray();
    return Response.json({ success: true, items: items.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })) });
  }
);

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request) => {
    const blocked = await assertPlatformFeatureForPath("/api/inventory", db);
    if (blocked) return blocked;

    const body = await request.json();
    let data;
    try {
      data = parseSchema(inventoryItemSchema, {
        name: body.name,
        category: body.category,
        quantity: body.quantity != null ? Math.max(0, Number(body.quantity) || 0) : 0,
        unit: body.unit,
        reorderLevel: body.reorderLevel != null ? Math.max(0, Number(body.reorderLevel) || 0) : 0,
        supplier: body.supplier,
        notes: body.notes,
      });
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }
    const { name, category, unit, supplier, notes } = data;
    const qty = data.quantity ?? 0;
    const reorderLevel = data.reorderLevel ?? 0;
    const { maxLevel } = body;
    const doc = {
      ...tenantFilter,
      name,
      category: category?.trim() ?? "Other",
      quantity: qty,
      unit,
      reorderLevel,
      maxLevel: maxLevel != null && maxLevel !== "" ? String(maxLevel) : "",
      supplier: supplier?.trim() ?? "",
      notes: notes?.trim() ?? "",
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };
    const result = await db.collection("inventory").insertOne(doc);

    if (qty > 0) {
      await db.collection("inventoryHistory").insertOne({
        ...tenantFilter,
        itemId: result.insertedId.toString(),
        itemName: doc.name,
        delta: qty,
        message: `Initial stock · ${qty} ${doc.unit}`,
        createdBy: new ObjectId(payload.id),
        createdAt: new Date(),
      });
    }

    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  }
);
