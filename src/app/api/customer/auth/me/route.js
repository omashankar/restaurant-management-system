import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { ObjectId } from "mongodb";

export async function GET(request) {
  const token = getCustomerTokenFromRequest(request);
  if (!token) return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });

  const payload = verifyCustomerToken(token);
  if (!payload?.id) {
    return Response.json({ success: false, error: "Invalid token." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const account = await db.collection("customerAccounts").findOne(
      { _id: new ObjectId(payload.id) },
      { projection: { passwordHash: 0 } }
    );
    if (!account) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id: String(account._id),
        name: account.name ?? "",
        phone: account.phone ?? "",
        email: account.email ?? "",
        createdAt: account.createdAt ?? null,
      },
    });
  } catch (err) {
    console.error("customer.auth.me failed:", err.message);
    return Response.json({ success: false, error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const token = getCustomerTokenFromRequest(request);
  if (!token) return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });

  const payload = verifyCustomerToken(token);
  if (!payload?.id) {
    return Response.json({ success: false, error: "Invalid token." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const nameRaw = body?.name !== undefined ? String(body.name).trim() : null;
  const emailRaw = body?.email !== undefined ? String(body.email).trim().toLowerCase() : null;

  const updates = { updatedAt: new Date() };
  if (nameRaw !== null) {
    if (nameRaw.length > 120) {
      return Response.json({ success: false, error: "Name is too long." }, { status: 400 });
    }
    updates.name = nameRaw;
  }
  if (emailRaw !== null) {
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return Response.json({ success: false, error: "Invalid email address." }, { status: 400 });
    }
    updates.email = emailRaw || null;
  }

  if (Object.keys(updates).length <= 1) {
    return Response.json({ success: false, error: "No changes provided." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("customerAccounts").updateOne(
      { _id: new ObjectId(payload.id) },
      { $set: updates }
    );
    if (result.matchedCount === 0) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    const account = await db.collection("customerAccounts").findOne(
      { _id: new ObjectId(payload.id) },
      { projection: { passwordHash: 0 } }
    );

    return Response.json({
      success: true,
      user: {
        id: String(account._id),
        name: account.name ?? "",
        phone: account.phone ?? "",
        email: account.email ?? "",
        createdAt: account.createdAt ?? null,
      },
    });
  } catch (err) {
    console.error("customer.auth.me PATCH failed:", err.message);
    return Response.json({ success: false, error: "Failed to update profile." }, { status: 500 });
  }
}
