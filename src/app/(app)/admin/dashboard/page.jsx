"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainDashboard from "@/components/views/MainDashboard";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <MainDashboard />
    </ProtectedRoute>
  );
}
