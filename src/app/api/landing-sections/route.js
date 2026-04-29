/**
 * Landing Sections API
 * Path: /api/landing-sections
 *
 * GET  — Public. Returns all active sections sorted by order.
 * POST — Super Admin only. Create new section.
 *
 * Collection: landing_sections
 * Schema:
 *   - title: string
 *   - description: string
 *   - icon: string (icon name from lucide-react)
 *   - order: number
 *   - isActive: boolean
 *   - createdAt: Date
 *   - updatedAt: Date
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ─────────────────────────────────────────
   GET /api/landing-sections
   Public — returns all active sections
───────────────────────────────────────── */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const sections = await db
      .collection("landing_sections")
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

    return Response.json({
      success: true,
      sections: sections.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        description: s.description,
        icon: s.icon,
        order: s.order,
      })),
    });
  } catch (err) {
    console.error("GET /api/landing-sections error:", err.message);
    return Response.json(
      { success: false, error: "Failed to fetch sections." },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   POST /api/landing-sections
   Super Admin only — create new section
───────────────────────────────────────── */
export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json(
      { success: false, error: "Forbidden. Super Admin access required." },
      { status: 403 }
    );
  }

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

    const doc = {
      title,
      description,
      icon,
      order: order ?? 0,
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("landing_sections").insertOne(doc);

    return Response.json(
      {
        success: true,
        section: {
          id: result.insertedId.toString(),
          ...doc,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/landing-sections error:", err.message);
    return Response.json(
      { success: false, error: "Failed to create section." },
      { status: 500 }
    );
  }
}
