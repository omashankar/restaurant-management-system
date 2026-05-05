import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";
import { unlink } from "node:fs/promises";
import path from "node:path";

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

function toUploadDiskPath(urlPath) {
  if (!urlPath || typeof urlPath !== "string" || !urlPath.startsWith("/uploads/")) return null;
  return path.join(process.cwd(), "public", ...urlPath.replace(/^\//, "").split("/"));
}

async function removeUploadedImage(urlPath) {
  const diskPath = toUploadDiskPath(urlPath);
  if (!diskPath) return;
  try {
    await unlink(diskPath);
  } catch {
    // Ignore missing-file cleanup failures.
  }
}

/* PATCH /api/tables/areas/:id */
export const PATCH = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const existing = await db.collection("tableAreas").findOne(filter);
    if (!existing) return Response.json({ success: false, error: "Area not found." }, { status: 404 });

    const { name, description, color, imageUrl } = await request.json();
    if (!name?.trim()) return Response.json({ success: false, error: "Name is required." }, { status: 400 });

    const nextImageUrl = imageUrl?.trim() || "";
    const result = await db.collection("tableAreas").updateOne(filter, {
      $set: {
        name: name.trim(),
        description: description?.trim() ?? "",
        color: color ?? "emerald",
        imageUrl: nextImageUrl,
        updatedAt: new Date(),
      },
    });

    if (result.matchedCount === 0) return Response.json({ success: false, error: "Area not found." }, { status: 404 });
    if (existing.imageUrl && existing.imageUrl !== nextImageUrl) {
      await removeUploadedImage(existing.imageUrl);
    }
    return Response.json({ success: true });
  }
);

/* DELETE /api/tables/areas/:id */
export const DELETE = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const existing = await db.collection("tableAreas").findOne(filter);
    await db.collection("tableAreas").deleteOne(filter);
    // Clear categoryId from tables using this area
    await db.collection("tables").updateMany(
      { ...tenantFilter, categoryId: params.id },
      { $set: { categoryId: null } }
    );
    if (existing?.imageUrl) {
      await removeUploadedImage(existing.imageUrl);
    }

    return Response.json({ success: true });
  }
);
