import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") ?? "80", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 80;

    const rows = await db.collection("inventoryHistory")
      .find(tenantFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return Response.json({
      success: true,
      history: rows.map((h) => ({
        id: h._id.toString(),
        itemId: h.itemId ?? "",
        itemName: h.itemName ?? "",
        delta: Number(h.delta ?? 0),
        message: h.message ?? "",
        createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
      })),
    });
  }
);

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request) => {
    const body = await request.json();
    const { itemId, itemName, delta, message } = body;
    if (!itemId || !itemName?.trim()) {
      return Response.json({ success: false, error: "itemId and itemName are required." }, { status: 400 });
    }

    const doc = {
      ...tenantFilter,
      itemId: String(itemId),
      itemName: itemName.trim(),
      delta: Number(delta) || 0,
      message: message?.trim() ?? "",
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };

    const result = await db.collection("inventoryHistory").insertOne(doc);
    return Response.json({
      success: true,
      entry: {
        id: result.insertedId.toString(),
        ...doc,
        createdAt: doc.createdAt.toISOString(),
      },
    }, { status: 201 });
  }
);
