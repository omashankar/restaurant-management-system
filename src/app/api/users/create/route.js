import { withTenant } from "@/lib/tenantDb";
import bcrypt from "bcryptjs";

export const POST = withTenant(
  ["admin"],
  async ({ db, tenantFilter, restaurantId, payload }, request) => {
    const { name, email, password, role, phone } = await request.json();

    if (!name?.trim() || !email?.trim() || !password || !role) {
      return Response.json({ success: false, error: "name, email, password and role are required." }, { status: 400 });
    }
    if (!["manager", "waiter", "chef"].includes(role.toLowerCase())) {
      return Response.json({ success: false, error: "Role must be manager, waiter, or chef." }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (existing) return Response.json({ success: false, error: "Email already registered." }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role.toLowerCase(),
      phone: phone?.trim() ?? "",
      restaurantId,          // ← tenant isolation
      isVerified: true,
      status: "active",
      createdAt: new Date(),
    });

    return Response.json({
      success: true,
      staff: {
        id: result.insertedId.toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role.toLowerCase(),
        phone: phone?.trim() ?? "",
        status: "active",
      },
    });
  }
);
