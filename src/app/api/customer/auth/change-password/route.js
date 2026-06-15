import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function POST(request) {
  const token = getCustomerTokenFromRequest(request);
  if (!token) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

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

  const current = String(body?.current ?? "");
  const next = String(body?.next ?? "");
  const confirm = String(body?.confirm ?? body?.next ?? "");

  if (!current || !next) {
    return Response.json({ success: false, error: "Current and new password are required." }, { status: 400 });
  }
  if (next.length < 6) {
    return Response.json({ success: false, error: "New password must be at least 6 characters." }, { status: 400 });
  }
  if (next !== confirm) {
    return Response.json({ success: false, error: "Passwords do not match." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const account = await db.collection("customerAccounts").findOne({
      _id: new ObjectId(payload.id),
    });

    if (!account?.passwordHash) {
      return Response.json(
        { success: false, error: "Password login is not set up for this account. Use OTP or contact support." },
        { status: 400 },
      );
    }

    const match = await bcrypt.compare(current, account.passwordHash);
    if (!match) {
      return Response.json({ success: false, error: "Current password is incorrect." }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(next, 12);
    await db.collection("customerAccounts").updateOne(
      { _id: account._id },
      { $set: { passwordHash, updatedAt: new Date() } },
    );

    return Response.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("customer.auth.change-password failed:", err.message);
    return Response.json({ success: false, error: "Failed to change password." }, { status: 500 });
  }
}
