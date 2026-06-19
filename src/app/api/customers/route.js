import { withTenant } from "@/lib/tenantDb";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { parseSchema, customerUpsertSchema } from "@/lib/validationSchemas";
import { assertRealEmail, realEmailErrorResponse } from "@/lib/realEmailValidation";
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
    const body = await request.json();
    let data;
    try {
      data = parseSchema(customerUpsertSchema, body);
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }

    const phoneStored = extractIndianMobileDigits(data.phone);

    if (data.email) {
      try {
        await assertRealEmail(data.email);
      } catch (err) {
        const res = realEmailErrorResponse(err);
        if (res) return res;
        throw err;
      }
    }

    const existing = await db.collection("customers").findOne({ ...tenantFilter, phone: phoneStored });
    if (existing) return Response.json({ success: false, error: "Customer with this phone already exists." }, { status: 409 });

    const doc = {
      ...tenantFilter,
      name: data.name,
      phone: phoneStored,
      email: data.email ?? "",
      notes: data.notes ?? "",
      visits: 0,
      orderHistory: [],
      lastVisit: null,
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };
    const result = await db.collection("customers").insertOne(doc);
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  }
);
