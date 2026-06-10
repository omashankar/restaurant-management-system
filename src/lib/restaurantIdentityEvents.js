/** Browser event so admin + customer hooks refetch name/logo after settings save. */
export const RESTAURANT_IDENTITY_UPDATED = "rms:restaurant-identity-updated";

/** Customer-site CMS publish (header logo, layout, etc.). */
export const RESTAURANT_CMS_UPDATED = "rms:restaurant-cms-updated";

export function notifyRestaurantIdentityUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RESTAURANT_IDENTITY_UPDATED));
  }
}

export function notifyRestaurantCmsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RESTAURANT_CMS_UPDATED));
  }
}
