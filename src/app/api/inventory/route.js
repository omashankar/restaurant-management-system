import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request) => {
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
    const body = await request.json();
    const { name, category, quantity, unit, reorderLevel, maxLevel, supplier, notes } = body;
    if (!name?.trim()) return Response.json({ success: false, error: "name is required." }, { status: 400 });
    const qty = Math.max(0, Number(quantity) || 0);
    const doc = {
      ...tenantFilter,
      name: name.trim(),
      category: category?.trim() ?? "Other",
      quantity: qty,
      unit: unit?.trim() || "unit",
      reorderLevel: Math.max(0, Number(reorderLevel) || 0),
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
