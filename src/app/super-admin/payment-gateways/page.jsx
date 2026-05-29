import { redirect } from "next/navigation";

/** Legacy URL — gateway config lives in Settings → Payment. */
export default function PaymentGatewaysRedirect() {
  redirect("/super-admin/settings?tab=payment");
}
