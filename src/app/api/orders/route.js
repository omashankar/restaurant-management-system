import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

/* GET /api/orders */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filter = { ...tenantFilter };
    if (status && status !== "all") filter.status = status;

    const orders = await db.collection("orders")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return Response.json({
      success: true,
      orders: orders.map((o) => ({ ...o, id: o._id.toString(), _id: undefined })),
    });
  }
);

/* POST /api/orders — create order */
export const POST = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter, restaurantId, payload }, request) => {
    const body = await request.json();
    const { items, orderType, tableNumber, customer, notes } = body;

    if (!items?.length || !orderType) {
      return Response.json({ success: false, error: "items and orderType are required." }, { status: 400 });
    }

    const total = items.reduce((s, i) => s + (i.price * i.qty), 0);
    const orderId = `ORD-${Date.now()}`;

    const doc = {
      ...tenantFilter,
      orderId,
      items,
      orderType,
      tableNumber: tableNumber ?? null,
      customer: customer?.trim() || "Walk-in",
      notes: notes?.trim() ?? "",
      total,
      status: "new",
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(doc);
    return Response.json({
      success: true,
      order: { ...doc, id: result.insertedId.toString(), _id: undefined },
    }, { status: 201 });
  }
);
