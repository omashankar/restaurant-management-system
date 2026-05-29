import { redirect } from "next/navigation";

/** Removed — legacy URL redirects to dashboard. */
export default function RestaurantPaymentsRemovedRedirect() {
  redirect("/super-admin/dashboard");
}
