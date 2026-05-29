/** Read tenant notification preferences from restaurant_settings. */
export async function getRestaurantNotificationPrefs(db, restaurantId) {
  const doc = await db.collection("restaurant_settings").findOne(
    { restaurantId },
    { projection: { notifications: 1, contact: 1 } },
  ).catch(() => null);

  const notifications = doc?.notifications ?? {};

  return {
    orderNotifications: notifications.orderNotifications !== false,
    reservationAlerts: notifications.reservationAlerts !== false,
    lowStockAlerts: notifications.lowStockAlerts !== false,
    emailNotifications: notifications.emailNotifications === true,
    smsNotifications: notifications.smsNotifications === true,
    alertEmail: String(doc?.contact?.email ?? "").trim(),
  };
}
