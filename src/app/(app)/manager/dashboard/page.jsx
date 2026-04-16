"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainDashboard from "@/components/views/MainDashboard";

export default function ManagerDashboardPage() {
  return (
    <ProtectedRoute roles={["manager"]}>
      <MainDashboard />
    </ProtectedRoute>
  );
}
