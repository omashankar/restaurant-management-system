/**
 * Landing Sections — single item
 * Path: /api/landing-sections/[id]
 *
 * PUT    — Super Admin only. Update section (including icon).
 * DELETE — Super Admin only. Delete section.
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ─────────────────────────────────────────
   PUT /api/landing-sections/[id]
───────────────────────────────────────── */
export async function PUT(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json(
      { success: false, error: "Forbidden. Super Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { title, description, icon, order, isActive } = body;

  if (!title || !description || !icon) {
    return Response.json(
      { success: false, error: "title, description, and icon are required." },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("landing_sections").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          description,
          icon,
          order: order ?? 0,
          isActive: isActive ?? true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return Response.json(
        { success: false, error: "Section not found." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      section: {
        id: result._id.toString(),
        title: result.title,
        description: result.description,
        icon: result.icon,
        order: result.order,
        isActive: result.isActive,
      },
    });
  } catch (err) {
    console.error("PUT /api/landing-sections/[id] error:", err.message);
    return Response.json(
      { success: false, error: "Failed to update section." },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   DELETE /api/landing-sections/[id]
───────────────────────────────────────── */
export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json(
      { success: false, error: "Forbidden. Super Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const client = await clientPromise;
    const db = client.db();

    const result = await db
      .collection("landing_sections")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json(
        { success: false, error: "Section not found." },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/landing-sections/[id] error:", err.message);
    return Response.json(
      { success: false, error: "Failed to delete section." },
      { status: 500 }
    );
  }
}
