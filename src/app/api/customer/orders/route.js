import clientPromise from "@/lib/mongodb";
import { logError, logInfo } from "@/lib/logger";
import { customerCheckoutSchema, parseSchema } from "@/lib/validationSchemas";
import { ObjectId } from "mongodb";

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? "").trim(),
      price: Number(item.price ?? 0),
      qty: Number(item.qty ?? 0),
    }))
    .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0 && Number.isFinite(item.qty) && item.qty > 0);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseSchema(customerCheckoutSchema, body);
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  const items = normalizeItems(parsed.items);
  const orderType = parsed.orderType;
  const customerName = String(parsed.customer?.name ?? "").trim();
  const phone = String(parsed.customer?.phone ?? "").trim();
  const email = String(parsed.customer?.email ?? "").trim();
  const address = String(parsed.customer?.address ?? "").trim();
  const tableNumber = String(parsed.customer?.tableNumber ?? body.tableNumber ?? "").trim();
  const notes = String(parsed.notes ?? "").trim();

  if (orderType === "delivery" && !address) {
    return Response.json({ success: false, error: "Delivery address is required." }, { status: 400 });
  }
  if (orderType === "dine-in" && !tableNumber) {
    return Response.json({ success: false, error: "Table number is required for dine-in." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Public ordering currently targets the primary active restaurant.
    const restaurant = await db.collection("restaurants").findOne(
      { status: "active" },
      { sort: { createdAt: 1 }, projection: { _id: 1 } }
    );
    if (!restaurant?._id) {
      return Response.json({ success: false, error: "No active restaurant available for ordering." }, { status: 404 });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const now = new Date();

    const doc = {
      restaurantId: new ObjectId(restaurant._id),
      orderId: `ORD-C-${Date.now()}`,
      source: "customer",
      orderType,
      tableNumber: orderType === "dine-in" ? tableNumber : null,
      customer: customerName,
      customerInfo: {
        name: customerName,
        phone,
        email: email || null,
        address: orderType === "delivery" ? address : null,
      },
      items,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      tax,
      total,
      status: "new",
      notes,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("orders").insertOne(doc);
    if (orderType === "dine-in" && tableNumber) {
      await db.collection("tables").updateOne(
        { restaurantId: new ObjectId(restaurant._id), tableNumber },
        { $set: { status: "occupied", updatedAt: new Date() } }
      ).catch(() => {});
    }
    logInfo("customer.order.created", { route: "/api/customer/orders", orderId: doc.orderId });
    return Response.json({
      success: true,
      order: {
        id: result.insertedId.toString(),
        orderId: doc.orderId,
        total: doc.total,
        status: doc.status,
      },
    }, { status: 201 });
  } catch (err) {
    logError("customer.order.create_failed", err, { route: "/api/customer/orders" });
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
