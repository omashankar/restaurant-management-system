import { ObjectId } from "mongodb";

/** 1 point = ₹1 discount at checkout (max 50% of order subtotal). */
export const POINTS_TO_RUPEE = 1;
export const MAX_POINTS_REDEEM_PERCENT = 50;

/** 1 reward point per ₹10 spent (rounded down). */
export function rewardPointsForOrderTotal(total) {
  const amount = Number(total ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / 10);
}

/**
 * Credit loyalty points when a customer order is marked completed.
 * Idempotent via orders.rewardCredited flag.
 */
export async function creditCustomerRewardsOnOrderComplete(db, order) {
  if (!order || order.rewardCredited) return { credited: false, points: 0 };

  const accountId = order.customerAccountId;
  if (!accountId) return { credited: false, points: 0 };

  let oid;
  try {
    oid = accountId instanceof ObjectId ? accountId : new ObjectId(String(accountId));
  } catch {
    return { credited: false, points: 0 };
  }

  const points = rewardPointsForOrderTotal(order.total);
  if (points <= 0) return { credited: false, points: 0 };

  await db.collection("customerAccounts").updateOne(
    { _id: oid },
    { $inc: { rewardPoints: points }, $set: { updatedAt: new Date() } }
  );

  await db.collection("orders").updateOne(
    { _id: order._id },
    { $set: { rewardCredited: true, rewardPointsEarned: points, updatedAt: new Date() } }
  );

  return { credited: true, points };
}

/** Max points redeemable for a given subtotal after coupon. */
export function maxRedeemablePoints(availablePoints, taxableSubtotal) {
  const pts = Math.max(0, Math.floor(Number(availablePoints ?? 0)));
  const sub = Math.max(0, Number(taxableSubtotal ?? 0));
  const capBySubtotal = Math.floor((sub * MAX_POINTS_REDEEM_PERCENT) / 100 / POINTS_TO_RUPEE);
  return Math.min(pts, capBySubtotal);
}

export function pointsToDiscount(points) {
  const p = Math.max(0, Math.floor(Number(points ?? 0)));
  return Number((p * POINTS_TO_RUPEE).toFixed(2));
}

/**
 * Deduct loyalty points when customer redeems at checkout.
 * Returns discount amount in currency.
 */
export async function redeemCustomerPoints(db, accountId, pointsToRedeem, taxableSubtotal) {
  let oid;
  try {
    oid = accountId instanceof ObjectId ? accountId : new ObjectId(String(accountId));
  } catch {
    throw Object.assign(new Error("Invalid customer account."), { status: 400 });
  }

  const account = await db.collection("customerAccounts").findOne(
    { _id: oid },
    { projection: { rewardPoints: 1 } }
  );
  if (!account) {
    throw Object.assign(new Error("Customer account not found."), { status: 404 });
  }

  const available = Math.max(0, Math.floor(Number(account.rewardPoints ?? 0)));
  const requested = Math.max(0, Math.floor(Number(pointsToRedeem ?? 0)));
  const allowed = maxRedeemablePoints(available, taxableSubtotal);

  if (requested > allowed) {
    throw Object.assign(
      new Error(`You can redeem up to ${allowed} points on this order.`),
      { status: 400 }
    );
  }
  if (requested <= 0) return { pointsRedeemed: 0, pointsDiscount: 0 };

  const result = await db.collection("customerAccounts").updateOne(
    { _id: oid, rewardPoints: { $gte: requested } },
    { $inc: { rewardPoints: -requested }, $set: { updatedAt: new Date() } }
  );
  if (result.modifiedCount === 0) {
    throw Object.assign(new Error("Not enough reward points."), { status: 400 });
  }

  return { pointsRedeemed: requested, pointsDiscount: pointsToDiscount(requested) };
}
