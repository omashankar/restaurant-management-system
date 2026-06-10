import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

const ALLOWED_STATUSES = ["new", "read", "replied", "archived"];

function toOid(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();
  return ALLOWED_STATUSES.includes(value) ? value : "new";
}

export const GET = withTenant(["admin", "manager"], async ({ db, restaurantId }, request, { params }) => {
  const { id } = params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  const doc = await db.collection("contact_messages").findOne({
    _id,
    restaurantId,
    source: "customer_site",
  });
  if (!doc) return Response.json({ success: false, error: "Message not found." }, { status: 404 });

  if (normalizeStatus(doc.status) === "new") {
    await db.collection("contact_messages").updateOne(
      { _id },
      { $set: { status: "read", updatedAt: new Date() } }
    );
    doc.status = "read";
  }

  return Response.json({
    success: true,
    message: {
      ...doc,
      _id: String(doc._id),
      status: normalizeStatus(doc.status),
    },
  });
});

export const PATCH = withTenant(["admin", "manager"], async ({ db, restaurantId }, request, { params }) => {
  const { id } = params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  const status = String(body?.status ?? "").trim().toLowerCase();
  if (!ALLOWED_STATUSES.includes(status)) {
    return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
  }

  const result = await db.collection("contact_messages").updateOne(
    { _id, restaurantId, source: "customer_site" },
    { $set: { status, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) {
    return Response.json({ success: false, error: "Message not found." }, { status: 404 });
  }

  const doc = await db.collection("contact_messages").findOne({ _id });
  return Response.json({
    success: true,
    message: { ...doc, _id: String(doc._id), status: normalizeStatus(doc.status) },
  });
});
