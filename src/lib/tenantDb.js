import { ObjectId } from "mongodb";
import { getTokenFromRequest } from "./authCookies";
import { verifyToken } from "./jwt";
import clientPromise from "./mongodb";

/**
 * Get authenticated user payload from request cookie.
 * Returns null if not authenticated or token invalid.
 */
export function getAuthPayload(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token); // { id, role, restaurantId, exp }
}

/**
 * Ensure tenant user + restaurant are active (blocks suspended/inactive tenants).
 */
export async function assertActiveTenantAccess(db, payload) {
  if (!payload?.id || payload.role === "super_admin") return;

  let userId;
  try {
    userId = new ObjectId(payload.id);
  } catch {
    throw Object.assign(new Error("Invalid user ID."), { status: 401 });
  }

  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { status: 1, restaurantId: 1 } },
  );
  if (!user) {
    throw Object.assign(new Error("User not found."), { status: 401 });
  }

  if ((user.status ?? "active") !== "active") {
    throw Object.assign(
      new Error("Your account is inactive. Please contact support."),
      { status: 403 },
    );
  }

  const restaurantId = user.restaurantId ?? (payload.restaurantId ? new ObjectId(payload.restaurantId) : null);
  if (!restaurantId) return;

  const restaurant = await db.collection("restaurants").findOne(
    { _id: restaurantId },
    { projection: { status: 1 } },
  );
  if (restaurant && restaurant.status !== "active") {
    throw Object.assign(
      new Error("This restaurant is not active. Please contact support."),
      { status: 403 },
    );
  }
}

/**
 * Get DB + tenant filter from request.
 * Throws structured errors for auth/access failures.
 *
 * @param {Request} request
 * @param {string[]} [allowedRoles] — if omitted, any authenticated user allowed
 * @returns {{ db, payload, tenantFilter, restaurantId }}
 */
export async function getTenantContext(request, allowedRoles) {
  const payload = getAuthPayload(request);

  if (!payload) {
    throw Object.assign(new Error("Not authenticated."), { status: 401 });
  }
  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    throw Object.assign(new Error("Access denied."), { status: 403 });
  }

  const client = await clientPromise;
  const db = client.db();

  await assertActiveTenantAccess(db, payload);

  // restaurantId from JWT payload (set at login/signup)
  const restaurantId = payload.restaurantId
    ? new ObjectId(payload.restaurantId)
    : null;

  // Every query MUST include this filter
  const tenantFilter = restaurantId ? { restaurantId } : {};

  return { db, payload, tenantFilter, restaurantId };
}

/**
 * Standard error response helper.
 */
export function errRes(message, status = 500) {
  return Response.json({ success: false, error: message }, { status });
}

/**
 * Wrap a route handler with tenant context.
 * Catches auth errors and returns proper HTTP responses.
 *
 * Usage:
 *   export const GET = withTenant(["admin","manager"], async ({ db, tenantFilter }, req) => {
 *     const items = await db.collection("orders").find(tenantFilter).toArray();
 *     return Response.json({ success: true, items });
 *   });
 */
export function withTenant(allowedRoles, handler) {
  return async (request, context) => {
    try {
      // Next.js 16: params must be awaited
      const resolvedContext = context
        ? { ...context, params: context.params ? await context.params : {} }
        : {};
      const ctx = await getTenantContext(request, allowedRoles);
      return await handler(ctx, request, resolvedContext);
    } catch (err) {
      if (err.status) return errRes(err.message, err.status);
      console.error("Route error:", err.message);
      return errRes("Something went wrong.", 500);
    }
  };
}
