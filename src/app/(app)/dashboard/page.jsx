"use client";

import MainDashboard from "@/components/views/MainDashboard";
import ChefDashboard from "@/components/views/ChefDashboard";
import WaiterDashboard from "@/components/views/WaiterDashboard";
import { usePermission } from "@/hooks/usePermission";

export default function DashboardPage() {
  const { role } = usePermission();

  // Waiter and Chef have dedicated operational views
  if (role === "waiter") return <WaiterDashboard />;
  if (role === "chef") return <ChefDashboard />;

  // Admin and Manager share the exact same component — gated by permissions
  return <MainDashboard />;
}
