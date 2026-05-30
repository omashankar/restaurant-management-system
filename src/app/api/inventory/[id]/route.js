import { withTenant } from "@/lib/tenantDb";
import { sendLowStockAlertWhatsApp } from "@/lib/whatsappService";
import { getRestaurantNotificationPrefs } from "@/lib/restaurantNotificationPrefs";
import { parseSchema, inventoryItemSchema } from "@/lib/validationSchemas";
import { ObjectId } from "mongodb";

const PATCH_FIELDS = [
  "name", "category", "quantity", "unit", "reorderLevel", "maxLevel", "supplier", "notes",
];

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

async function logQuantityChange(db, tenantFilter, payload, existing, nextQty, message) {
  const delta = nextQty - Number(existing.quantity ?? 0);
  if (delta === 0) return;
  await db.collection("inventoryHistory").insertOne({
    ...tenantFilter,
    itemId: existing._id.toString(),
    itemName: existing.name ?? "",
    delta,
    message: message ?? (delta > 0 ? `Stock increased by ${delta}` : `Stock decreased by ${Math.abs(delta)}`),
    createdBy: new ObjectId(payload.id),
    createdAt: new Date(),
  });
}

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    const existing = await db.collection("inventory").findOne({ ...tenantFilter, _id });
    if (!existing) return Response.json({ success: false, error: "Item not found." }, { status: 404 });

    const touchesItem = PATCH_FIELDS.some((k) => body[k] !== undefined);
    let validated = null;
    if (touchesItem) {
      try {
        validated = parseSchema(inventoryItemSchema, {
          name: body.name ?? existing.name,
          category: body.category ?? existing.category,
          quantity:
            body.quantity != null
              ? Math.max(0, Number(body.quantity) || 0)
              : existing.quantity,
          unit: body.unit ?? existing.unit,
          reorderLevel:
            body.reorderLevel != null
              ? Math.max(0, Number(body.reorderLevel) || 0)
              : existing.reorderLevel,
          supplier: body.supplier ?? existing.supplier,
          notes: body.notes ?? existing.notes,
        });
      } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 400 });
      }
    }

    const update = { updatedAt: new Date() };
    if (validated) {
      update.name = validated.name;
      update.category = validated.category?.trim() ?? existing.category;
      update.unit = validated.unit;
      update.quantity = validated.quantity ?? existing.quantity;
      update.reorderLevel = validated.reorderLevel ?? existing.reorderLevel;
      update.supplier = validated.supplier ?? "";
      update.notes = validated.notes ?? "";
    }
    if (body.maxLevel !== undefined) update.maxLevel = body.maxLevel != null && body.maxLevel !== "" ? String(body.maxLevel) : "";

    if (Object.keys(update).length === 1) {
      return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
    }

    const result = await db.collection("inventory").updateOne(
      { ...tenantFilter, _id },
      { $set: update }
    );
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Item not found." }, { status: 404 });

    if (update.quantity != null && update.quantity !== Number(existing.quantity ?? 0)) {
      await logQuantityChange(
        db,
        tenantFilter,
        payload,
        existing,
        update.quantity,
        body.historyMessage
      );

      const reorderLevel = update.reorderLevel ?? existing.reorderLevel ?? 0;
      const wasAbove = Number(existing.quantity ?? 0) > Number(reorderLevel);
      const nowLow = update.quantity <= Number(reorderLevel);
      if (wasAbove && nowLow && reorderLevel > 0) {
        const prefs = await getRestaurantNotificationPrefs(db, tenantFilter.restaurantId);
        if (prefs.lowStockAlerts && prefs.smsNotifications) {
          sendLowStockAlertWhatsApp({
            item: { ...existing, ...update, quantity: update.quantity },
            db,
            restaurantId: tenantFilter.restaurantId,
          }).catch(() => {});
        }
      }
    }

    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const result = await db.collection("inventory").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Item not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
