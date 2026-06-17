"use client";

import DashboardLoading from "@/components/dashboard/DashboardLoading";
import WaiterDashboardLoader from "@/components/dashboard/WaiterDashboardLoader";
import MainDashboard from "@/components/views/MainDashboard";
import { useUser } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Single dashboard route — each role sees only their workspace:
 *   admin / manager → MainDashboard (permission-gated widgets)
 *   waiter          → My Shift page (sidebar label: Dashboard)
 *   chef            → redirected to /kitchen
 */
export default function DashboardPage() {
  const { user, hydrated } = useUser();
  const router = useRouter();
  const role = user?.role;

  useEffect(() => {
    if (!hydrated || !role) return;
    if (role === "chef") {
      router.replace("/kitchen");
    }
  }, [hydrated, role, router]);

  if (!hydrated || !user) {
    return <DashboardLoading />;
  }

  if (role === "chef") {
    return null;
  }

  if (role === "waiter") {
    return <WaiterDashboardLoader />;
  }

  if (role === "admin" || role === "manager") {
    return <MainDashboard />;
  }

  return <DashboardLoading />;
}
