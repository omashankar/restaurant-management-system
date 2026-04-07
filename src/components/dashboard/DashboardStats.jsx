"use client";

import StatsCard from "@/components/rms/StatsCard";
import { usePermission } from "@/hooks/usePermission";
import { dashboardStats } from "@/lib/mockData";
import { BookOpen, DollarSign, ShoppingBag, Users } from "lucide-react";

export default function DashboardStats() {
  const { hasPermission } = usePermission();

  const showSales = hasPermission("view_sales");
  const showCustomers = hasPermission("manage_customers");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Always visible to anyone with view_sales */}
      {showSales && (
        <StatsCard
          title="Sales Today"
          value={`$${dashboardStats.salesToday.toLocaleString()}`}
          subtitle="Gross before fees"
          trend={dashboardStats.salesChange}
          icon={DollarSign}
        />
      )}

      <StatsCard
        title="Orders Today"
        value={String(dashboardStats.ordersToday)}
        subtitle="Covers + takeout"
        trend={dashboardStats.ordersChange}
        icon={ShoppingBag}
      />

      {/* Customers card — admin + manager only */}
      {showCustomers && (
        <StatsCard
          title="Total Customers"
          value={dashboardStats.totalCustomers.toLocaleString()}
          subtitle="Registered guests"
          trend={dashboardStats.customersChange}
          icon={Users}
        />
      )}

      {/* Reservations — admin + manager (anyone with view_reservations) */}
      {hasPermission("view_reservations") && (
        <StatsCard
          title="Reservations"
          value={String(dashboardStats.totalReservations)}
          subtitle="Active bookings"
          trend={dashboardStats.reservationsChange}
          icon={BookOpen}
        />
      )}
    </div>
  );
}
