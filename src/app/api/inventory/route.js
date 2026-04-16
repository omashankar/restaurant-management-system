import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }) => {
    const items = await db.collection("inventory").find(tenantFilter).sort({ name: 1 }).toArray();
    return Response.json({ success: true, items: items.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })) });
  }
);

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request) => {
    const body = await request.json();
    const { name, category, quantity, unit, reorderLevel, supplier, notes } = body;
    if (!name?.trim()) return Response.json({ success: false, error: "name is required." }, { status: 400 });
    const doc = { ...tenantFilter, name: name.trim(), category: category ?? "", quantity: quantity ?? 0, unit: unit ?? "unit", reorderLevel: reorderLevel ?? 0, supplier: supplier ?? "", notes: notes ?? "", createdBy: new ObjectId(payload.id), createdAt: new Date() };
    const result = await db.collection("inventory").insertOne(doc);
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  }
);
