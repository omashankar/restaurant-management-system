import clientPromise from "@/lib/mongodb";
import { getTenantContext } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export async function PATCH(request) {
  let ctx;
  try {
    ctx = await getTenantContext(request, ["admin", "manager", "waiter", "chef"]);
  } catch (err) {
    return Response.json({ success: false, error: err.message || "Forbidden." }, { status: err.status || 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const key = String(body?.key ?? "").trim();
  if (!key.startsWith("dinein:")) {
    return Response.json({ success: false, error: "This message cannot be resolved." }, { status: 400 });
  }
  const sourceId = key.slice("dinein:".length);
  if (!sourceId) {
    return Response.json({ success: false, error: "Invalid message key." }, { status: 400 });
  }

  try {
    const db = (await clientPromise).db();
    const result = await db.collection("customer_dine_in_requests").updateOne(
      { ...ctx.tenantFilter, _id: new ObjectId(sourceId) },
      { $set: { status: "resolved", resolvedAt: new Date(), updatedAt: new Date() } }
    );
    if (!result.matchedCount) {
      return Response.json({ success: false, error: "Request not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message || "Failed to resolve." }, { status: 500 });
  }
}
