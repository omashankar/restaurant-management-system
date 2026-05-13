/**
 * PATCH /api/refund-requests/[id]  — approve / reject a refund
 */
import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const PATCH = withTenant(["admin", "manager"], async ({ db, restaurantId }, request, { params }) => {
  const { id } = params;
  const body = await request.json();
  const { action, adminNote } = body;

  if (!["approve", "reject"].includes(action)) {
    return Response.json({ success: false, error: "action must be approve or reject." }, { status: 400 });
  }

  let _id;
  try { _id = new ObjectId(id); } catch {
    return Response.json({ success: false, error: "Invalid id." }, { status: 400 });
  }

  const refund = await db.collection("refund_requests").findOne({ _id, restaurantId });
  if (!refund) {
    return Response.json({ success: false, error: "Refund request not found." }, { status: 404 });
  }
  if (refund.status !== "pending") {
    return Response.json({ success: false, error: "Refund already processed." }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  await db.collection("refund_requests").updateOne(
    { _id },
    {
      $set: {
        status: newStatus,
        adminNote: String(adminNote ?? "").trim(),
        processedAt: new Date(),
      },
    }
  );

  // If approved, mark order as refunded
  if (action === "approve") {
    await db.collection("orders").updateOne(
      { orderId: refund.orderId, restaurantId },
      { $set: { "payment.refundStatus": "refunded", "payment.refundAmount": refund.refundAmount, updatedAt: new Date() } }
    );
  }

  return Response.json({ success: true });
});
