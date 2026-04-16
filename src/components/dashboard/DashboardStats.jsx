"use client";

import StatsCard from "@/components/rms/StatsCard";
import { usePermission } from "@/hooks/usePermission";
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
          value={`$${0}`}
          subtitle="Gross before fees"
          trend={"0"}
          icon={DollarSign}
        />
      )}

      <StatsCard
        title="Orders Today"
        value={String(0)}
        subtitle="Covers + takeout"
        trend={"0"}
        icon={ShoppingBag}
      />

      {/* Customers card — admin + manager only */}
      {showCustomers && (
        <StatsCard
          title="Total Customers"
          value={"0"}
          subtitle="Registered guests"
          trend={"0"}
          icon={Users}
        />
      )}

      {/* Reservations — admin + manager (anyone with view_reservations) */}
      {hasPermission("view_reservations") && (
        <StatsCard
          title="Reservations"
          value={String("0")}
          subtitle="Active bookings"
          trend={"0"}
          icon={BookOpen}
        />
      )}
    </div>
  );
}
