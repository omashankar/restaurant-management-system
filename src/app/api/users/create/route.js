import { withTenant } from "@/lib/tenantDb";
import { parseSchema, staffCreateSchema } from "@/lib/validationSchemas";
import bcrypt from "bcryptjs";

export const POST = withTenant(
  ["admin"],
  async ({ db, tenantFilter, restaurantId, payload }, request) => {
    const body = await request.json();
    let data;
    try {
      data = parseSchema(staffCreateSchema, body);
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }
    const { name, email, password, role, phone } = data;

    const existing = await db.collection("users").findOne({ email });
    if (existing) return Response.json({ success: false, error: "Email already registered." }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role,
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
        name,
        email,
        role,
        phone: phone?.trim() ?? "",
        status: "active",
      },
    });
  }
);
