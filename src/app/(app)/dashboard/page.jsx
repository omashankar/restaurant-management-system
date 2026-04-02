"use client";

import AdminDashboard from "@/components/views/AdminDashboard";
import ManagerDashboard from "@/components/views/ManagerDashboard";
import { useApp } from "@/context/AppProviders";

export default function DashboardPage() {
  const { user } = useApp();
  if (!user) return null;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "manager") return <ManagerDashboard />;
  return null;
}
