import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const filter = { ...tenantFilter };
    if (q) filter.$or = [
      { name:  { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
    const customers = await db.collection("customers").find(filter).sort({ name: 1 }).limit(100).toArray();
    return Response.json({ success: true, customers: customers.map((c) => ({ ...c, id: c._id.toString(), _id: undefined })) });
  }
);

export const POST = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter, payload }, request) => {
    const { name, phone, email, notes } = await request.json();
    if (!name?.trim() || !phone?.trim()) return Response.json({ success: false, error: "name and phone are required." }, { status: 400 });

    // Duplicate phone check within restaurant
    const existing = await db.collection("customers").findOne({ ...tenantFilter, phone: phone.trim() });
    if (existing) return Response.json({ success: false, error: "Customer with this phone already exists." }, { status: 409 });

    const doc = { ...tenantFilter, name: name.trim(), phone: phone.trim(), email: email ?? "", notes: notes ?? "", visits: 0, orderHistory: [], lastVisit: null, createdBy: new ObjectId(payload.id), createdAt: new Date() };
    const result = await db.collection("customers").insertOne(doc);
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  }
);
