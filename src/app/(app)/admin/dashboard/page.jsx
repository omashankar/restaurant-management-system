import { redirect } from "next/navigation";

/** Single dashboard URL — live data on /dashboard */
export default function AdminDashboardRedirect() {
  redirect("/dashboard");
}
